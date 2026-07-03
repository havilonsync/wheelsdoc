"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtractedDocument } from "@/lib/extract"

export type PendingDocument = {
  fileUrl: string
  fileSize: number
  mimeType: string
  fileHash: string
  documentType: string
  extractedFields: ExtractedDocument
}

interface DocumentUploaderProps {
  onExtracted: (fields: ExtractedDocument, pending: PendingDocument) => void
}

const DOC_TYPES = [
  { value: "BOL", label: "Bill of Lading" },
  { value: "RATE_CONFIRMATION", label: "Rate Confirmation" },
  { value: "INVOICE", label: "Invoice" },
]

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf"

export function DocumentUploader({ onExtracted }: DocumentUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [docType, setDocType] = useState("BOL")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [fieldCount, setFieldCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFile = useCallback((f: File) => {
    setFile(f)
    setStatus("idle")
    setError(null)
    setFieldCount(0)
    if (f.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) pickFile(f)
    },
    [pickFile]
  )

  const reset = () => {
    setFile(null)
    setPreview(null)
    setStatus("idle")
    setError(null)
    setFieldCount(0)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleExtract = async () => {
    if (!file) return
    setStatus("loading")
    setError(null)

    const fd = new FormData()
    fd.append("file", file)
    fd.append("documentType", docType)

    try {
      const res = await fetch("/api/documents/extract", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? "Extraction failed")

      const fields: ExtractedDocument = data.extractedFields ?? {}
      const count = countExtractedFields(fields)
      setFieldCount(count)
      setStatus("done")

      onExtracted(fields, {
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileHash: data.fileHash,
        documentType: data.documentType,
        extractedFields: fields,
      })
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-gray-800">AI Document Extraction</span>
        <span className="text-xs text-gray-400 hidden sm:block">
          · Upload a BOL, rate conf, or invoice to auto-fill the form
        </span>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
            dragging
              ? "border-amber-400 bg-amber-100/60"
              : "border-amber-200 hover:border-amber-400 hover:bg-amber-50"
          )}
        >
          <Upload className="w-7 h-7 text-amber-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Drop a document here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">JPEG · PNG · WebP · PDF &mdash; max 10 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
          />
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0 overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-7 h-7 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={reset}
                className="text-gray-400 hover:text-gray-600 transition shrink-0"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={status === "loading"}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {file && status !== "done" && (
        <button
          onClick={handleExtract}
          disabled={status === "loading"}
          className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting with AI…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Extract &amp; Auto-Fill Form
            </>
          )}
        </button>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {fieldCount > 0
            ? `Extracted ${fieldCount} field${fieldCount !== 1 ? "s" : ""} — review highlighted fields below`
            : "Document processed — review the form below"}
        </div>
      )}
    </div>
  )
}

function countExtractedFields(fields: ExtractedDocument): number {
  let n = 0
  const party = (p?: ExtractedDocument["shipper"]) => {
    if (!p) return
    if (p.name) n++
    if (p.address) n++
    if (p.city) n++
    if (p.state) n++
    if (p.zip) n++
  }
  party(fields.shipper)
  party(fields.consignee)
  if (fields.bolNumber) n++
  if (fields.poNumber) n++
  if (fields.rateConfNumber) n++
  if (fields.rate) n++
  if (fields.commodity) n++
  if (fields.weight) n++
  return n
}
