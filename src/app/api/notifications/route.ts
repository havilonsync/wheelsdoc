import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, channel: "IN_APP" },
    orderBy: [{ read: "asc" }, { sentAt: "desc" }],
    take: 50,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })

  return Response.json({ notifications, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { ids, markAll } = body as { ids?: string[]; markAll?: boolean }

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: new Date() },
    })
  } else if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { read: true, readAt: new Date() },
    })
  }

  return Response.json({ success: true })
}
