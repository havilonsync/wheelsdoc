import crypto from "crypto"
import path from "path"

export type StoredFile = { url: string; size: number; hash: string }

export async function storeFile(buffer: Buffer, mimeType: string): Promise<StoredFile> {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  const ext =
    mimeType === "application/pdf" ? "pdf"
    : mimeType === "image/png" ? "png"
    : mimeType === "image/webp" ? "webp"
    : "jpg"
  const filename = `${hash.slice(0, 16)}-${Date.now()}.${ext}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob")
    const blob = await put(`documents/${filename}`, buffer, {
      access: "public",
      contentType: mimeType,
    })
    return { url: blob.url, size: buffer.length, hash }
  }

  // Local dev: write to public/uploads (served as static files)
  // On read-only serverless filesystems this will throw — callers should handle that
  const { writeFile, mkdir } = await import("fs/promises")
  const dir = path.join(process.cwd(), "public", "uploads")
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return { url: `/uploads/${filename}`, size: buffer.length, hash }
}
