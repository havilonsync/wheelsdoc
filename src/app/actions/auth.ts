"use server"

import { redirect } from "next/navigation"
import { signIn, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SignupSchema, LoginSchema } from "@/lib/validators"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import type { OrgType, UserRole } from "@/generated/prisma"

export type ActionState = { error?: string } | undefined

// React 19 useActionState requires (prevState, formData) signature
export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = LoginSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid credentials" }
  }

  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw err
  }

  redirect("/dashboard")
}

export async function signupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    orgName: formData.get("orgName"),
    orgType: formData.get("orgType"),
  }

  const result = SignupSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name, email, password, orgName, orgType } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat("-", Date.now().toString(36))

  const defaultRole: Record<OrgType, UserRole> = {
    CARRIER: "CARRIER_ADMIN",
    SHIPPER: "SHIPPER",
    BROKER: "BROKER",
    FACTORING_COMPANY: "FACTORING_COMPANY",
    RECEIVER: "RECEIVER",
    LOGISTICS: "CARRIER_ADMIN",
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, hashedPassword },
    })

    const org = await tx.organization.create({
      data: { name: orgName, slug, orgType: orgType as OrgType },
    })

    await tx.organizationMembership.create({
      data: {
        userId: user.id,
        orgId: org.id,
        role: defaultRole[orgType as OrgType],
        status: "ACTIVE",
        acceptedAt: new Date(),
      },
    })
  })

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
  } catch {
    redirect("/login")
  }

  redirect("/dashboard")
}

export async function logoutAction() {
  await signOut({ redirect: false })
  redirect("/login")
}
