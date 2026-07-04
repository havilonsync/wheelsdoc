import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserOrg } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { DocumentType } from "@/generated/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getUserOrg(session.user.id)
  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()
  const {
    loadId,
    fileUrl,
    fileSize,
    mimeType,
    fileHash,
    documentType = "BOL",
    extractedFields,
    confidence,
  } = body

  if (!loadId) {
    return NextResponse.json({ error: "loadId is required" }, { status: 400 })
  }

  // Verify the load belongs to the user's org
  const load = await prisma.load.findFirst({
    where: { id: loadId, orgId: membership.orgId },
    select: { id: true },
  })
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 })
  }

  const hasExtraction =
    extractedFields && Object.keys(extractedFields).length > 0

  const document = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        loadId,
        documentType: documentType as DocumentType,
        uploadedById: session.user.id,
        originalFileUrl: fileUrl ?? null,
        fileSize: fileSize ?? null,
        mimeType: mimeType ?? null,
        fileHash: fileHash ?? null,
        ocrStatus: hasExtraction ? "COMPLETED" : "SKIPPED",
        extractedFields: hasExtraction ? extractedFields : undefined,
        verificationStatus: "UNVERIFIED",
      },
    })

    if (hasExtraction) {
      const conf = confidence as Record<string, number> | undefined
      const values = conf ? Object.values(conf) : []
      const avgConfidence =
        values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0

      await tx.documentExtraction.create({
        data: {
          documentId: doc.id,
          provider: "anthropic/claude-sonnet-4-6",
          fields: extractedFields,
          confidence: avgConfidence,
          rawResponse: extractedFields,
          status: "completed",
        },
      })
    }

    return doc
  })

  return NextResponse.json({ document }, { status: 201 })
}
