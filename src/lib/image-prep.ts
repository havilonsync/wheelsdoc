/**
 * Prepares images for Claude:
 *  - Converts HEIC/HEIF to JPEG (iPhone native format)
 *  - Compresses any image >1 MB (resize to max 2048px, JPEG @ 85%)
 *  - Always converts HEIC regardless of size
 */

export type PreparedImage = {
  buffer: Buffer
  mimeType: "image/jpeg" | "image/png" | "image/webp"
}

const COMPRESS_THRESHOLD = 1024 * 1024 // 1 MB
const MAX_DIM = 2048

export async function prepareImage(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<PreparedImage> {
  const { default: sharp } = await import("sharp")

  // Detect HEIC by MIME type or file extension fallback
  const ext = filename?.split(".").pop()?.toLowerCase()
  const isHeic =
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    ext === "heic" ||
    ext === "heif"

  const needsCompress = buffer.length > COMPRESS_THRESHOLD

  if (!isHeic && !needsCompress) {
    // Pass through unchanged — must be an accepted Claude type
    return { buffer, mimeType: mimeType as PreparedImage["mimeType"] }
  }

  const img = sharp(buffer, { failOn: "none" })

  // Resize if either dimension exceeds the cap
  const meta = await img.metadata()
  const needsResize = (meta.width ?? 0) > MAX_DIM || (meta.height ?? 0) > MAX_DIM

  const pipeline = needsResize
    ? img.resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
    : img

  const out = await pipeline
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer()

  console.log(
    `[image-prep] ${isHeic ? "HEIC→JPEG" : "compressed"}: ` +
      `${(buffer.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB`
  )

  return { buffer: out, mimeType: "image/jpeg" }
}
