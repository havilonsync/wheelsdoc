import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { LoadStatus } from "@/generated/prisma"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num)
}

export function formatDate(date: Date | string, fmt = "MM/dd/yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, fmt)
}

export function formatLoadNumber(id: string): string {
  const num = parseInt(id.replace(/\D/g, "").slice(-6) || "0", 10)
  return `HP-${String(num).padStart(6, "0")}`
}

export function generateLoadNumber(): string {
  return `HP-${Date.now().toString(36).toUpperCase()}`
}

const STATUS_COLORS: Record<LoadStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-blue-200 text-blue-800",
  EN_ROUTE_PICKUP: "bg-indigo-100 text-indigo-700",
  ARRIVED_PICKUP: "bg-indigo-200 text-indigo-800",
  LOADING: "bg-purple-100 text-purple-700",
  DEPARTED_PICKUP: "bg-purple-200 text-purple-800",
  EN_ROUTE_DELIVERY: "bg-amber-100 text-amber-700",
  ARRIVED_DELIVERY: "bg-amber-200 text-amber-800",
  UNLOADING: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  DOCS_NEEDED: "bg-red-100 text-red-700",
  RECONCILIATION_NEEDED: "bg-yellow-100 text-yellow-700",
  RECONCILED: "bg-teal-100 text-teal-700",
  INVOICE_READY: "bg-cyan-100 text-cyan-700",
  SUBMITTED_TO_FACTORING: "bg-sky-100 text-sky-700",
  PAID: "bg-green-200 text-green-800",
  DISPUTED: "bg-red-200 text-red-800",
  ARCHIVED: "bg-gray-200 text-gray-600",
}

const STATUS_LABELS: Record<LoadStatus, string> = {
  DRAFT: "Draft",
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  EN_ROUTE_PICKUP: "En Route to Pickup",
  ARRIVED_PICKUP: "Arrived at Pickup",
  LOADING: "Loading",
  DEPARTED_PICKUP: "Departed Pickup",
  EN_ROUTE_DELIVERY: "En Route to Delivery",
  ARRIVED_DELIVERY: "Arrived at Delivery",
  UNLOADING: "Unloading",
  DELIVERED: "Delivered",
  DOCS_NEEDED: "Docs Needed",
  RECONCILIATION_NEEDED: "Reconciliation Needed",
  RECONCILED: "Reconciled",
  INVOICE_READY: "Invoice Ready",
  SUBMITTED_TO_FACTORING: "Submitted to Factoring",
  PAID: "Paid",
  DISPUTED: "Disputed",
  ARCHIVED: "Archived",
}

export function getLoadStatusColor(status: LoadStatus): string {
  return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
}

export function getLoadStatusLabel(status: LoadStatus): string {
  return STATUS_LABELS[status] ?? status
}
