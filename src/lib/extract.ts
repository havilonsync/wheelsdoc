import Anthropic from "@anthropic-ai/sdk"

export type ExtractedParty = {
  name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  appointmentStart?: string | null
}

export type ExtractedDocument = {
  // Core parties
  shipper?: ExtractedParty | null
  consignee?: ExtractedParty | null
  pickup?: ExtractedParty | null
  delivery?: ExtractedParty | null
  // Cargo
  commodity?: string | null
  weight?: number | null
  weightUnit?: string | null
  grossWeight?: number | null
  // References
  bolNumber?: string | null
  poNumber?: string | null
  rateConfNumber?: string | null
  // Rate
  rate?: number | null
  rateType?: string | null
  // Timing
  shipDate?: string | null
  detentionClockStart?: string | null
  // Additional BOL fields
  carrierName?: string | null
  driverName?: string | null
  // Metadata
  confidence: Record<string, number>
}

export type ExtractionResult = {
  normalized: ExtractedDocument
  /** Raw parsed JSON from Claude — included in API response for client-side debugging */
  raw: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Prompt — explicit schema + BOL-specific extras
// ---------------------------------------------------------------------------

const PROMPT = `Extract all available fields from this freight document (BOL, rate confirmation, or invoice).

Return ONLY a valid JSON object. Use null for any field you cannot find.

Required keys (always include these, null if absent):
{
  "shipper": { "name": null, "address": null, "city": null, "state": null, "zip": null },
  "consignee": { "name": null, "address": null, "city": null, "state": null, "zip": null },
  "pickup": { "name": null, "address": null, "city": null, "state": null, "zip": null, "appointmentStart": null },
  "delivery": { "name": null, "address": null, "city": null, "state": null, "zip": null, "appointmentStart": null },
  "commodity": null,
  "weight": null,
  "weightUnit": "lbs",
  "bolNumber": null,
  "poNumber": null,
  "rateConfNumber": null,
  "rate": null,
  "rateType": null,
  "detentionClockStart": null,
  "confidence": { "shipper": 0.0, "consignee": 0.0, "pickup": 0.0, "delivery": 0.0, "commodity": 0.0, "weight": 0.0, "bolNumber": 0.0, "rate": 0.0 }
}

Also include these BOL-specific fields at the root level if present in the document:
  "carrierName": the trucking carrier / motor carrier company name
  "driverName": the driver's name or operator
  "shipDate": the ship date or scheduled pickup date
  "grossWeight": total gross weight if explicitly labeled separately from item weight

Rules:
- appointmentStart, detentionClockStart, shipDate: ISO 8601 date/time (YYYY-MM-DDTHH:MM:SS) or date only (YYYY-MM-DD) — never a formatted string like "July 5"
- weight and grossWeight: number only, no units
- rate: number only, no dollar sign
- rateType: one of FLAT_RATE, PER_MILE, PER_TON, PER_UNIT, PER_PALLET, PER_CWT, PER_CASE, PER_GALLON, CUSTOM_FORMULA, or null
- On a BOL, shipper = origin party (the "From"), consignee = destination party (the "To")
- pickup and shipper often refer to the same entity — populate both
- delivery and consignee often refer to the same entity — populate both
- Return ONLY the JSON object, no markdown fences, no explanation`

// ---------------------------------------------------------------------------
// Normalizer — maps any Claude output shape → ExtractedDocument
// Handles: nested camelCase, flat snake_case, flat camelCase, spaced keys
// ---------------------------------------------------------------------------

function pick(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = raw[k]
    if (v !== null && v !== undefined) return v
  }
  return null
}

