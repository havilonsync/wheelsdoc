import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { UserRole } from "@/generated/prisma"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const membership = await getUserOrg(session.user.id)
  const role: UserRole = (membership?.role as UserRole) ?? "DRIVER"

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          userName={session.user.name}
          userEmail={session.user.email}
          userAvatar={session.user.image}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
