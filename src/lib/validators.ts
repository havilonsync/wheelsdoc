import { z } from "zod"

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(1, "Organization name is required"),
  orgType: z.enum([
    "CARRIER",
    "SHIPPER",
    "BROKER",
    "FACTORING_COMPANY",
    "RECEIVER",
    "LOGISTICS",
  ]),
})

export const CreateOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  orgType: z.enum([
    "CARRIER",
    "SHIPPER",
    "BROKER",
    "FACTORING_COMPANY",
    "RECEIVER",
    "LOGISTICS",
  ]),
  dotNumber: z.string().optional(),
  mcNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
})

export const InviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum([
    "PLATFORM_ADMIN",
    "CARRIER_ADMIN",
    "DISPATCHER",
    "DRIVER",
    "SHIPPER",
    "RECEIVER",
    "BROKER",
    "FACTORING_COMPANY",
    "ACCOUNTANT",
    "AUDITOR",
  ]),
})

export const CreateStopSchema = z.object({
  stopType: z.enum(["PICKUP", "DELIVERY"]),
  stopNumber: z.number().int().positive(),
  name: z.string().min(1, "Stop name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  appointmentStart: z.string().optional(),
  appointmentEnd: z.string().optional(),
  commodity: z.string().optional(),
  quantity: z.number().optional(),
  unitType: z.string().optional(),
  weight: z.number().optional(),
  weightUnit: z.string().default("lbs"),
  notes: z.string().optional(),
})

export const CreateLoadSchema = z.object({
  bolNumber: z.string().optional(),
  poNumber: z.string().optional(),
  rateConfNumber: z.string().optional(),
  brokerRefNumber: z.string().optional(),
  rateType: z
    .enum([
      "FLAT_RATE",
      "PER_MILE",
      "PER_TON",
      "PER_UNIT",
      "PER_PALLET",
      "PER_CWT",
      "PER_CASE",
      "PER_GALLON",
      "CUSTOM_FORMULA",
    ])
    .default("FLAT_RATE"),
  agreedRate: z.number().min(0).default(0),
  fuelSurcharge: z.number().min(0).default(0),
  mileage: z.number().min(0).optional(),
  templateId: z.string().optional(),
  hazmatFlag: z.boolean().default(false),
  tempRequired: z.boolean().default(false),
  tempMin: z.number().optional(),
  tempMax: z.number().optional(),
  sealNumber: z.string().optional(),
  trailerNumber: z.string().optional(),
  truckNumber: z.string().optional(),
  specialInstructions: z.string().optional(),
  detentionTerms: z.string().optional(),
  freeTimeMinutes: z.number().int().default(120),
  lumperTerms: z.string().optional(),
  assignedDriverId: z.string().optional(),
  stops: z.array(CreateStopSchema).min(1, "At least one stop is required"),
  shipperName: z.string().optional(),
  shipperAddress: z.string().optional(),
  shipperCity: z.string().optional(),
  shipperState: z.string().optional(),
  shipperZip: z.string().optional(),
  consigneeName: z.string().optional(),
  consigneeAddress: z.string().optional(),
  consigneeCity: z.string().optional(),
  consigneeState: z.string().optional(),
  consigneeZip: z.string().optional(),
})

export const UpdateLoadSchema = CreateLoadSchema.partial().extend({
  status: z
    .enum([
      "DRAFT",
      "ASSIGNED",
      "ACCEPTED",
      "EN_ROUTE_PICKUP",
      "ARRIVED_PICKUP",
      "LOADING",
      "DEPARTED_PICKUP",
      "EN_ROUTE_DELIVERY",
      "ARRIVED_DELIVERY",
      "UNLOADING",
      "DELIVERED",
      "DOCS_NEEDED",
      "RECONCILIATION_NEEDED",
      "RECONCILED",
      "INVOICE_READY",
      "SUBMITTED_TO_FACTORING",
      "PAID",
      "DISPUTED",
      "ARCHIVED",
    ])
    .optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SignupInput = z.infer<typeof SignupSchema>
export type CreateLoadInput = z.infer<typeof CreateLoadSchema>
export type UpdateLoadInput = z.infer<typeof UpdateLoadSchema>
export type CreateStopInput = z.infer<typeof CreateStopSchema>
export type CreateOrgInput = z.infer<typeof CreateOrgSchema>
export type InviteUserInput = z.infer<typeof InviteUserSchema>
