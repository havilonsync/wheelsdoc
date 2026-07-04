"use client"

import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react"

type ExtractedParty = {
  name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  appointmentStart?: string | null
}

type ExtractedFields = {
  shipper?: ExtractedParty | null
  consignee?: ExtractedParty | null
  pickup?: ExtractedParty | null
  delivery?: ExtractedParty | null
  commodity?: string | null
  weight?: number | null
  weightUnit?: string | null
  grossWeight?: number | null
  bolNumber?: string | null
  poNumber?: string | null
  rateConfNumber?: string | null
  rate?: number | null
  rateType?: string | null
  shipDate?: string | null
  carrierName?: string | null
  driverName?: string | null
  [key: string]: unknown
}

export type ViewerDocument = {
  id: string
  documentType: string
  originalFileUrl: string | null
  mimeType: string | null
  verificationStatus: string
  verifiedAt: string | null
  verifiedByName: string | null
  uploadedByName: string
  createdAt: string
  extractedFields: ExtractedFields | null
}

interface DocumentViewerPanelProps {
  documents: ViewerDocument[]
  canVerify: boolean
}

export function DocumentViewerPanel({ documents, canVerify }: DocumentViewerPanelProps) {
  const [docs, setDocs] = useState(documents)
  const [selectedId, setSelectedId] = useState(docs[0]?.id ?? null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const selected = docs.find((d) => d.id === selectedId) ?? docs[0] ?? null

  async function handleVerify(status: "VERIFIED" | "DISPUTED" | "UNVERIFIED") {
    if (!selected) return
    setVerifyLoading(true)
    setVerifyError(null)
    try {
      const res = await fetch(`/api/documents/${selected.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Failed to update verification")
      }
      const data = await res.json()
      setDocs((prev) =>
        prev.map((d) =>
          d.id === selected.id
            ? {
                ...d,
                verificationStatus: data.document.verificationStatus,
                verifiedAt: data.document.verifiedAt,
                verifiedByName: data.document.verifiedBy?.name ?? null,
              }
            : d
        )
      )
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setVerifyLoading(false)
    }
  }

  if (docs.length === 0) {
    return (
      <p className="text-sm text-gray-400 px-6 py-12 text-center">
        No documents uploaded yet
      </p>
    )
  }

  const hasUrl = !!selected?.originalFileUrl
  const isImage = hasUrl && (selected?.mimeType?.startsWith("image/") ?? false)
  const isPdf = hasUrl && selected?.mimeType === "application/pdf"

  return (
    <div className="flex divide-x divide-gray-100" style={{ minHeight: 520 }}>
      {/* Sidebar: document list */}
      <div className="w-52 shrink-0 py-1 overflow-y-auto">
        {docs.map((doc) => {
          const isSelected = doc.id === selectedId
          return (
            <button
              key={doc.id}
              onClick={() => setSelectedId(doc.id)}
              className={`w-full text-left px-4 py-3 transition border-l-2 ${
                isSelected
                  ? "bg-[#1E3A5F]/5 border-[#1E3A5F]"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <p className="text-xs font-semibold text-gray-800 truncate">
                {doc.documentType.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{doc.uploadedByName}</p>
              <span
                className={`inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  doc.verificationStatus === "VERIFIED"
                    ? "bg-green-100 text-green-700"
                    : doc.verificationStatus === "DISPUTED"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {doc.verificationStatus.charAt(0) + doc.verificationStatus.slice(1).toLowerCase()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main panel */}
      {selected && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Document viewer area */}
          <div className="relative bg-gray-50 flex items-center justify-center overflow-hidden" style={{ height: 300 }}>
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.originalFileUrl!}
                alt="Document"
                className="max-h-full max-w-full object-contain"
              />
            )}
            {isPdf && (
              <iframe
                src={selected.originalFileUrl!}
                className="w-full border-0"
                style={{ height: 300 }}
                title="Document viewer"
              />
            )}
            {!isImage && !isPdf && (
              <div className="text-center p-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                {hasUrl ? (
                  <p className="text-sm text-gray-400">Preview not available for this file type</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 font-medium">File not stored</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Set a valid <code className="font-mono bg-gray-100 px-1 rounded">BLOB_READ_WRITE_TOKEN</code> in Vercel environment variables to enable file storage
                    </p>
                  </>
                )}
              </div>
            )}
            {hasUrl && (
              <a
                href={selected.originalFileUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/90 text-gray-600 hover:text-[#1E3A5F] border border-gray-200 rounded px-2 py-1 shadow-sm"
              >
                <ExternalLink className="w-3 h-3" />
                Open full
              </a>
            )}
          </div>

          {/* Bottom: extracted fields + verification */}
          <div className="flex divide-x divide-gray-100 flex-1 overflow-hidden">
            {/* Extracted fields */}
            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Extracted Fields
              </p>
              {selected.extractedFields ? (
                <ExtractedFieldsGrid fields={selected.extractedFields} />
              ) : (
                <p className="text-xs text-gray-400">No extracted data</p>
              )}
            </div>

            {/* Verification widget */}
            <div className="w-52 shrink-0 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Verification
              </p>

              {/* Status stamp */}
              {selected.verificationStatus === "VERIFIED" && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Verified</p>
                    {selected.verifiedByName && (
                      <p className="text-xs text-gray-500">by {selected.verifiedByName}</p>
                    )}
                    {selected.verifiedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(selected.verifiedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selected.verificationStatus === "DISPUTED" && (
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Disputed</p>
                    {selected.verifiedByName && (
                      <p className="text-xs text-gray-500">by {selected.verifiedByName}</p>
                    )}
                    {selected.verifiedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(selected.verifiedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selected.verificationStatus === "UNVERIFIED" && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500">Not yet verified</p>
                </div>
              )}

              {verifyError && (
                <p className="text-xs text-red-600">{verifyError}</p>
              )}

              {canVerify && (
                <div className="flex flex-col gap-2 mt-auto pt-2">
                  {selected.verificationStatus !== "VERIFIED" && (
                    <button
                      onClick={() => handleVerify("VERIFIED")}
                      disabled={verifyLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {verifyLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Mark Verified
                    </button>
                  )}
                  {selected.verificationStatus !== "DISPUTED" && (
                    <button
                      onClick={() => handleVerify("DISPUTED")}
                      disabled={verifyLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition disabled:opacity-50"
                    >
                      {verifyLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      Mark Disputed
                    </button>
                  )}
                  {selected.verificationStatus !== "UNVERIFIED" && (
                    <button
                      onClick={() => handleVerify("UNVERIFIED")}
                      disabled={verifyLoading}
                      className="text-xs text-gray-400 hover:text-gray-600 transition text-center"
                    >
                      Reset to Unverified
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExtractedFieldsGrid({ fields }: { fields: ExtractedFields }) {
  const rows: { label: string; value: string }[] = []

  function add(label: string, value: unknown) {
    if (value === null || value === undefined || value === "") return
    if (typeof value === "object") return
    rows.push({ label, value: String(value) })
  }

  add("BOL #", fields.bolNumber)
  add("PO #", fields.poNumber)
  add("Rate Conf #", fields.rateConfNumber)
  add("Carrier", fields.carrierName)
  add("Driver", fields.driverName)
  add("Ship Date", fields.shipDate)
  add("Commodity", fields.commodity)
  add(
    "Weight",
    fields.weight ? `${fields.weight} ${fields.weightUnit ?? "lbs"}` : null
  )
  add(
    "Gross Weight",
    fields.grossWeight ? `${fields.grossWeight} ${fields.weightUnit ?? "lbs"}` : null
  )
  add("Rate", fields.rate ? `$${fields.rate}` : null)
  add("Rate Type", fields.rateType ? fields.rateType.replace(/_/g, " ") : null)

  const shipper = fields.shipper
  const consignee = fields.consignee

  add("Shipper", shipper?.name)
  if (shipper?.city) {
    add("Shipper Location", `${shipper.city}, ${shipper.state ?? ""} ${shipper.zip ?? ""}`.trim())
  }
  add("Consignee", consignee?.name)
  if (consignee?.city) {
    add(
      "Consignee Location",
      `${consignee.city}, ${consignee.state ?? ""} ${consignee.zip ?? ""}`.trim()
    )
  }

  if (rows.length === 0) {
    return <p className="text-xs text-gray-400">No fields were extracted from this document</p>
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-xs text-gray-400">{row.label}</dt>
          <dd className="text-xs font-medium text-gray-700 truncate" title={row.value}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