function buildParty(
  raw: Record<string, unknown>,
  nestedKeys: string[],
  prefixes: string[]
): ExtractedParty | null {
  // Try nested object first
  for (const nk of nestedKeys) {
    const nested = raw[nk]
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const o = nested as Record<string, unknown>
      const name = (o.name ?? o.company ?? o.facility ?? o.organization ?? null) as string | null
      const address = (o.address ?? o.street ?? o.street_address ?? o.addr ?? null) as string | null
      if (name || address) {
        return {
          name,
          address,
          city: (o.city ?? o.town ?? null) as string | null,
          state: (o.state ?? o.st ?? o.province ?? null) as string | null,
          zip: (o.zip ?? o.zipCode ?? o.zip_code ?? o.postal ?? o.postal_code ?? o.postalCode ?? null) as string | null,
          appointmentStart: (
            o.appointmentStart ?? o.appointment_start ?? o.appt_start ??
            o.scheduled_date ?? o.scheduledDate ?? null
          ) as string | null,
        }
      }
    }
  }

  // Try flat keys with each prefix
  for (const p of prefixes) {
    const nameVal = pick(
      raw,
      `${p}_name`, `${p}Name`,
      `${p}_company`, `${p}Company`,
      `${p}_facility`, `${p}Facility`,
      `${p}_organization`, `${p}Organization`
    )
    const addrVal = pick(
      raw,
      `${p}_address`, `${p}Address`,
      `${p}_street`, `${p}Street`,
      `${p}_addr`, `${p}Addr`,
      `${p}_street_address`, `${p}StreetAddress`
    )
    if (nameVal || addrVal) {
      return {
        name: (nameVal ?? null) as string | null,
        address: (addrVal ?? null) as string | null,
        city: pick(raw, `${p}_city`, `${p}City`, `${p}_town`, `${p}Town`) as string | null,
        state: pick(raw, `${p}_state`, `${p}State`, `${p}_st`, `${p}St`) as string | null,
        zip: pick(
          raw,
          `${p}_zip`, `${p}Zip`,
          `${p}_zipcode`, `${p}Zipcode`,
          `${p}_zip_code`, `${p}ZipCode`,
          `${p}_postal`, `${p}Postal`
        ) as string | null,
        appointmentStart: pick(
          raw,
          `${p}_appointment`, `${p}Appointment`,
          `${p}_appt`, `${p}Appt`,
          `${p}_date`, `${p}Date`,
          `${p}_scheduled`, `${p}Scheduled`
        ) as string | null,
      }
    }
  }

  return null
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number") return isNaN(v) ? null : v
  const n = parseFloat(String(v).replace(/[$,\s]/g, "").replace(/[^\d.]/g, ""))
  return isNaN(n) ? null : n
}

