import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { storeFile } from "@/lib/storage"
import { extractDocumentFields } from "@/lib/extract"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getUserOrg(session.user.id)
  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const documentType = (formData.get("documentType") as string) || "BOL"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or PDF." },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum 10 MB." },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Store the file — non-fatal: extraction still runs if storage is misconfigured
  let stored: { url: string; size: number; hash: string } | null = null
  try {
    stored = await storeFile(buffer, file.type)
  } catch (err) {
    console.error("[extract] File storage failed (continuing with extraction):", err)
  }

  // Extract with Claude if API key is configured
  let extractedFields = {}
  let ocrStatus = "SKIPPED"

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      ocrStatus = "PROCESSING"
      extractedFields = await extractDocumentFields(buffer, file.type)
      ocrStatus = "COMPLETED"
    } catch (err) {
      console.error("[extract] Claude extraction failed:", err)
      ocrStatus = "FAILED"
    }
  }

  return NextResponse.json({
    success: true,
    ocrStatus,
    fileUrl: stored?.url ?? null,
    fileSize: stored?.size ?? file.size,
    mimeType: file.type,
    fileHash: stored?.hash ?? null,
    documentType,
    extractedFields,
  })
}
