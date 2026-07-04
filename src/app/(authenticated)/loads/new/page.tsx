"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { CreateLoadSchema } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DocumentUploader, type PendingDocument } from "@/components/documents/document-uploader"
import { Plus, Trash2 } from "lucide-react"
import type { ExtractedDocument } from "@/lib/extract"

type CreateLoadFormValues = z.input<typeof CreateLoadSchema>

const RATE_TYPES = [
  { value: "FLAT_RATE", label: "Flat Rate" },
  { value: "PER_MILE", label: "Per Mile" },
  { value: "PER_TON", label: "Per Ton" },
  { value: "PER_UNIT", label: "Per Unit" },
  { value: "PER_PALLET", label: "Per Pallet" },
  { value: "PER_CWT", label: "Per CWT" },
  { value: "PER_CASE", label: "Per Case" },
  { value: "PER_GALLON", label: "Per Gallon" },
  { value: "CUSTOM_FORMULA", label: "Custom Formula" },
]

const STOP_TYPES = [
  { value: "PICKUP", label: "Pickup" },
  { value: "DELIVERY", label: "Delivery" },
]

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
].map((s) => ({ value: s, label: s }))

// Wraps a form field with an amber highlight + "AI" badge when auto-filled by extraction
function AiField({
  name,
  extracted,
  children,
}: {
  name: string
  extracted: Set<string>
  children: React.ReactNode
}) {
  const active = extracted.has(name)
  return (
    <div className={cn("relative", active && "rounded-lg ring-2 ring-amber-400 ring-offset-1")}>
      {children}
      {active && (
        <span className="absolute -top-2.5 right-1.5 z-10 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight shadow-sm">
          AI
        </span>
      )}
    </div>
  )
}