function normalizeExtracted(raw: Record<string, unknown>): ExtractedDocument {
  const shipper = buildParty(raw,
    ["shipper", "from", "origin"],
    ["shipper", "ship_from", "origin", "from", "sender"]
  )
  const consignee = buildParty(raw,
    ["consignee", "receiver", "recipient", "to", "destination"],
    ["consignee", "receiver", "recipient", "ship_to", "destination", "to"]
  )
  const pickup = buildParty(raw,
    ["pickup", "pick_up", "origin", "ship_from", "loading"],
    ["pickup", "pick_up", "origin", "ship_from", "from", "loading"]
  )
  const delivery = buildParty(raw,
    ["delivery", "destination", "ship_to", "unloading", "drop_off", "dropoff"],
    ["delivery", "destination", "ship_to", "to", "unloading", "drop_off"]
  )

  // Carrier party (BOL-specific — not a form party, but extract for carrierName)
  const carrierNested = raw["carrier"]
  const carrierNameFromNested = (
    carrierNested && typeof carrierNested === "object" && !Array.isArray(carrierNested)
      ? ((carrierNested as Record<string, unknown>).name ?? null)
      : null
  ) as string | null

  // shipDate — Claude might return it at root or nested in pickup
  const rawShipDate = pick(
    raw,
    "shipDate", "ship_date", "date", "shipment_date", "shipmentDate",
    "pickup_date", "pickupDate", "scheduled_date", "scheduledDate",
    "load_date", "loadDate", "Ship Date", "Date"
  ) as string | null

  return {
    shipper,
    consignee,
    pickup:   pickup   ?? shipper,
    delivery: delivery ?? consignee,

    bolNumber: pick(raw,
      "bolNumber", "bol_number", "bolNo", "bol_no", "bol",
      "bill_of_lading_number", "billOfLadingNumber", "bill_of_lading",
      "BOL", "BOL Number", "BOL #", "bol number", "b/l_number", "blNumber"
    ) as string | null,

    poNumber: pick(raw,
      "poNumber", "po_number", "poNo", "po_no", "po",
      "purchase_order_number", "purchaseOrderNumber", "purchase_order",
      "PO Number", "PO #", "po number"
    ) as string | null,

    rateConfNumber: pick(raw,
      "rateConfNumber", "rate_conf_number", "rateConfNo", "rate_confirmation_number",
      "rate_conf", "rateConf", "pro_number", "proNumber", "ref_number", "refNumber",
      "Rate Conf #", "rate conf number", "confirmation_number", "confirmationNumber"
    ) as string | null,

    commodity: pick(raw,
      "commodity", "description", "freight_description", "freightDescription",
      "cargo", "item", "items", "goods", "product", "products",
      "Commodity", "Description", "Freight Description"
    ) as string | null,

    weight: toNum(pick(raw,
      "weight", "total_weight", "totalWeight",
      "net_weight", "netWeight",
      "Weight", "Total Weight"
    )),

    grossWeight: toNum(pick(raw,
      "grossWeight", "gross_weight",
      "Gross Weight", "GrossWeight",
      // also try root "weight" if gross_weight is absent
      "weight", "total_weight", "totalWeight"
    )),

    weightUnit: (pick(raw, "weightUnit", "weight_unit", "Weight Unit") as string | null) ?? "lbs",

    rate: toNum(pick(raw,
      "rate", "agreed_rate", "agreedRate",
      "total_rate", "totalRate", "linehaul_rate", "linehaulRate",
      "base_rate", "baseRate", "freight_charge", "freightCharge",
      "Rate", "Total Rate", "Line Haul", "Freight Charge"
    )),

    rateType: pick(raw, "rateType", "rate_type", "Rate Type") as string | null,

    shipDate: rawShipDate,

    detentionClockStart: pick(raw,
      "detentionClockStart", "detention_clock_start",
      "detentionStart", "detention_start",
      "Detention Clock Start"
    ) as string | null,

    carrierName: (
      pick(raw,
        "carrierName", "carrier_name", "carrier",
        "Carrier", "Carrier Name", "motor_carrier", "motorCarrier"
      ) as string | null
    ) ?? carrierNameFromNested,

    driverName: pick(raw,
      "driverName", "driver_name", "driver",
      "Driver", "Driver Name", "operator", "truck_driver", "truckDriver"
    ) as string | null,

    confidence: (pick(raw, "confidence") ?? {}) as Record<string, number>,
  }
}

// ---------------------------------------------------------------------------
// Main extraction function — returns both raw and normalized
// ---------------------------------------------------------------------------

export async function extractDocumentFields(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const base64 = buffer.toString("base64")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contentBlocks: any[]

  if (mimeType === "application/pdf") {
    contentBlocks = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
      { type: "text", text: PROMPT },
    ]
  } else {
    contentBlocks = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: base64,
        },
      },
      { type: "text", text: PROMPT },
    ]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createFn = mimeType === "application/pdf"
    ? (client.beta.messages.create.bind(client.beta.messages) as any)
    : client.messages.create.bind(client.messages)

  const response = await createFn({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    ...(mimeType === "application/pdf" ? { betas: ["pdfs-2024-09-25"] } : {}),
    system: "You are a freight document data extraction system. Return only valid JSON.",
    messages: [{ role: "user", content: contentBlocks }],
  })

  const text: string =
    Array.isArray(response.content) && response.content[0]?.type === "text"
      ? response.content[0].text
      : "{}"

  // Strip markdown fences if present despite instructions
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()

  console.log("[extract] Raw Claude response:", text)

  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    const normalized = normalizeExtracted(raw)
    console.log("[extract] Normalized:", JSON.stringify(normalized, null, 2))
    return { raw, normalized }
  } catch (e) {
    console.error("[extract] JSON parse failed:", e, "\nRaw response:", text)
    return { raw: {}, normalized: { confidence: {} } }
  }
}
