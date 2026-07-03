import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding HaulPass database...")

  // Hash each password individually per spec
  const [
    adminPw, carrierPw, dispatchPw, driverPw,
    shipperPw, receiverPw, brokerPw, factoringPw,
    accountingPw, auditorPw,
  ] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("Carrier123!", 12),
    bcrypt.hash("Dispatch123!", 12),
    bcrypt.hash("Driver123!", 12),
    bcrypt.hash("Shipper123!", 12),
    bcrypt.hash("Receiver123!", 12),
    bcrypt.hash("Broker123!", 12),
    bcrypt.hash("Factor123!", 12),
    bcrypt.hash("Acct123!", 12),
    bcrypt.hash("Audit123!", 12),
  ])

  // ── Organizations ──────────────────────────────────────────────────────────

  const haulpassPlatform = await prisma.organization.upsert({
    where: { slug: "haulpass-platform" },
    update: {},
    create: {
      name: "HaulPass Platform",
      slug: "haulpass-platform",
      orgType: "LOGISTICS",
      plan: "ENTERPRISE",
    },
  })

  const swiftEagle = await prisma.organization.upsert({
    where: { slug: "swift-eagle-logistics" },
    update: {},
    create: {
      name: "Swift Eagle Logistics",
      slug: "swift-eagle-logistics",
      orgType: "CARRIER",
      plan: "SMALL_CARRIER",
      dotNumber: "4821093",
      mcNumber: "MC-923847",
      phone: "555-301-0000",
      address: "1400 Commerce Dr",
      city: "Kansas City",
      state: "MO",
      zip: "64108",
    },
  })

  const midwestGrain = await prisma.organization.upsert({
    where: { slug: "midwest-grain-co" },
    update: {},
    create: {
      name: "Midwest Grain Co",
      slug: "midwest-grain-co",
      orgType: "SHIPPER",
      plan: "SHIPPER_BROKER",
      phone: "555-302-0000",
      address: "800 Farm Bureau Rd",
      city: "Topeka",
      state: "KS",
      zip: "66603",
    },
  })

  const gulfCoast = await prisma.organization.upsert({
    where: { slug: "gulf-coast-distribution" },
    update: {},
    create: {
      name: "Gulf Coast Distribution",
      slug: "gulf-coast-distribution",
      orgType: "RECEIVER",
      plan: "FREE_DRIVER",
      phone: "555-304-0000",
      address: "500 Port Blvd",
      city: "Houston",
      state: "TX",
      zip: "77001",
    },
  })

  const centralFreight = await prisma.organization.upsert({
    where: { slug: "central-freight-brokers" },
    update: {},
    create: {
      name: "Central Freight Brokers",
      slug: "central-freight-brokers",
      orgType: "BROKER",
      plan: "SHIPPER_BROKER",
      phone: "555-303-0000",
      address: "210 Brokerage Blvd",
      city: "Chicago",
      state: "IL",
      zip: "60601",
    },
  })

  const atlasFactoring = await prisma.organization.upsert({
    where: { slug: "atlas-factoring-group" },
    update: {},
    create: {
      name: "Atlas Factoring Group",
      slug: "atlas-factoring-group",
      orgType: "FACTORING_COMPANY",
      plan: "FACTORING_PARTNER",
      phone: "555-305-0000",
      address: "1000 Finance Plaza",
      city: "Dallas",
      state: "TX",
      zip: "75201",
    },
  })

  // ── Users ──────────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@haulpass.dev" },
    update: {},
    create: { name: "Platform Admin", email: "admin@haulpass.dev", hashedPassword: adminPw },
  })

  const carrierAdmin = await prisma.user.upsert({
    where: { email: "carrier@haulpass.dev" },
    update: {},
    create: { name: "Alex Carrier", email: "carrier@haulpass.dev", hashedPassword: carrierPw, phone: "555-301-0001" },
  })

  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatch@haulpass.dev" },
    update: {},
    create: { name: "Sam Dispatcher", email: "dispatch@haulpass.dev", hashedPassword: dispatchPw, phone: "555-301-0002" },
  })

  const driver = await prisma.user.upsert({
    where: { email: "driver@haulpass.dev" },
    update: {},
    create: { name: "Mike Driver", email: "driver@haulpass.dev", hashedPassword: driverPw, phone: "555-301-0003" },
  })

  const shipperUser = await prisma.user.upsert({
    where: { email: "shipper@haulpass.dev" },
    update: {},
    create: { name: "Jennifer Shipper", email: "shipper@haulpass.dev", hashedPassword: shipperPw, phone: "555-302-0001" },
  })

  const receiverUser = await prisma.user.upsert({
    where: { email: "receiver@haulpass.dev" },
    update: {},
    create: { name: "Bob Receiver", email: "receiver@haulpass.dev", hashedPassword: receiverPw, phone: "555-304-0001" },
  })

  const brokerUser = await prisma.user.upsert({
    where: { email: "broker@haulpass.dev" },
    update: {},
    create: { name: "Carol Broker", email: "broker@haulpass.dev", hashedPassword: brokerPw, phone: "555-303-0001" },
  })

  const factoringUser = await prisma.user.upsert({
    where: { email: "factoring@haulpass.dev" },
    update: {},
    create: { name: "Dave Factor", email: "factoring@haulpass.dev", hashedPassword: factoringPw },
  })

  const accountant = await prisma.user.upsert({
    where: { email: "accounting@haulpass.dev" },
    update: {},
    create: { name: "Lynn Accountant", email: "accounting@haulpass.dev", hashedPassword: accountingPw },
  })

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@haulpass.dev" },
    update: {},
    create: { name: "Tom Auditor", email: "auditor@haulpass.dev", hashedPassword: auditorPw },
  })

  // ── Memberships ────────────────────────────────────────────────────────────

  const memberships = [
    { userId: adminUser.id, orgId: haulpassPlatform.id, role: "PLATFORM_ADMIN" as const },
    { userId: auditor.id, orgId: haulpassPlatform.id, role: "AUDITOR" as const },
    { userId: carrierAdmin.id, orgId: swiftEagle.id, role: "CARRIER_ADMIN" as const },
    { userId: dispatcher.id, orgId: swiftEagle.id, role: "DISPATCHER" as const },
    { userId: driver.id, orgId: swiftEagle.id, role: "DRIVER" as const },
    { userId: accountant.id, orgId: swiftEagle.id, role: "ACCOUNTANT" as const },
    { userId: shipperUser.id, orgId: midwestGrain.id, role: "SHIPPER" as const },
    { userId: receiverUser.id, orgId: gulfCoast.id, role: "RECEIVER" as const },
    { userId: brokerUser.id, orgId: centralFreight.id, role: "BROKER" as const },
    { userId: factoringUser.id, orgId: atlasFactoring.id, role: "FACTORING_COMPANY" as const },
  ]

  for (const m of memberships) {
    await prisma.organizationMembership.upsert({
      where: { userId_orgId: { userId: m.userId, orgId: m.orgId } },
      update: {},
      create: { ...m, status: "ACTIVE", acceptedAt: new Date() },
    })
  }

  // ── Subscription Plans ────────────────────────────────────────────────────

  const plans = [
    {
      name: "Free Driver",
      slug: "free-driver",
      monthlyPrice: 0,
      maxLoads: 10,
      maxDrivers: 1,
      maxUsers: 1,
      sortOrder: 0,
      features: { loads: 10, drivers: 1, users: 1, documentCapture: true, gps: true },
    },
    {
      name: "Owner-Operator",
      slug: "owner-operator",
      monthlyPrice: 29,
      annualPrice: 290,
      maxLoads: 50,
      maxDrivers: 1,
      maxUsers: 2,
      sortOrder: 1,
      features: { loads: 50, drivers: 1, users: 2, documentCapture: true, gps: true, detention: true, factoring: true, invoicing: true },
    },
    {
      name: "Small Carrier",
      slug: "small-carrier",
      monthlyPrice: 99,
      annualPrice: 990,
      maxLoads: null,
      maxDrivers: 5,
      maxUsers: 10,
      sortOrder: 2,
      features: { loads: -1, drivers: 5, users: 10, documentCapture: true, gps: true, detention: true, factoring: true, invoicing: true, dispatcher: true, reconciliation: true },
    },
    {
      name: "Fleet",
      slug: "fleet",
      monthlyPrice: 249,
      annualPrice: 2490,
      maxLoads: null,
      maxDrivers: 25,
      maxUsers: null,
      sortOrder: 3,
      features: { loads: -1, drivers: 25, users: -1, documentCapture: true, gps: true, detention: true, factoring: true, invoicing: true, dispatcher: true, reconciliation: true, brokerPortal: true, apiAccess: true, customReporting: true },
    },
    {
      name: "Shipper/Broker",
      slug: "shipper-broker",
      monthlyPrice: 149,
      annualPrice: 1490,
      maxLoads: null,
      maxDrivers: null,
      maxUsers: 20,
      sortOrder: 4,
      features: { loads: -1, createLoads: true, inviteCarriers: true, digitalPaperwork: true, statusTracking: true },
    },
    {
      name: "Factoring Partner",
      slug: "factoring-partner",
      monthlyPrice: 199,
      annualPrice: 1990,
      maxLoads: null,
      maxDrivers: null,
      maxUsers: 10,
      sortOrder: 5,
      features: { loads: -1, receivePackets: true, readinessReview: true, apiHooks: true },
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    })
  }

  // ── Sample Loads ───────────────────────────────────────────────────────────

  const loadsData = [
    {
      loadNumber: "HP-SEED001",
      orgId: swiftEagle.id,
      createdById: carrierAdmin.id,
      status: "DRAFT" as const,
      rateType: "FLAT_RATE" as const,
      agreedRate: 2200,
      fuelSurcharge: 200,
      mileage: 480,
      freeTimeMinutes: 120,
      factReadinessScore: 0,
      bolNumber: "BOL-2026-001",
      stops: [
        {
          stopType: "PICKUP" as const, stopNumber: 1,
          name: "Midwest Grain Co - Chicago",
          address: "1200 Industrial Ave", city: "Chicago", state: "IL", zip: "60609",
          contactName: "Jennifer Shipper", contactPhone: "555-302-0001",
          commodity: "Corn", weight: 42000, weightUnit: "lbs",
          appointmentStart: new Date("2026-07-05T08:00:00Z"),
          appointmentEnd: new Date("2026-07-05T12:00:00Z"),
        },
        {
          stopType: "DELIVERY" as const, stopNumber: 1,
          name: "ADM Grain Terminal - Dallas",
          address: "4500 Commerce Way", city: "Dallas", state: "TX", zip: "75201",
          contactName: "Receiving Dept", contactPhone: "555-400-0001",
          commodity: "Corn", weight: 42000, weightUnit: "lbs",
          appointmentStart: new Date("2026-07-07T06:00:00Z"),
          appointmentEnd: new Date("2026-07-07T10:00:00Z"),
        },
      ],
    },
    {
      loadNumber: "HP-SEED002",
      orgId: swiftEagle.id,
      createdById: dispatcher.id,
      assignedDriverId: driver.id,
      status: "EN_ROUTE_DELIVERY" as const,
      rateType: "PER_MILE" as const,
      agreedRate: 2.85,
      fuelSurcharge: 0.35,
      mileage: 632,
      freeTimeMinutes: 120,
      trailerNumber: "SEL-4821",
      truckNumber: "SEL-T18",
      factReadinessScore: 65,
      bolNumber: "BOL-2026-002",
      stops: [
        {
          stopType: "PICKUP" as const, stopNumber: 1,
          name: "St. Louis Distribution Hub",
          address: "800 Warehouse Rd", city: "St. Louis", state: "MO", zip: "63101",
          contactName: "Dock Manager", contactPhone: "555-401-0001",
          commodity: "Auto Parts", weight: 28000, weightUnit: "lbs",
          actualArrival: new Date("2026-07-02T08:00:00Z"),
          actualDeparture: new Date("2026-07-02T11:30:00Z"),
        },
        {
          stopType: "DELIVERY" as const, stopNumber: 1,
          name: "Memphis Logistics Center",
          address: "2200 Port Industrial Rd", city: "Memphis", state: "TN", zip: "38101",
          contactName: "Receiving", contactPhone: "555-402-0001",
          commodity: "Auto Parts", weight: 28000, weightUnit: "lbs",
          appointmentStart: new Date("2026-07-03T10:00:00Z"),
          appointmentEnd: new Date("2026-07-03T14:00:00Z"),
        },
      ],
    },
    {
      loadNumber: "HP-SEED003",
      orgId: swiftEagle.id,
      createdById: carrierAdmin.id,
      assignedDriverId: driver.id,
      status: "DELIVERED" as const,
      rateType: "FLAT_RATE" as const,
      agreedRate: 2500,
      fuelSurcharge: 225,
      mileage: 530,
      freeTimeMinutes: 120,
      factReadinessScore: 35,
      bolNumber: "BOL-2026-003",
      stops: [
        {
          stopType: "PICKUP" as const, stopNumber: 1,
          name: "Kansas City Grain Coop",
          address: "1400 Grain Elevator Rd", city: "Kansas City", state: "MO", zip: "64108",
          commodity: "Wheat", weight: 44000, weightUnit: "lbs",
          actualArrival: new Date("2026-06-29T07:00:00Z"),
          actualDeparture: new Date("2026-06-29T11:00:00Z"),
        },
        {
          stopType: "DELIVERY" as const, stopNumber: 1,
          name: "Oklahoma City Feed Mill",
          address: "300 Mill Dr", city: "Oklahoma City", state: "OK", zip: "73102",
          commodity: "Wheat", weight: 44000, weightUnit: "lbs",
          actualArrival: new Date("2026-06-30T09:00:00Z"),
          actualDeparture: new Date("2026-06-30T13:30:00Z"),
        },
      ],
    },
    {
      loadNumber: "HP-SEED004",
      orgId: swiftEagle.id,
      createdById: dispatcher.id,
      assignedDriverId: driver.id,
      status: "RECONCILED" as const,
      rateType: "FLAT_RATE" as const,
      agreedRate: 1950,
      fuelSurcharge: 175,
      mileage: 415,
      freeTimeMinutes: 120,
      factReadinessScore: 90,
      bolNumber: "BOL-2026-004",
      stops: [
        {
          stopType: "PICKUP" as const, stopNumber: 1,
          name: "Denver Logistics Park",
          address: "5600 Airport Blvd", city: "Denver", state: "CO", zip: "80239",
          commodity: "Electronics", weight: 18000, weightUnit: "lbs",
          actualArrival: new Date("2026-06-25T06:00:00Z"),
          actualDeparture: new Date("2026-06-25T09:00:00Z"),
        },
        {
          stopType: "DELIVERY" as const, stopNumber: 1,
          name: "Albuquerque Tech Hub",
          address: "1200 Industrial Blvd", city: "Albuquerque", state: "NM", zip: "87102",
          commodity: "Electronics", weight: 18000, weightUnit: "lbs",
          actualArrival: new Date("2026-06-26T12:00:00Z"),
          actualDeparture: new Date("2026-06-26T15:00:00Z"),
        },
      ],
    },
    {
      loadNumber: "HP-SEED005",
      orgId: swiftEagle.id,
      createdById: carrierAdmin.id,
      assignedDriverId: driver.id,
      status: "PAID" as const,
      rateType: "FLAT_RATE" as const,
      agreedRate: 3100,
      fuelSurcharge: 285,
      mileage: 680,
      freeTimeMinutes: 120,
      factReadinessScore: 100,
      bolNumber: "BOL-2026-005",
      stops: [
        {
          stopType: "PICKUP" as const, stopNumber: 1,
          name: "Minneapolis Cold Storage",
          address: "300 Warehouse Dr", city: "Minneapolis", state: "MN", zip: "55401",
          commodity: "Frozen Foods", weight: 35000, weightUnit: "lbs",
          actualArrival: new Date("2026-06-20T06:00:00Z"),
          actualDeparture: new Date("2026-06-20T09:30:00Z"),
        },
        {
          stopType: "DELIVERY" as const, stopNumber: 1,
          name: "Chicago Wholesale Market",
          address: "1000 Market St", city: "Chicago", state: "IL", zip: "60607",
          commodity: "Frozen Foods", weight: 35000, weightUnit: "lbs",
          actualArrival: new Date("2026-06-21T11:00:00Z"),
          actualDeparture: new Date("2026-06-21T14:00:00Z"),
        },
      ],
    },
  ]

  for (const ld of loadsData) {
    const { stops, ...fields } = ld
    await prisma.load.upsert({
      where: { loadNumber: fields.loadNumber },
      update: {},
      create: {
        ...fields,
        stops: { create: stops },
      },
    })
  }

  console.log("\n✅ Seed complete!\n")
  console.log("Test credentials:")
  console.log("─────────────────────────────────────────────────────────")
  console.log("  admin@haulpass.dev        Admin123!     Platform Admin")
  console.log("  carrier@haulpass.dev      Carrier123!   Carrier Admin")
  console.log("  dispatch@haulpass.dev     Dispatch123!  Dispatcher")
  console.log("  driver@haulpass.dev       Driver123!    Driver")
  console.log("  shipper@haulpass.dev      Shipper123!   Shipper")
  console.log("  receiver@haulpass.dev     Receiver123!  Receiver")
  console.log("  broker@haulpass.dev       Broker123!    Broker")
  console.log("  factoring@haulpass.dev    Factor123!    Factoring Co")
  console.log("  accounting@haulpass.dev   Acct123!      Accountant")
  console.log("  auditor@haulpass.dev      Audit123!     Auditor")
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
