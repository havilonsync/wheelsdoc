import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, LoadStatus } from "@/generated/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LoadStatusBadge } from "@/components/loads/load-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getUserOrg(session.user.id)
  if (!membership) redirect("/login")

  const role = membership.role as UserRole
  const orgId = membership.orgId

  if (role === "DRIVER") {
    const myLoads = await prisma.load.findMany({
      where: { assignedDriverId: session.user.id, status: { not: "ARCHIVED" } },
      include: { stops: { orderBy: { stopNumber: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    })

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Here are your assigned loads
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Loads ({myLoads.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {myLoads.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">
                No loads assigned yet
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {myLoads.map((load) => {
                  const pickup = load.stops.find((s) => s.stopType === "PICKUP")
                  const delivery = load.stops.find(
                    (s) => s.stopType === "DELIVERY"
                  )
                  return (
                    <Link
                      key={load.id}
                      href={`/loads/${load.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1E3A5F] font-mono">
                          {load.loadNumber}
                        </p>
                        {pickup && delivery && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {pickup.city}, {pickup.state} →{" "}
                            {delivery.city}, {delivery.state}
                          </p>
                        )}
                      </div>
                      <LoadStatusBadge status={load.status} />
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const ACTIVE_STATUSES: LoadStatus[] = [
    "ASSIGNED",
    "ACCEPTED",
    "EN_ROUTE_PICKUP",
    "ARRIVED_PICKUP",
    "LOADING",
    "DEPARTED_PICKUP",
    "EN_ROUTE_DELIVERY",
    "ARRIVED_DELIVERY",
    "UNLOADING",
  ]

  const [statusCounts, recentLoads, docsNeeded, reconcileNeeded] =
    await Promise.all([
      prisma.load.groupBy({
        by: ["status"],
        where: { orgId, status: { not: "ARCHIVED" } },
        _count: true,
      }),
      prisma.load.findMany({
        where: { orgId, status: { not: "ARCHIVED" } },
        include: {
          assignedDriver: { select: { name: true } },
          stops: { orderBy: { stopNumber: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.load.count({
        where: { orgId, status: "DOCS_NEEDED" },
      }),
      prisma.load.count({
        where: { orgId, status: "RECONCILIATION_NEEDED" },
      }),
    ])

  const activeCount = statusCounts
    .filter((s) => ACTIVE_STATUSES.includes(s.status as LoadStatus))
    .reduce((sum, s) => sum + s._count, 0)

  const deliveredCount =
    statusCounts.find((s) => s.status === "DELIVERED")?._count ?? 0

  const paidCount =
    statusCounts.find((s) => s.status === "PAID")?._count ?? 0

  const statsCards = [
    {
      label: "Active Loads",
      value: activeCount,
      color: "text-[#1E3A5F]",
      bg: "bg-blue-50",
    },
    {
      label: "Delivered",
      value: deliveredCount,
      color: "text-[#10B981]",
      bg: "bg-green-50",
    },
    {
      label: "Docs Needed",
      value: docsNeeded,
      color: "text-[#EF4444]",
      bg: "bg-red-50",
    },
    {
      label: "Needs Reconciliation",
      value: reconcileNeeded,
      color: "text-[#F97316]",
      bg: "bg-orange-50",
    },
    {
      label: "Paid",
      value: paidCount,
      color: "text-[#10B981]",
      bg: "bg-green-50",
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {membership.organization.name} · {formatDate(new Date(), "EEEE, MMM d")}
          </p>
        </div>
        <Link
          href="/loads/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-semibold hover:bg-[#162d4a] transition"
        >
          + New Load
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className={`${stat.bg} rounded-xl py-4`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(docsNeeded > 0 || reconcileNeeded > 0) && (
        <Card className="border-[#F97316]/30 bg-orange-50/50">
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-[#F97316] mb-1">
              Revenue Leakage Alerts
            </p>
            <div className="flex gap-4 text-sm text-gray-600">
              {docsNeeded > 0 && (
                <Link
                  href="/loads?status=DOCS_NEEDED"
                  className="hover:text-[#1E3A5F] transition"
                >
                  {docsNeeded} load{docsNeeded !== 1 ? "s" : ""} missing docs
                </Link>
              )}
              {reconcileNeeded > 0 && (
                <Link
                  href="/loads?status=RECONCILIATION_NEEDED"
                  className="hover:text-[#1E3A5F] transition"
                >
                  {reconcileNeeded} load{reconcileNeeded !== 1 ? "s" : ""}{" "}
                  need reconciliation
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Loads</CardTitle>
            <Link
              href="/loads"
              className="text-xs text-[#1E3A5F] hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Load #
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLoads.map((load) => {
                const pickup = load.stops.find((s) => s.stopType === "PICKUP")
                const delivery = load.stops.find(
                  (s) => s.stopType === "DELIVERY"
                )
                return (
                  <tr
                    key={load.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/loads/${load.id}`}
                        className="font-mono font-semibold text-[#1E3A5F] hover:underline text-xs"
                      >
                        {load.loadNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {pickup && delivery
                        ? `${pickup.city} → ${delivery.city}`
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {load.assignedDriver?.name ?? "Unassigned"}
                    </td>
                    <td className="px-6 py-3">
                      <LoadStatusBadge status={load.status} />
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700 text-xs font-semibold">
                      {formatCurrency(load.agreedRate.toString())}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {recentLoads.length === 0 && (
            <p className="text-sm text-gray-400 px-6 py-8 text-center">
              No loads yet.{" "}
              <Link href="/loads/new" className="text-[#1E3A5F] hover:underline">
                Create your first load
              </Link>
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
