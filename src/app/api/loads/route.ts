import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserOrg } from "@/lib/auth"
import { CreateLoadSchema } from "@/lib/validators"
import { generateLoadNumber } from "@/lib/utils"
import { LoadStatus } from "@/generated/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getUserOrg(session.user.id)
  if (!membership) {
    return Response.json({ error: "No organization found" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const status = searchParams.get("status") as LoadStatus | null
  const search = searchParams.get("search") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = parseInt(searchParams.get("limit") ?? "20", 10)
  const skip = (page - 1) * limit

  const where = {
    orgId: membership.orgId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { loadNumber: { contains: search, mode: "insensitive" as const } },
            { bolNumber: { contains: search, mode: "insensitive" as const } },
            { poNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    status: { not: "ARCHIVED" as LoadStatus },
  }

  const [loads, total] = await Promise.all([
    prisma.load.findMany({
      where,
      include: {
        assignedDriver: { select: { id: true, name: true, email: true } },
        stops: { orderBy: { stopNumber: "asc" } },
        _count: { select: { documents: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.load.count({ where }),
  ])

  return Response.json({
    loads,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getUserOrg(session.user.id)
  if (!membership) {
    return Response.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const result = CreateLoadSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const {
    stops,
    shipperName,
    shipperAddress,
    shipperCity,
    shipperState,
    shipperZip,
    consigneeName,
    consigneeAddress,
    consigneeCity,
    consigneeState,
    consigneeZip,
    agreedRate,
    fuelSurcharge,
    mileage,
    tempMin,
    tempMax,
    ...loadData
  } = result.data

  const load = await prisma.load.create({
    data: {
      ...loadData,
      loadNumber: generateLoadNumber(),
      orgId: membership.orgId,
      createdById: session.user.id,
      agreedRate: agreedRate ?? 0,
      fuelSurcharge: fuelSurcharge ?? 0,
      ...(mileage !== undefined ? { mileage } : {}),
      ...(tempMin !== undefined ? { tempMin } : {}),
      ...(tempMax !== undefined ? { tempMax } : {}),
      stops: {
        create: stops.map((stop) => ({
          ...stop,
          ...(stop.quantity !== undefined ? { quantity: stop.quantity } : {}),
          ...(stop.weight !== undefined ? { weight: stop.weight } : {}),
        })),
      },
      parties: {
        create: [
          ...(shipperName
            ? [
                {
                  partyType: "SHIPPER" as const,
                  name: shipperName,
                  address: shipperAddress,
                  city: shipperCity,
                  state: shipperState,
                  zip: shipperZip,
                },
              ]
            : []),
          ...(consigneeName
            ? [
                {
                  partyType: "CONSIGNEE" as const,
                  name: consigneeName,
                  address: consigneeAddress,
                  city: consigneeCity,
                  state: consigneeState,
                  zip: consigneeZip,
                },
              ]
            : []),
        ],
      },
    },
    include: { stops: true, parties: true },
  })

  return Response.json({ load }, { status: 201 })
}
