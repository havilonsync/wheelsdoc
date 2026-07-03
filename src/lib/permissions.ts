import { UserRole, LoadStatus } from "@/generated/prisma"

type Action =
  | "create_load"
  | "edit_load"
  | "delete_load"
  | "assign_driver"
  | "view_loads"
  | "view_all_loads"
  | "manage_org"
  | "manage_users"
  | "manage_billing"
  | "upload_documents"
  | "capture_gps"
  | "sign_bol"
  | "create_invoice"
  | "view_invoice"
  | "submit_factoring"
  | "view_factoring"
  | "view_audit"
  | "admin_access"

type LoadForPermission = {
  orgId: string
  assignedDriverId: string | null
  status: LoadStatus
}

export const ROLE_PERMISSIONS: Record<UserRole, Action[]> = {
  PLATFORM_ADMIN: [
    "create_load",
    "edit_load",
    "delete_load",
    "assign_driver",
    "view_loads",
    "view_all_loads",
    "manage_org",
    "manage_users",
    "manage_billing",
    "upload_documents",
    "capture_gps",
    "sign_bol",
    "create_invoice",
    "view_invoice",
    "submit_factoring",
    "view_factoring",
    "view_audit",
    "admin_access",
  ],
  CARRIER_ADMIN: [
    "create_load",
    "edit_load",
    "delete_load",
    "assign_driver",
    "view_loads",
    "view_all_loads",
    "manage_org",
    "manage_users",
    "manage_billing",
    "upload_documents",
    "create_invoice",
    "view_invoice",
    "submit_factoring",
    "view_factoring",
    "view_audit",
  ],
  DISPATCHER: [
    "create_load",
    "edit_load",
    "assign_driver",
    "view_loads",
    "view_all_loads",
    "upload_documents",
    "create_invoice",
    "view_invoice",
  ],
  DRIVER: [
    "view_loads",
    "upload_documents",
    "capture_gps",
    "sign_bol",
  ],
  SHIPPER: [
    "view_loads",
    "upload_documents",
    "sign_bol",
  ],
  RECEIVER: [
    "view_loads",
    "sign_bol",
  ],
  BROKER: [
    "create_load",
    "edit_load",
    "view_loads",
    "view_all_loads",
    "upload_documents",
    "view_invoice",
  ],
  FACTORING_COMPANY: [
    "view_loads",
    "view_invoice",
    "view_factoring",
    "submit_factoring",
  ],
  ACCOUNTANT: [
    "view_loads",
    "view_all_loads",
    "view_invoice",
    "view_factoring",
    "view_audit",
    "create_invoice",
  ],
  AUDITOR: [
    "view_loads",
    "view_all_loads",
    "view_audit",
  ],
}

export function hasPermission(role: UserRole, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false
}

export function canAccessLoad(
  role: UserRole,
  load: LoadForPermission,
  userId: string
): boolean {
  if (role === "PLATFORM_ADMIN") return true
  if (hasPermission(role, "view_all_loads")) return true
  if (role === "DRIVER" && load.assignedDriverId === userId) return true
  return false
}
