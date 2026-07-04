import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@/generated/prisma"
import { hasPermission } from "@/lib/permissions"
import { LoadStatusBadge } from "@/components/loads/load-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate, getLoadStatusLabel } from "@/lib/utils"
import { DocumentViewerPanel, type ViewerDocument } from "@/components/documents/document-viewer-panel"

// Status transition map: which next statuses are allowed from each current status
const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ASSIGNED"],
  ASSIGNED: ["ACCEPTED"],
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
  SUBMITTED_TO_FACTORING: ["PAID"],
  PAID: [],
  DISPUTED: ["RECONCILIATION_NEEDED"],
  ARCHIVED: [],
}

async function updateLoadStatus(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user?.id) return
  const loadId = formData.get("loadId") as string
  const newStatus = formData.get("newStatus") as string
  if (!loadId || !newStatus) return
  await prisma.load.update({
    where: { id: loadId },
    data: { status: newStatus as never },
  })
}

export default async function LoadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await getUserOrg(session.user.id)
  if (!membership) redirect("/login")

  const role = membership.role as UserRole
  const canEdit = hasPermission(role, "edit_load")

  const { id } = await params
  const { tab: activeTab = "overview" } = await searchParams

  const load = await prisma.load.findUnique({
    where: { id },
    include: {
      assignedDriver: { select: { id: true, name: true, email: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      stops: { orderBy: { stopNumber: "asc" } },
      parties: true,
      documents: {
        include: {
          uploadedBy: { select: { name: true } },
          verifiedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      gpsEvents: { orderBy: { timestamp: "asc" } },
      reconciliationChecks: { orderBy: { severity: "asc" } },
      reconciliationResult: true,
      invoice: { include: { lineItems: true } },
      notes: {
        include: { author: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!load || load.orgId !== membership.orgId) notFound()

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: `Documents (${load.documents.length})` },
    { id: "gps", label: `GPS Events (${load.gpsEvents.length})` },
    { id: "reconciliation", label: "Reconciliation" },
    { id: "invoice", label: "Invoice" },
    { id: "notes", label: `Notes (${load.notes.length})` },
  ]

  const pickupStop = load.stops.find((s) => s.stopType === "PICKUP")
  const deliveryStop = load.stops.find((s) => s.stopType === "DELIVERY")
  const shipper = load.parties.find((p) => p.partyType === "SHIPPER")
  const consignee = load.parties.find((p) => p.partyType === "CONSIGNEE")

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/loads"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Loads
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#1E3A5F] font-mono">
              {load.loadNumber}
            </h2>
            <LoadStatusBadge status={load.status} />
          </div>
          {pickupStop && deliveryStop && (
            <p className="text-sm text-gray-500 mt-0.5">
              {pickupStop.city}, {pickupStop.state} →{" "}
              {deliveryStop.city}, {deliveryStop.state}
            </p>
          )}
          {load.assignedDriver && (
            <p className="text-xs text-gray-400 mt-0.5">
              Driver: {load.assignedDriver.name}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(load.agreedRate.toString())}
          </p>
          <p className="text-xs text-gray-400">
            {load.rateType.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Status Action Bar */}
      {canEdit && (STATUS_TRANSITIONS[load.status] ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">
            Actions
          </span>
          {(STATUS_TRANSITIONS[load.status] ?? []).map((nextStatus) => (
            <form key={nextStatus} action={updateLoadStatus}>
              <input type="hidden" name="loadId" value={load.id} />
              <input type="hidden" name="newStatus" value={nextStatus} />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1E3A5F] text-white hover:bg-[#162d4a] transition"
              >
                {getLoadStatusLabel(nextStatus as never)}
              </button>
            </form>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/loads/${id}?tab=${tab.id}`}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              activeTab === tab.id
                ? "border-[#1E3A5F] text-[#1E3A5F]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stop Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {load.stops.map((stop, idx) => (
                  <div key={stop.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          stop.stopType === "PICKUP"
                            ? "bg-[#1E3A5F]"
                            : "bg-[#10B981]"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx < load.stops.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold uppercase ${
                            stop.stopType === "PICKUP"
                              ? "text-[#1E3A5F]"
                              : "text-[#10B981]"
                          }`}
                        >
                          {stop.stopType}
                        </span>
                        {stop.actualArrival && (
                          <span className="text-xs text-gray-400">
                            Arrived {formatDate(stop.actualArrival, "MMM d h:mm a")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {stop.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stop.address}, {stop.city}, {stop.state} {stop.zip}
                      </p>
                      {stop.appointmentStart && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Appt: {formatDate(stop.appointmentStart, "MMM d h:mm a")}
                        </p>
                      )}
                      {stop.commodity && (
                        <p className="text-xs text-gray-400">
                          {stop.commodity}
                          {stop.weight ? ` · ${stop.weight} ${stop.weightUnit}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Load Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    { label: "BOL #", value: load.bolNumber },
                    { label: "PO #", value: load.poNumber },
                    { label: "Rate Conf #", value: load.rateConfNumber },
                    { label: "Broker Ref #", value: load.brokerRefNumber },
                    { label: "Trailer #", value: load.trailerNumber },
                    { label: "Truck #", value: load.truckNumber },
                    { label: "Seal #", value: load.sealNumber },
                    {
                      label: "Mileage",
                      value: load.mileage ? `${load.mileage} mi` : null,
                    },
                    {
                      label: "Fuel Surcharge",
                      value: formatCurrency(load.fuelSurcharge.toString()),
                    },
                    {
                      label: "Free Time",
                      value: `${load.freeTimeMinutes} min`,
                    },
                    { label: "Hazmat", value: load.hazmatFlag ? "Yes" : "No" },
                    {
                      label: "Temp Controlled",
                      value: load.tempRequired
                        ? `Yes (${load.tempMin ?? "—"}°–${load.tempMax ?? "—"}°)`
                        : "No",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs text-gray-400">{label}</dt>
                      <dd className="font-medium text-gray-700">{value ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
                {load.specialInstructions && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <dt className="text-xs text-gray-400 mb-1">
                      Special Instructions
                    </dt>
                    <dd className="text-sm text-gray-700 whitespace-pre-wrap">
                      {load.specialInstructions}
                    </dd>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver</CardTitle>
              </CardHeader>
              <CardContent>
                {load.assignedDriver ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {load.assignedDriver.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {load.assignedDriver.email}
                    </p>
                    {load.assignedDriver.phone && (
                      <p className="text-xs text-gray-500">
                        {load.assignedDriver.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Unassigned</p>
                )}
              </CardContent>
            </Card>

            {shipper && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipper</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-0.5">
                  <p className="font-semibold text-gray-900">{shipper.name}</p>
                  {shipper.address && (
                    <p className="text-xs text-gray-500">{shipper.address}</p>
                  )}
                  {shipper.city && (
                    <p className="text-xs text-gray-500">
                      {shipper.city}, {shipper.state} {shipper.zip}
                    </p>
                  )}
                  {shipper.contactName && (
                    <p className="text-xs text-gray-400 mt-1">
                      {shipper.contactName}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {consignee && (
              <Card>
                <CardHeader>
                  <CardTitle>Consignee</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-0.5">
                  <p className="font-semibold text-gray-900">{consignee.name}</p>
                  {consignee.address && (
                    <p className="text-xs text-gray-500">{consignee.address}</p>
                  )}
                  {consignee.city && (
                    <p className="text-xs text-gray-500">
                      {consignee.city}, {consignee.state} {consignee.zip}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Factoring Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14">
                    <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={
                          load.factReadinessScore >= 80
                            ? "#10B981"
                            : load.factReadinessScore >= 50
                            ? "#F59E0B"
                            : "#EF4444"
                        }
                        strokeWidth="3"
                        strokeDasharray={`${load.factReadinessScore} ${
                          100 - load.factReadinessScore
                        }`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                      {load.factReadinessScore}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {load.factReadinessScore >= 80
                        ? "Ready"
                        : load.factReadinessScore >= 50
                        ? "Almost Ready"
                        : "Not Ready"}
                    </p>
                    <p className="text-xs text-gray-400">Factoring readiness</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "documents" && (() => {
        const viewerDocs: ViewerDocument[] = load.documents.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          originalFileUrl: doc.originalFileUrl,
          mimeType: doc.mimeType ?? null,
          verificationStatus: doc.verificationStatus,
          verifiedAt: doc.verifiedAt?.toISOString() ?? null,
          verifiedByName: doc.verifiedBy?.name ?? null,
          uploadedByName: doc.uploadedBy.name ?? "Unknown",
          createdAt: doc.createdAt.toISOString(),
          extractedFields: (doc.extractedFields ?? null) as ViewerDocument["extractedFields"],
        }))
        const canVerify = hasPermission(role, "edit_load")
        return (
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DocumentViewerPanel documents={viewerDocs} canVerify={canVerify} />
            </CardContent>
          </Card>
        )
      })()}

      {activeTab === "gps" && (
        <Card>
          <CardHeader>
            <CardTitle>GPS Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {load.gpsEvents.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">
                No GPS events recorded yet
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {load.gpsEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="w-2 h-2 rounded-full bg-[#1E3A5F] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {evt.eventType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(evt.timestamp, "MMM d, h:mm a")} ·{" "}
                        {Number(evt.latitude).toFixed(4)},{" "}
                        {Number(evt.longitude).toFixed(4)}
                      </p>
                      {evt.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{evt.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "reconciliation" && (
        <div className="space-y-4">
          {load.reconciliationResult && (
            <Card>
              <CardContent className="py-4 flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {load.reconciliationResult.readinessScore}%
                  </p>
                  <p className="text-xs text-gray-400">Readiness Score</p>
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize text-gray-700">
                    {load.reconciliationResult.overallStatus.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {load.reconciliationResult.checkCount} checks ·{" "}
                    {load.reconciliationResult.issueCount} issues
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Checks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {load.reconciliationChecks.length === 0 ? (
                <p className="text-sm text-gray-400 px-6 py-8 text-center">
                  No checks run yet
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {load.reconciliationChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center gap-4 px-6 py-3"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          check.status === "PASS"
                            ? "bg-green-400"
                            : check.status === "FAIL"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {check.checkType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500">{check.message}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          check.severity === "CRITICAL"
                            ? "text-red-600"
                            : check.severity === "WARNING"
                            ? "text-yellow-600"
                            : "text-gray-400"
                        }`}
                      >
                        {check.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "invoice" && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            {!load.invoice ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No invoice generated yet
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Invoice #{load.invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                      {load.invoice.status} · Due:{" "}
                      {load.invoice.dueDate
                        ? formatDate(load.invoice.dueDate, "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(load.invoice.totalAmount.toString())}
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {load.invoice.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between py-2 text-sm"
                    >
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.amount.toString())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {load.notes.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-8 text-center">
                No notes yet
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {load.notes.map((note) => (
                  <div key={note.id} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {note.author.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(note.createdAt, "MMM d, h:mm a")}
                      </span>
                      {note.isActionItem && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Action Item
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
