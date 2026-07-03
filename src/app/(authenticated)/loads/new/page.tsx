"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CreateLoadSchema } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

// Use z.input for form values — allows undefined for optional/default fields
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

export default function NewLoadPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
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
        {
          stopType: "PICKUP",
          stopNumber: 1,
          name: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          weightUnit: "lbs",
        },
        {
          stopType: "DELIVERY",
          stopNumber: 1,
          name: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          weightUnit: "lbs",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "stops" })

  async function onSubmit(data: CreateLoadFormValues) {
    setServerError(null)
    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Failed to create load")
        return
      }
      router.push(`/loads/${json.load.id}`)
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

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rate &amp; References</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input
              label="BOL Number"
              {...register("bolNumber")}
              error={errors.bolNumber?.message}
            />
            <Input
              label="PO Number"
              {...register("poNumber")}
              error={errors.poNumber?.message}
            />
            <Input
              label="Rate Conf #"
              {...register("rateConfNumber")}
              error={errors.rateConfNumber?.message}
            />
            <Input
              label="Broker Ref #"
              {...register("brokerRefNumber")}
              error={errors.brokerRefNumber?.message}
            />
            <Select
              label="Rate Type"
              options={RATE_TYPES}
              {...register("rateType")}
              error={errors.rateType?.message}
            />
            <Input
              label="Agreed Rate ($)"
              type="number"
              step="0.01"
              {...register("agreedRate", { valueAsNumber: true })}
              error={errors.agreedRate?.message}
            />
            <Input
              label="Fuel Surcharge ($)"
              type="number"
              step="0.01"
              {...register("fuelSurcharge", { valueAsNumber: true })}
              error={errors.fuelSurcharge?.message}
            />
            <Input
              label="Mileage"
              type="number"
              step="0.1"
              {...register("mileage", { valueAsNumber: true })}
              error={errors.mileage?.message}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stops</CardTitle>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({
                    stopType: "DELIVERY",
                    stopNumber: fields.length + 1,
                    name: "",
                    address: "",
                    city: "",
                    state: "",
                    zip: "",
                    weightUnit: "lbs",
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stop
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.stops?.root && (
              <p className="text-xs text-red-600">
                {errors.stops.root.message}
              </p>
            )}
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Stop {idx + 1}
                  </h4>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Stop Type"
                    options={STOP_TYPES}
                    {...register(`stops.${idx}.stopType`)}
                    error={errors.stops?.[idx]?.stopType?.message}
                  />
                  <Input
                    label="Facility Name"
                    {...register(`stops.${idx}.name`)}
                    error={errors.stops?.[idx]?.name?.message}
                  />
                  <Input
                    label="Address"
                    className="col-span-2"
                    {...register(`stops.${idx}.address`)}
                    error={errors.stops?.[idx]?.address?.message}
                  />
                  <Input
                    label="City"
                    {...register(`stops.${idx}.city`)}
                    error={errors.stops?.[idx]?.city?.message}
                  />
                  <Select
                    label="State"
                    options={US_STATES}
                    placeholder="Select state"
                    {...register(`stops.${idx}.state`)}
                    error={errors.stops?.[idx]?.state?.message}
                  />
                  <Input
                    label="ZIP Code"
                    {...register(`stops.${idx}.zip`)}
                    error={errors.stops?.[idx]?.zip?.message}
                  />
                  <Input
                    label="Contact Name"
                    {...register(`stops.${idx}.contactName`)}
                  />
                  <Input
                    label="Appt Start"
                    type="datetime-local"
                    {...register(`stops.${idx}.appointmentStart`)}
                  />
                  <Input
                    label="Appt End"
                    type="datetime-local"
                    {...register(`stops.${idx}.appointmentEnd`)}
                  />
                  <Input
                    label="Commodity"
                    {...register(`stops.${idx}.commodity`)}
                  />
                  <Input
                    label="Weight (lbs)"
                    type="number"
                    step="0.01"
                    {...register(`stops.${idx}.weight`, { valueAsNumber: true })}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Shipper
              </p>
              <Input label="Company Name" {...register("shipperName")} />
              <Input label="Address" {...register("shipperAddress")} />
              <div className="grid grid-cols-3 gap-2">
                <Input label="City" {...register("shipperCity")} />
                <Select
                  label="State"
                  options={US_STATES}
                  placeholder="ST"
                  {...register("shipperState")}
                />
                <Input label="ZIP" {...register("shipperZip")} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Consignee
              </p>
              <Input label="Company Name" {...register("consigneeName")} />
              <Input label="Address" {...register("consigneeAddress")} />
              <div className="grid grid-cols-3 gap-2">
                <Input label="City" {...register("consigneeCity")} />
                <Select
                  label="State"
                  options={US_STATES}
                  placeholder="ST"
                  {...register("consigneeState")}
                />
                <Input label="ZIP" {...register("consigneeZip")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Trailer #" {...register("trailerNumber")} />
              <Input label="Truck #" {...register("truckNumber")} />
              <Input label="Seal #" {...register("sealNumber")} />
              <Input
                label="Free Time (min)"
                type="number"
                {...register("freeTimeMinutes", { valueAsNumber: true })}
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("hazmatFlag")}
                  className="rounded"
                />
                Hazmat
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("tempRequired")}
                  className="rounded"
                />
                Temperature Controlled
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Load
          </Button>
        </div>
      </form>
    </div>
  )
}
