import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LoadStatus } from "@/generated/prisma"
import { LoadStatusBadge } from "@/components/loads/load-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"

const STATUS_TABS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Active", value: "ASSIGNED" },
  { label: "En Route", value: "EN_ROUTE_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Docs Needed", value: "DOCS_NEEDED" },
  { label: "Invoice Ready", value: "INVOICE_READY" },
  { label: "Paid", value: "PAID" },
]

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getUserOrg(session.user.id)
  if (!membership) redirect("/login")

  const params = await searchParams
  const statusFilter = (params.status as LoadStatus) || undefined
  const search = params.search ?? ""
  const page = parseInt(params.page ?? "1", 10)
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    orgId: membership.orgId,
    status: statusFilter
      ? (statusFilter as LoadStatus)
      : { not: "ARCHIVED" as LoadStatus },
    ...(search
      ? {
          OR: [
            { loadNumber: { contains: search, mode: "insensitive" as const } },
            { bolNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [loads, total] = await Promise.all([
    prisma.load.findMany({
      where,
      include: {
        assignedDriver: { select: { name: true } },
        stops: { orderBy: { stopNumber: "asc" }, take: 2 },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.load.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  function buildUrl(overrides: Record<string, string | null>) {
    const p = new URLSearchParams()
    const merged = {
      status: statusFilter ?? null,
      search: search || null,
      page: String(page),
      ...overrides,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "null") p.set(k, v)
    }
    return `/loads?${p.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Loads ({total})
        </h2>
        <Link
          href="/loads/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-semibold hover:bg-[#162d4a] transition"
        >
          + New Load
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex overflow-x-auto gap-1 rounded-lg bg-gray-100 p-1 shrink-0">
          {STATUS_TABS.map((tab) => {
            const active =
              (tab.value === null && !statusFilter) ||
              tab.value === statusFilter
            return (
              <Link
                key={tab.label}
                href={buildUrl({ status: tab.value, page: "1" })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-white text-[#1E3A5F] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        <form method="get" action="/loads" className="flex-1">
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by load # or BOL…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
          />
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Load #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loads.map((load) => {
                const pickup = load.stops.find((s) => s.stopType === "PICKUP")
                const delivery = load.stops.find(
                  (s) => s.stopType === "DELIVERY"
                )
                return (
                  <tr key={load.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/loads/${load.id}`}
                        className="font-mono text-xs font-semibold text-[#1E3A5F] hover:underline"
                      >
                        {load.loadNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {pickup && delivery
                        ? `${pickup.city}, ${pickup.state} → ${delivery.city}, ${delivery.state}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {load.assignedDriver?.name ?? (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <LoadStatusBadge status={load.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 text-xs font-semibold">
                      {formatCurrency(load.agreedRate.toString())}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {formatDate(load.updatedAt, "MMM d")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {loads.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400 text-sm">No loads found</p>
              <Link
                href="/loads/new"
                className="mt-2 inline-block text-sm text-[#1E3A5F] hover:underline"
              >
                Create your first load →
              </Link>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
