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
  const createFn = mimeType === "application/pdf" ? (client.beta.messages.create.bind(client.beta.messages) as any) : client.messages.create.bind(client.messages)

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

  // Strip markdown code fences if Claude includes them
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()

  console.log("[extract] Raw Claude response:", text)

  try {
    return JSON.parse(json) as ExtractedDocument
  } catch (e) {
    console.error("[extract] JSON parse failed:", e, "raw:", text)
    return { confidence: {} }
  }
}
