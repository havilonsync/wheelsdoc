import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserOrg } from "@/lib/auth"
import { UpdateLoadSchema } from "@/lib/validators"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedDriver: { select: { id: true, name: true, email: true, phone: true } },
      stops: { orderBy: { stopNumber: "asc" } },
      parties: true,
      documents: {
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      signatures: { orderBy: { signedAt: "desc" } },
      gpsEvents: { orderBy: { timestamp: "asc" } },
      reconciliationChecks: { orderBy: { createdAt: "desc" } },
      reconciliationResult: true,
      invoice: { include: { lineItems: true } },
      factoringPacket: true,
      notes: {
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
      template: true,
    },
  })

  if (!load) {
    return Response.json({ error: "Load not found" }, { status: 404 })
  }

  const membership = await getUserOrg(session.user.id)
  if (!membership || load.orgId !== membership.orgId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  return Response.json({ load })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const membership = await getUserOrg(session.user.id)
  if (!membership) {
    return Response.json({ error: "No organization found" }, { status: 403 })
  }

  const load = await prisma.load.findUnique({ where: { id } })
  if (!load || load.orgId !== membership.orgId) {
    return Response.json({ error: "Load not found" }, { status: 404 })
  }

  const body = await request.json()
  const result = UpdateLoadSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const {
    stops: _stops,
    shipperName: _sn,
    shipperAddress: _sa,
    shipperCity: _sc,
    shipperState: _ss,
    shipperZip: _sz,
    consigneeName: _cn,
    consigneeAddress: _ca,
    consigneeCity: _cc,
    consigneeState: _cs,
    consigneeZip: _cz,
    agreedRate,
    fuelSurcharge,
    mileage,
    tempMin,
    tempMax,
    ...updateData
  } = result.data

  const updated = await prisma.load.update({
    where: { id },
    data: {
      ...updateData,
      ...(agreedRate !== undefined ? { agreedRate } : {}),
      ...(fuelSurcharge !== undefined ? { fuelSurcharge } : {}),
      ...(mileage !== undefined ? { mileage } : {}),
      ...(tempMin !== undefined ? { tempMin } : {}),
      ...(tempMax !== undefined ? { tempMax } : {}),
    },
  })

  return Response.json({ load: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const membership = await getUserOrg(session.user.id)
  if (!membership) {
    return Response.json({ error: "No organization found" }, { status: 403 })
  }

  const load = await prisma.load.findUnique({ where: { id } })
  if (!load || load.orgId !== membership.orgId) {
    return Response.json({ error: "Load not found" }, { status: 404 })
  }

  const archived = await prisma.load.update({
    where: { id },
    data: { status: "ARCHIVED" },
  })

  return Response.json({ load: archived })
}
