import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding WheelsDoc test accounts...")

  const password = await bcrypt.hash("WheelsDoc2026!", 12)

  // ── Organizations ──────────────────────────────────────────────────────────

  const adminOrg = await prisma.organization.upsert({
    where: { slug: "wheelsdoc-platform" },
    update: {},
    create: {
      name: "WheelsDoc Platform",
      slug: "wheelsdoc-platform",
      orgType: "LOGISTICS",
      plan: "ENTERPRISE",
    },
  })

  const carrierOrg = await prisma.organization.upsert({
    where: { slug: "randy-trucking" },
    update: {},
    create: {
      name: "Randy Trucking LLC",
      slug: "randy-trucking",
      orgType: "CARRIER",
      plan: "SMALL_CARRIER",
      dotNumber: "9988776",
      mcNumber: "MC-112233",
      phone: "555-100-0001",
      address: "100 Trucker Way",
      city: "Nashville",
      state: "TN",
      zip: "37201",
    },
  })

  const shipperOrg = await prisma.organization.upsert({
    where: { slug: "test-shipper-co" },
    update: {},
    create: {
      name: "Test Shipper Co",
      slug: "test-shipper-co",
      orgType: "SHIPPER",
      plan: "SHIPPER_BROKER",
      phone: "555-200-0001",
      address: "200 Shipper Blvd",
      city: "Atlanta",
      state: "GA",
      zip: "30301",
    },
  })

  // ── Users ──────────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@wheelsdoc.com" },
    update: {},
    create: {
      name: "WheelsDoc Admin",
      email: "admin@wheelsdoc.com",
      hashedPassword: password,
    },
  })

  const randyUser = await prisma.user.upsert({
    where: { email: "randy@wheelsdoc.com" },
    update: {},
    create: {
      name: "Randy Driver",
      email: "randy@wheelsdoc.com",
      hashedPassword: password,
      phone: "555-100-0002",
    },
  })

  const shipperUser = await prisma.user.upsert({
    where: { email: "shipper@wheelsdoc.com" },
    update: {},
    create: {
      name: "Test Shipper",
      email: "shipper@wheelsdoc.com",
      hashedPassword: password,
      phone: "555-200-0002",
    },
  })

  // ── Memberships ────────────────────────────────────────────────────────────

  const memberships = [
    { userId: adminUser.id, orgId: adminOrg.id, role: "PLATFORM_ADMIN" as const },
    { userId: randyUser.id, orgId: carrierOrg.id, role: "CARRIER_ADMIN" as const },
    { userId: shipperUser.id, orgId: shipperOrg.id, role: "SHIPPER" as const },
  ]

  for (const m of memberships) {
    await prisma.organizationMembership.upsert({
      where: { userId_orgId: { userId: m.userId, orgId: m.orgId } },
      update: {},
      create: { ...m, status: "ACTIVE", acceptedAt: new Date() },
    })
  }

  console.log("\n✅ Test accounts created!\n")
  console.log("Test credentials (all passwords: WheelsDoc2026!)")
  console.log("─────────────────────────────────────────────────────────")
  console.log("  admin@wheelsdoc.com     Platform Admin")
  console.log("  randy@wheelsdoc.com     Carrier Admin (Randy Trucking)")
  console.log("  shipper@wheelsdoc.com   Shipper (Test Shipper Co)")
  console.log("─────────────────────────────────────────────────────────\n")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
