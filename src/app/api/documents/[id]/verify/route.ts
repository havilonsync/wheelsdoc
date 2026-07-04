import { NextRequest, NextResponse } from "next/server"
import { auth, getUserOrg } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { UserRole } from "@/generated/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await getUserOrg(session.user.id)
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 })

  const role = membership.role as UserRole
  if (!hasPermission(role, "edit_load")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: documentId } = await params

  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { status } = body
  if (!status || !["VERIFIED", "DISPUTED", "UNVERIFIED"].includes(status)) {
    return NextResponse.json({ error: "status must be VERIFIED, DISPUTED, or UNVERIFIED" }, { status: 400 })
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, load: { orgId: membership.orgId } },
    select: { id: true },
  })
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      verificationStatus: status as never,
      verifiedById: status !== "UNVERIFIED" ? session.user.id : null,
      verifiedAt: status !== "UNVERIFIED" ? new Date() : null,
    },
    select: {
      id: true,
      verificationStatus: true,
      verifiedAt: true,
      verifiedBy: { select: { name: true } },
    },
  })

  return NextResponse.json({ document: updated })
}
