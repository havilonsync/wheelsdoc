import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { storeFile } from "@/lib/storage"
import { extractDocumentFields } from "@/lib/extract"
import { prepareImage } from "@/lib/image-prep"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  // iOS sometimes sends empty type for HEIC — caught by filename extension below
]

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"])

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

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const effectiveMime =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : ext === "heic" || ext === "heif"
        ? `image/${ext}`
        : file.type

  if (!ALLOWED_TYPES.includes(effectiveMime) && !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, HEIC, or PDF." },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum 10 MB." },
      { status: 400 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let buffer: Buffer = Buffer.from(await file.arrayBuffer()) as any
  // Convert HEIC and compress large images before storage + extraction
  let mimeType = effectiveMime
  if (effectiveMime !== "application/pdf") {
    try {
      const prepared = await prepareImage(buffer, effectiveMime, file.name)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buffer = prepared.buffer as any
      mimeType = prepared.mimeType
    } catch (err) {
      console.error("[extract] Image prep failed, using original:", err)
    }
  }

  // Store the file — non-fatal: extraction still runs if storage is misconfigured
  let stored: { url: string; size: number; hash: string } | null = null
  try {
    stored = await storeFile(buffer, mimeType)
  } catch (err) {
    console.error("[extract] File storage failed (continuing with extraction):", err)
  }

  // Extract with Claude if API key is configured
  let extractedFields = {}
  let rawExtracted: Record<string, unknown> = {}
  let ocrStatus = "SKIPPED"

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      ocrStatus = "PROCESSING"
      const result = await extractDocumentFields(buffer, mimeType)
      extractedFields = result.normalized
      rawExtracted = result.raw
      ocrStatus = "COMPLETED"
    } catch (err) {
      console.error("[extract] Claude extraction failed:", err)
      ocrStatus = "FAILED"
    }
  } else {
    console.warn("[extract] ANTHROPIC_API_KEY is not set — skipping extraction")
  }

  return NextResponse.json({
    success: true,
    ocrStatus,
    fileUrl: stored?.url ?? null,
    fileSize: stored?.size ?? buffer.length,
    mimeType,
    fileHash: stored?.hash ?? null,
    documentType,
    extractedFields,
    // Raw pre-normalization response — visible in browser DevTools Network tab
    _rawExtracted: rawExtracted,
  })
}
