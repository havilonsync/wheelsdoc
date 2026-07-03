-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'CARRIER_ADMIN', 'DISPATCHER', 'DRIVER', 'SHIPPER', 'RECEIVER', 'BROKER', 'FACTORING_COMPANY', 'ACCOUNTANT', 'AUDITOR');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('CARRIER', 'SHIPPER', 'BROKER', 'FACTORING_COMPANY', 'RECEIVER', 'LOGISTICS');

-- CreateEnum
CREATE TYPE "OrgPlan" AS ENUM ('FREE_DRIVER', 'OWNER_OPERATOR', 'SMALL_CARRIER', 'FLEET', 'SHIPPER_BROKER', 'FACTORING_PARTNER', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('DRAFT', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP', 'LOADING', 'DEPARTED_PICKUP', 'EN_ROUTE_DELIVERY', 'ARRIVED_DELIVERY', 'UNLOADING', 'DELIVERED', 'DOCS_NEEDED', 'RECONCILIATION_NEEDED', 'RECONCILED', 'INVOICE_READY', 'SUBMITTED_TO_FACTORING', 'PAID', 'DISPUTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('FLAT_RATE', 'PER_MILE', 'PER_TON', 'PER_UNIT', 'PER_PALLET', 'PER_CWT', 'PER_CASE', 'PER_GALLON', 'CUSTOM_FORMULA');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('SHIPPER', 'CONSIGNEE', 'CARRIER', 'BROKER', 'FACTORING');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BOL', 'POD', 'RATE_CONFIRMATION', 'SCALE_TICKET', 'LUMPER_RECEIPT', 'INVOICE', 'INSURANCE', 'CUSTOMS', 'HAZMAT', 'EXCEPTION_REPORT', 'PHOTOS', 'OTHER');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'DISPUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "GPSEventType" AS ENUM ('DRIVER_ACCEPTED', 'DEPARTED_YARD', 'ARRIVED_PICKUP', 'DEPARTED_PICKUP', 'ARRIVED_DELIVERY', 'DEPARTED_DELIVERY', 'ARRIVED_YARD', 'FUEL_STOP', 'REST_STOP', 'BREAKDOWN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PASS', 'FAIL', 'WARNING', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CheckSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('READY_FOR_FACTORING', 'NEEDS_ATTENTION', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DISPUTED', 'VOID');

-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('BASE', 'DETENTION', 'LUMPER', 'ACCESSORIAL', 'DEDUCTION', 'TAX');

-- CreateEnum
CREATE TYPE "FactoringPacketStatus" AS ENUM ('DRAFT', 'READY', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'FUNDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'PAUSED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('GOOGLE_MAPS', 'MAPBOX', 'OPENAI_OCR', 'GOOGLE_VISION', 'AWS_TEXTRACT', 'TWILIO', 'SIGNALWIRE', 'RESEND', 'SENDGRID', 'STRIPE', 'QUICKBOOKS', 'MCLEOD', 'SAMSARA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "hashedPassword" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orgType" "OrgType" NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1E3A5F',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "plan" "OrgPlan" NOT NULL DEFAULT 'FREE_DRIVER',
    "dotNumber" TEXT,
    "mcNumber" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "loadNumber" TEXT NOT NULL,
    "bolNumber" TEXT,
    "poNumber" TEXT,
    "rateConfNumber" TEXT,
    "brokerRefNumber" TEXT,
    "orgId" TEXT NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'DRAFT',
    "rateType" "RateType" NOT NULL DEFAULT 'FLAT_RATE',
    "agreedRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuelSurcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mileage" DECIMAL(10,2),
    "templateId" TEXT,
    "hazmatFlag" BOOLEAN NOT NULL DEFAULT false,
    "tempRequired" BOOLEAN NOT NULL DEFAULT false,
    "tempMin" DECIMAL(5,2),
    "tempMax" DECIMAL(5,2),
    "sealNumber" TEXT,
    "trailerNumber" TEXT,
    "truckNumber" TEXT,
    "specialInstructions" TEXT,
    "detentionTerms" TEXT,
    "freeTimeMinutes" INTEGER NOT NULL DEFAULT 120,
    "lumperTerms" TEXT,
    "rateFormula" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedDriverId" TEXT,
    "factReadinessScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadStop" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "stopType" "StopType" NOT NULL,
    "stopNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "appointmentStart" TIMESTAMP(3),
    "appointmentEnd" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "commodity" TEXT,
    "quantity" DECIMAL(10,3),
    "unitType" TEXT,
    "weight" DECIMAL(10,2),
    "weightUnit" TEXT NOT NULL DEFAULT 'lbs',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoadStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadParty" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "partyType" "PartyType" NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "email" TEXT,

    CONSTRAINT "LoadParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalBOL" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "bolNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedPdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalBOL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOLLineItem" (
    "id" TEXT NOT NULL,
    "bolId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitType" TEXT NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "weightUnit" TEXT NOT NULL DEFAULT 'lbs',
    "packageType" TEXT,
    "specialHandling" TEXT,
    "hazmatClass" TEXT,
    "notes" TEXT,

    CONSTRAINT "BOLLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'PENDING',
    "extractedFields" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "fileHash" TEXT,
    "originalFileUrl" TEXT NOT NULL,
    "processedFileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentExtraction" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fields" JSONB NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "rawResponse" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "DocumentExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "stopId" TEXT,
    "signerName" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "signerEmail" TEXT,
    "signatureImageUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "ipAddress" TEXT,
    "deviceInfo" JSONB,
    "documentVersionHash" TEXT,
    "loadStatusAtSigning" TEXT,
    "uploadedById" TEXT,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSEvent" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "eventType" "GPSEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy" DECIMAL(8,2),
    "notes" TEXT,
    "documentId" TEXT,

    CONSTRAINT "GPSEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationBreadcrumb" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy" DECIMAL(8,2),
    "speed" DECIMAL(8,2),

    CONSTRAINT "LocationBreadcrumb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationCheck" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "severity" "CheckSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "expectedValue" TEXT,
    "actualValue" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationResult" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "overallStatus" "ReconciliationStatus" NOT NULL,
    "readinessScore" INTEGER NOT NULL,
    "checkCount" INTEGER NOT NULL,
    "issueCount" INTEGER NOT NULL,
    "resolvedCount" INTEGER NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB,

    CONSTRAINT "ReconciliationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "baseAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "detentionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lumperAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "accessorialAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuelSurcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerms" TEXT NOT NULL DEFAULT 'NET30',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "billToOrgId" TEXT,
    "notes" TEXT,
    "generatedPdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "lineType" "LineItemType" NOT NULL DEFAULT 'BASE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetentionEvent" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "stopId" TEXT,
    "arrivedAt" TIMESTAMP(3) NOT NULL,
    "freeTimeExpiredAt" TIMESTAMP(3),
    "billingStartAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "billableMinutes" INTEGER,
    "ratePerHour" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "evidenceDocumentIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetentionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessorialCharge" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "chargeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "evidenceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessorialCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringPacket" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "status" "FactoringPacketStatus" NOT NULL DEFAULT 'DRAFT',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "packetPdfUrl" TEXT,
    "packetZipUrl" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedToOrgId" TEXT,
    "submittedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "response" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringPacket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringPacketDocument" (
    "id" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FactoringPacketDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "loadId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "data" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadNote" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "isActionItem" BOOLEAN NOT NULL DEFAULT false,
    "mentionedUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "annualPrice" DECIMAL(10,2),
    "maxLoads" INTEGER,
    "maxDrivers" INTEGER,
    "maxUsers" INTEGER,
    "features" JSONB NOT NULL,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSubscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "loadsUsed" INTEGER NOT NULL DEFAULT 0,
    "usersUsed" INTEGER NOT NULL DEFAULT 0,
    "driversUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMetric" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orgId" TEXT,
    "loadId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRAccessToken" (
    "id" TEXT NOT NULL,
    "loadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "integrationType" "IntegrationType" NOT NULL,
    "credentials" JSONB,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "lastSyncAt" TIMESTAMP(3),
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_orgId_key" ON "OrganizationMembership"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Load_loadNumber_key" ON "Load"("loadNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoadStop_loadId_stopType_stopNumber_key" ON "LoadStop"("loadId", "stopType", "stopNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalBOL_loadId_key" ON "DigitalBOL"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationResult_loadId_key" ON "ReconciliationResult"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_loadId_key" ON "Invoice"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FactoringPacket_loadId_key" ON "FactoringPacket"("loadId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSubscription_orgId_key" ON "OrganizationSubscription"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "QRAccessToken_token_key" ON "QRAccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_keyHash_key" ON "APIKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_orgId_integrationType_key" ON "IntegrationConnection"("orgId", "integrationType");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LoadTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadStop" ADD CONSTRAINT "LoadStop_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadParty" ADD CONSTRAINT "LoadParty_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadParty" ADD CONSTRAINT "LoadParty_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTemplate" ADD CONSTRAINT "LoadTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadTemplate" ADD CONSTRAINT "LoadTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalBOL" ADD CONSTRAINT "DigitalBOL_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOLLineItem" ADD CONSTRAINT "BOLLineItem_bolId_fkey" FOREIGN KEY ("bolId") REFERENCES "DigitalBOL"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExtraction" ADD CONSTRAINT "DocumentExtraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "LoadStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSEvent" ADD CONSTRAINT "GPSEvent_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSEvent" ADD CONSTRAINT "GPSEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBreadcrumb" ADD CONSTRAINT "LocationBreadcrumb_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationBreadcrumb" ADD CONSTRAINT "LocationBreadcrumb_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationCheck" ADD CONSTRAINT "ReconciliationCheck_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationCheck" ADD CONSTRAINT "ReconciliationCheck_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationResult" ADD CONSTRAINT "ReconciliationResult_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billToOrgId_fkey" FOREIGN KEY ("billToOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetentionEvent" ADD CONSTRAINT "DetentionEvent_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetentionEvent" ADD CONSTRAINT "DetentionEvent_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "LoadStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessorialCharge" ADD CONSTRAINT "AccessorialCharge_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringPacket" ADD CONSTRAINT "FactoringPacket_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringPacket" ADD CONSTRAINT "FactoringPacket_submittedToOrgId_fkey" FOREIGN KEY ("submittedToOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringPacket" ADD CONSTRAINT "FactoringPacket_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringPacketDocument" ADD CONSTRAINT "FactoringPacketDocument_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "FactoringPacket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringPacketDocument" ADD CONSTRAINT "FactoringPacketDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadNote" ADD CONSTRAINT "LoadNote_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadNote" ADD CONSTRAINT "LoadNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMetric" ADD CONSTRAINT "UsageMetric_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRAccessToken" ADD CONSTRAINT "QRAccessToken_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
