import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserOrg } from "@/lib/auth"
import { LoadStatus } from "@/generated/prisma"

const ALLOWED_TRANSITIONS: Partial<Record<LoadStatus, LoadStatus[]>> = {
  DRAFT: ["ASSIGNED"],
  ASSIGNED: ["ACCEPTED", "DRAFT"],
  ACCEPTED: ["EN_ROUTE_PICKUP"],
  EN_ROUTE_PICKUP: ["ARRIVED_PICKUP"],
  ARRIVED_PICKUP: ["LOADING"],
  LOADING: ["DEPARTED_PICKUP"],
  DEPARTED_PICKUP: ["EN_ROUTE_DELIVERY"],
  EN_ROUTE_DELIVERY: ["ARRIVED_DELIVERY"],
  ARRIVED_DELIVERY: ["UNLOADING"],
  UNLOADING: ["DELIVERED"],
  DELIVERED: ["DOCS_NEEDED", "RECONCILIATION_NEEDED"],
  DOCS_NEEDED: ["RECONCILIATION_NEEDED"],
  RECONCILIATION_NEEDED: ["RECONCILED"],
  RECONCILED: ["INVOICE_READY"],
  INVOICE_READY: ["SUBMITTED_TO_FACTORING", "PAID"],
  SUBMITTED_TO_FACTORING: ["PAID", "DISPUTED"],
  DISPUTED: ["RECONCILIATION_NEEDED", "PAID"],
}

export async function POST(
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
  const newStatus = body.status as LoadStatus
  if (!newStatus) {
    return Response.json({ error: "Status is required" }, { status: 400 })
  }

  const allowed = ALLOWED_TRANSITIONS[load.status] ?? []
  if (!allowed.includes(newStatus)) {
    return Response.json(
      {
        error: `Cannot transition from ${load.status} to ${newStatus}`,
        allowed,
      },
      { status: 422 }
    )
  }

  const [updated] = await prisma.$transaction([
    prisma.load.update({ where: { id }, data: { status: newStatus } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        orgId: membership.orgId,
        loadId: id,
        action: "STATUS_CHANGE",
        entityType: "Load",
        entityId: id,
        oldValue: { status: load.status },
        newValue: { status: newStatus },
      },
    }),
    prisma.notification.create({
      data: {
        userId: load.createdById,
        orgId: membership.orgId,
        loadId: id,
        type: "LOAD_STATUS_CHANGED",
        title: "Load status updated",
        body: `Load ${load.loadNumber} moved to ${newStatus.replace(/_/g, " ")}`,
        channel: "IN_APP",
      },
    }),
  ])

  return Response.json({ load: updated })
}