export default function NewLoadPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<Set<string>>(new Set())
  const [pendingDoc, setPendingDoc] = useState<PendingDocument | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLoadFormValues>({
    resolver: zodResolver(CreateLoadSchema),
    defaultValues: {
      rateType: "FLAT_RATE",
      agreedRate: 0,
      fuelSurcharge: 0,
      freeTimeMinutes: 120,
      hazmatFlag: false,
      tempRequired: false,
      stops: [
        { stopType: "PICKUP",    stopNumber: 1, name: "", address: "", city: "", state: "", zip: "", weightUnit: "lbs" },
        { stopType: "DELIVERY",  stopNumber: 1, name: "", address: "", city: "", state: "", zip: "", weightUnit: "lbs" },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "stops" })

  const handleExtracted = useCallback(
    (fields: ExtractedDocument, pending: PendingDocument) => {
      setPendingDoc(pending)
      console.log("[AI fill] Received from Claude:", JSON.stringify(fields, null, 2))
      const keys = new Set<string>()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const set = (key: string, val: any) => {
        if (val === null || val === undefined || val === "") return
        try {
          setValue(key as Parameters<typeof setValue>[0], val)
          keys.add(key)
        } catch (e) {
          console.warn(`[AI fill] Could not set ${key}:`, e)
        }
      }

      // Strip currency symbols, commas, and units — return null if not parseable
      const toNum = (v: unknown): number | null => {
        if (v === null || v === undefined) return null
        const n = parseFloat(String(v).replace(/[$,\s]/g, "").replace(/[^\d.]/g, ""))
        return isNaN(n) ? null : n
      }

      // Normalize any date string to YYYY-MM-DDTHH:MM (required by datetime-local inputs)
      // Returns null if the value can't be parsed into a valid date
      const toDtLocal = (v: string | null | undefined): string | null => {
        if (!v) return null
        // Already ISO-like: YYYY-MM-DDTHH:MM(:SS)
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return v.slice(0, 16)
        try {
          const d = new Date(v)
          if (isNaN(d.getTime())) return null
          return d.toISOString().slice(0, 16)
        } catch { return null }
      }

      const VALID_RATE_TYPES = new Set([
        "FLAT_RATE","PER_MILE","PER_TON","PER_UNIT","PER_PALLET",
        "PER_CWT","PER_CASE","PER_GALLON","CUSTOM_FORMULA",
      ])

      set("bolNumber",       fields.bolNumber)
      set("poNumber",        fields.poNumber)
      set("rateConfNumber",  fields.rateConfNumber)
      set("agreedRate",      toNum(fields.rate))
      if (fields.rateType && VALID_RATE_TYPES.has(fields.rateType)) {
        set("rateType", fields.rateType)
      }

      // Shipper party
      // Note: on a BOL "shipper" = origin party (the "From"), NOT the carrier
      // carrierName identifies the trucking company — mapped to shipperName only
      // if the shipper itself is missing
      const shipperNameVal = fields.shipper?.name ?? (fields.shipper == null ? fields.carrierName : null)
      set("shipperName",    shipperNameVal)
      set("shipperAddress", fields.shipper?.address)
      set("shipperCity",    fields.shipper?.city)
      set("shipperState",   fields.shipper?.state)
      set("shipperZip",     fields.shipper?.zip)

      // Consignee party
      set("consigneeName",    fields.consignee?.name)
      set("consigneeAddress", fields.consignee?.address)
      set("consigneeCity",    fields.consignee?.city)
      set("consigneeState",   fields.consignee?.state)
      set("consigneeZip",     fields.consignee?.zip)

      // Stop 0 — pickup (prefer explicit pickup, fall back to shipper)
      const pu = fields.pickup ?? fields.shipper
      set("stops.0.name",      pu?.name)
      set("stops.0.address",   pu?.address)
      set("stops.0.city",      pu?.city)
      set("stops.0.state",     pu?.state)
      set("stops.0.zip",       pu?.zip)
      set("stops.0.commodity", fields.commodity)
      set("stops.0.weight",    toNum(fields.weight ?? fields.grossWeight))
      // Appointment: prefer pickup.appointmentStart, then shipDate, then detentionClockStart
      const puAppt = toDtLocal(
        fields.pickup?.appointmentStart ?? fields.shipDate ?? fields.detentionClockStart
      )
      if (puAppt) set("stops.0.appointmentStart", puAppt)

      // Stop 1 — delivery (prefer explicit delivery, fall back to consignee)
      const dl = fields.delivery ?? fields.consignee
      set("stops.1.name",    dl?.name)
      set("stops.1.address", dl?.address)
      set("stops.1.city",    dl?.city)
      set("stops.1.state",   dl?.state)
      set("stops.1.zip",     dl?.zip)
      const dlAppt = toDtLocal(fields.delivery?.appointmentStart)
      if (dlAppt) set("stops.1.appointmentStart", dlAppt)

      // driverName has no form field — log for visibility
      if (fields.driverName) {
        console.log("[AI fill] driverName extracted (no form field):", fields.driverName)
      }

      setExtracted(keys)
    },
    [setValue]
  )

  async function onSubmit(data: CreateLoadFormValues) {
    setServerError(null)
    try {
      const loadRes = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const loadJson = await loadRes.json()
      if (!loadRes.ok) {
        setServerError(loadJson.error ?? "Failed to create load")
        return
      }

      const loadId: string = loadJson.load.id

      // Attach the uploaded document to the new load if storage succeeded
      if (pendingDoc?.fileUrl) {
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loadId,
            fileUrl: pendingDoc.fileUrl,
            fileSize: pendingDoc.fileSize,
            mimeType: pendingDoc.mimeType,
            fileHash: pendingDoc.fileHash,
            documentType: pendingDoc.documentType,
            extractedFields: pendingDoc.extractedFields,
            confidence: pendingDoc.extractedFields.confidence,
          }),
        })
      }

      router.push(`/loads/${loadId}`)
    } catch {
      setServerError("Network error. Please try again.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Create New Load</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Fill in the load details to generate a Load Passport
        </p>
      </div>

      {/* AI extraction uploader */}
      <DocumentUploader onExtracted={handleExtracted} />

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {extracted.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <span className="font-semibold">Fields highlighted in amber</span> were auto-filled by AI — please review and confirm before saving.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Rate & References */}
        <Card>
          <CardHeader><CardTitle>Rate &amp; References</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <AiField name="bolNumber" extracted={extracted}>
              <Input label="BOL Number" {...register("bolNumber")} error={errors.bolNumber?.message} />
            </AiField>
            <AiField name="poNumber" extracted={extracted}>
              <Input label="PO Number" {...register("poNumber")} error={errors.poNumber?.message} />
            </AiField>
            <AiField name="rateConfNumber" extracted={extracted}>
              <Input label="Rate Conf #" {...register("rateConfNumber")} error={errors.rateConfNumber?.message} />
            </AiField>
            <Input label="Broker Ref #" {...register("brokerRefNumber")} error={errors.brokerRefNumber?.message} />
            <AiField name="rateType" extracted={extracted}>
              <Select label="Rate Type" options={RATE_TYPES} {...register("rateType")} error={errors.rateType?.message} />
            </AiField>
            <AiField name="agreedRate" extracted={extracted}>
              <Input label="Agreed Rate ($)" type="number" step="0.01" {...register("agreedRate", { valueAsNumber: true })} error={errors.agreedRate?.message} />
            </AiField>
            <Input label="Fuel Surcharge ($)" type="number" step="0.01" {...register("fuelSurcharge", { valueAsNumber: true })} error={errors.fuelSurcharge?.message} />
            <Input label="Mileage" type="number" step="0.1" {...register("mileage", { valueAsNumber: true })} error={errors.mileage?.message} />
          </CardContent>
        </Card>

        {/* Stops */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stops</CardTitle>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({ stopType: "DELIVERY", stopNumber: fields.length + 1, name: "", address: "", city: "", state: "", zip: "", weightUnit: "lbs" })
                }
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stop
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.stops?.root && (
              <p className="text-xs text-red-600">{errors.stops.root.message}</p>
            )}
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Stop {idx + 1}</h4>
                  {fields.length > 2 && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Stop Type" options={STOP_TYPES} {...register(`stops.${idx}.stopType`)} error={errors.stops?.[idx]?.stopType?.message} />
                  <AiField name={`stops.${idx}.name`} extracted={extracted}>
                    <Input label="Facility Name" {...register(`stops.${idx}.name`)} error={errors.stops?.[idx]?.name?.message} />
                  </AiField>
                  <AiField name={`stops.${idx}.address`} extracted={extracted}>
                    <Input label="Address" className="col-span-2" {...register(`stops.${idx}.address`)} error={errors.stops?.[idx]?.address?.message} />
                  </AiField>
                  <AiField name={`stops.${idx}.city`} extracted={extracted}>
                    <Input label="City" {...register(`stops.${idx}.city`)} error={errors.stops?.[idx]?.city?.message} />
                  </AiField>
                  <AiField name={`stops.${idx}.state`} extracted={extracted}>
                    <Select label="State" options={US_STATES} placeholder="Select state" {...register(`stops.${idx}.state`)} error={errors.stops?.[idx]?.state?.message} />
                  </AiField>
                  <AiField name={`stops.${idx}.zip`} extracted={extracted}>
                    <Input label="ZIP Code" {...register(`stops.${idx}.zip`)} error={errors.stops?.[idx]?.zip?.message} />
                  </AiField>
                  <Input label="Contact Name" {...register(`stops.${idx}.contactName`)} />
                  <AiField name={`stops.${idx}.appointmentStart`} extracted={extracted}>
                    <Input label="Appt Start" type="datetime-local" {...register(`stops.${idx}.appointmentStart`)} />
                  </AiField>
                  <Input label="Appt End" type="datetime-local" {...register(`stops.${idx}.appointmentEnd`)} />
                  <AiField name={`stops.${idx}.commodity`} extracted={extracted}>
                    <Input label="Commodity" {...register(`stops.${idx}.commodity`)} />
                  </AiField>
                  <AiField name={`stops.${idx}.weight`} extracted={extracted}>
                    <Input label="Weight (lbs)" type="number" step="0.01" {...register(`stops.${idx}.weight`, { valueAsNumber: true })} />
                  </AiField>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader><CardTitle>Parties</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipper</p>
              <AiField name="shipperName" extracted={extracted}>
                <Input label="Company Name" {...register("shipperName")} />
              </AiField>
              <AiField name="shipperAddress" extracted={extracted}>
                <Input label="Address" {...register("shipperAddress")} />
              </AiField>
              <div className="grid grid-cols-3 gap-2">
                <AiField name="shipperCity" extracted={extracted}>
                  <Input label="City" {...register("shipperCity")} />
                </AiField>
                <AiField name="shipperState" extracted={extracted}>
                  <Select label="State" options={US_STATES} placeholder="ST" {...register("shipperState")} />
                </AiField>
                <AiField name="shipperZip" extracted={extracted}>
                  <Input label="ZIP" {...register("shipperZip")} />
                </AiField>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Consignee</p>
              <AiField name="consigneeName" extracted={extracted}>
                <Input label="Company Name" {...register("consigneeName")} />
              </AiField>
              <AiField name="consigneeAddress" extracted={extracted}>
                <Input label="Address" {...register("consigneeAddress")} />
              </AiField>
              <div className="grid grid-cols-3 gap-2">
                <AiField name="consigneeCity" extracted={extracted}>
                  <Input label="City" {...register("consigneeCity")} />
                </AiField>
                <AiField name="consigneeState" extracted={extracted}>
                  <Select label="State" options={US_STATES} placeholder="ST" {...register("consigneeState")} />
                </AiField>
                <AiField name="consigneeZip" extracted={extracted}>
                  <Input label="ZIP" {...register("consigneeZip")} />
                </AiField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Trailer #" {...register("trailerNumber")} />
              <Input label="Truck #" {...register("truckNumber")} />
              <Input label="Seal #" {...register("sealNumber")} />
              <Input label="Free Time (min)" type="number" {...register("freeTimeMinutes", { valueAsNumber: true })} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" {...register("hazmatFlag")} className="rounded" />
                Hazmat
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" {...register("tempRequired")} className="rounded" />
                Temperature Controlled
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                {...register("specialInstructions")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent resize-none"
                placeholder="Any special instructions for this load…"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Load</Button>
        </div>
      </form>
    </div>
  )
}
