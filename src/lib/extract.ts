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
  shipper?: ExtractedParty | null
  consignee?: ExtractedParty | null
  pickup?: ExtractedParty | null
  delivery?: ExtractedParty | null
  commodity?: string | null
  weight?: number | null
  weightUnit?: string | null
  bolNumber?: string | null
  poNumber?: string | null
  rateConfNumber?: string | null
  rate?: number | null
  rateType?: string | null
  detentionClockStart?: string | null
  confidence: Record<string, number>
}

const PROMPT = `Extract all available fields from this freight document (BOL, rate confirmation, or invoice).

Return ONLY a valid JSON object with exactly these keys. Use null for any field you cannot find:
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

Rules:
- appointmentStart and detentionClockStart: ISO 8601 (YYYY-MM-DDTHH:MM:SS) or null
- weight: number only, no units in the value field
- rate: number only, no dollar sign
- rateType: one of FLAT_RATE, PER_MILE, PER_TON, PER_UNIT, PER_PALLET, PER_CWT, PER_CASE, PER_GALLON, CUSTOM_FORMULA, or null
- confidence: 0.0–1.0 per field group indicating extraction certainty
- pickup and shipper may refer to the same entity on a BOL — populate both if so
- delivery and consignee may refer to the same entity — populate both if so
- Return ONLY the JSON object, no markdown fences, no explanation`

// ---------------------------------------------------------------------------
// Normalizer — maps any Claude output shape to ExtractedDocument
// Handles: nested camelCase (expected), flat snake_case, flat camelCase
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
      const name = (o.name ?? o.company ?? o.facility ?? null) as string | null
      const address = (o.address ?? o.street ?? o.street_address ?? null) as string | null
      if (name || address) {
        return {
          name,
          address,
          city: (o.city ?? null) as string | null,
          state: (o.state ?? o.st ?? null) as string | null,
          zip: (o.zip ?? o.zipCode ?? o.zip_code ?? o.postal ?? o.postal_code ?? null) as string | null,
          appointmentStart: (o.appointmentStart ?? o.appointment_start ?? o.appt_start ?? null) as string | null,
        }
      }
    }
  }

  // Try flat keys with each prefix
  for (const p of prefixes) {
    const nameVal = pick(
      raw,
      `${p}_name`, `${p}Name`, `${p}_company`, `${p}Company`,
      `${p}_facility`, `${p}Facility`
    )
    const addrVal = pick(
      raw,
      `${p}_address`, `${p}Address`, `${p}_street`, `${p}Street`,
      `${p}_addr`, `${p}Addr`
    )
    if (nameVal || addrVal) {
      return {
        name: (nameVal ?? null) as string | null,
        address: (addrVal ?? null) as string | null,
        city: pick(raw, `${p}_city`, `${p}City`) as string | null,
        state: pick(raw, `${p}_state`, `${p}State`) as string | null,
        zip: pick(raw, `${p}_zip`, `${p}Zip`, `${p}_zipcode`, `${p}Zipcode`, `${p}_zip_code`) as string | null,
        appointmentStart: pick(raw, `${p}_appointment`, `${p}Appointment`, `${p}_appt`, `${p}Appt`) as string | null,
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
  const shipper = buildParty(
    raw,
    ["shipper"],
    ["shipper", "ship_from", "origin", "from"]
  )
  const consignee = buildParty(
    raw,
    ["consignee", "receiver", "recipient"],
    ["consignee", "receiver", "recipient", "ship_to", "destination", "to"]
  )
  const pickup = buildParty(
    raw,
    ["pickup", "origin", "ship_from"],
    ["pickup", "origin", "ship_from", "from", "shipper"]
  )
  const delivery = buildParty(
    raw,
    ["delivery", "destination", "ship_to"],
    ["delivery", "destination", "ship_to", "to", "consignee"]
  )

  return {
    shipper,
    consignee,
    // If Claude returned no explicit pickup/delivery, fall back to shipper/consignee
    pickup:   pickup   ?? shipper,
    delivery: delivery ?? consignee,
    bolNumber: pick(
      raw,
      "bolNumber", "bol_number", "bolNo", "bol_no", "bol",
      "bill_of_lading_number", "billOfLadingNumber", "bill_of_lading",
      "BOL", "BOL Number", "bol number"
    ) as string | null,
    poNumber: pick(
      raw,
      "poNumber", "po_number", "poNo", "po_no", "po",
      "purchase_order_number", "purchaseOrderNumber", "purchase_order",
      "PO Number", "po number"
    ) as string | null,
    rateConfNumber: pick(
      raw,
      "rateConfNumber", "rate_conf_number", "rateConfNo", "rate_confirmation_number",
      "rate_conf", "rateConf", "pro_number", "proNumber", "ref_number", "refNumber",
      "Rate Conf #", "rate conf number"
    ) as string | null,
    commodity: pick(
      raw,
      "commodity", "description", "freight_description", "freightDescription",
      "cargo", "item", "items", "goods", "product", "Commodity"
    ) as string | null,
    weight: toNum(pick(
      raw,
      "weight", "total_weight", "totalWeight", "gross_weight", "grossWeight",
      "Weight", "Total Weight"
    )),
    weightUnit: (pick(raw, "weightUnit", "weight_unit", "Weight Unit") as string | null) ?? "lbs",
    rate: toNum(pick(
      raw,
      "rate", "agreed_rate", "agreedRate", "total_rate", "totalRate",
      "linehaul_rate", "linehaulRate", "base_rate", "baseRate",
      "Rate", "Total Rate", "Line Haul"
    )),
    rateType: pick(
      raw,
      "rateType", "rate_type", "Rate Type"
    ) as string | null,
    detentionClockStart: pick(
      raw,
      "detentionClockStart", "detention_clock_start", "detentionStart",
      "detention_start", "Detention Clock Start"
    ) as string | null,
    confidence: (pick(raw, "confidence") ?? {}) as Record<string, number>,
  }
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

export async function extractDocumentFields(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedDocument> {
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
    // Claude supports: image/jpeg, image/png, image/gif, image/webp
    // HEIC must be converted before reaching here (done in the route)
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

  // Strip markdown code fences if present despite instructions
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()

  console.log("[extract] Raw Claude response:", text)

  try {
    const raw = JSON.parse(json) as Record<string, unknown>
    const normalized = normalizeExtracted(raw)
    console.log("[extract] Normalized fields:", JSON.stringify(normalized, null, 2))
    return normalized
  } catch (e) {
    console.error("[extract] JSON parse failed:", e, "\nRaw response:", text)
    return { confidence: {} }
  }
}
