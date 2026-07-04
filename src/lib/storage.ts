import crypto from "crypto"
import path from "path"

export type StoredFile = { url: string; size: number; hash: string }

// Diagnose: BLOB_READ_WRITE_TOKEN must be set in Vercel environment variables.
// To get a valid token:
//   1. Go to vercel.com → wheelsdoc project → Storage tab
//   2. Create a Blob store (or select existing)
//   3. Go to the store's Settings → copy the BLOB_READ_WRITE_TOKEN
//   4. Paste it in Vercel → wheelsdoc → Settings → Environment Variables
// The token looks like: vercel_blob_rw_XXXXXXXXX_YYYYYYYY
//
// Without a valid token, files are saved locally in dev and skipped in production.
// Document extraction (Claude) still runs regardless of storage status.

export async function storeFile(buffer: Buffer, mimeType: string): Promise<StoredFile> {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  const ext =
    mimeType === "application/pdf" ? "pdf"
    : mimeType === "image/png" ? "png"
    : mimeType === "image/webp" ? "webp"
    : "jpg"
  const filename = `${hash.slice(0, 16)}-${Date.now()}.${ext}`

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) {
    try {
      const { put } = await import("@vercel/blob")
      const blob = await put(`documents/${filename}`, buffer, {
        access: "public",
        contentType: mimeType,
      })
      return { url: blob.url, size: buffer.length, hash }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("Invalid token") || msg.includes("unauthorized") || msg.includes("403") || msg.includes("401")) {
        console.error(
          "[storage] BLOB_READ_WRITE_TOKEN is set but invalid.\n" +
          "  → Regenerate it: Vercel dashboard → wheelsdoc → Storage → your Blob store → Settings → copy token\n" +
          "  → Paste it in: Vercel → wheelsdoc → Settings → Environment Variables → BLOB_READ_WRITE_TOKEN\n" +
          "  Raw error:", msg
        )
      } else {
        console.error("[storage] Vercel Blob upload failed:", msg)
      }
      throw err
    }
  }

  // Local dev: write to public/uploads/ (served as static files)
  // Note: Vercel's serverless filesystem is read-only — callers wrap this in try-catch
  const { writeFile, mkdir } = await import("fs/promises")
  const dir = path.join(process.cwd(), "public", "uploads")
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  console.log(`[storage] Local dev: saved to public/uploads/${filename}`)
  return { url: `/uploads/${filename}`, size: buffer.length, hash }
}
