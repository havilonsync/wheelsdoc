import { cn } from "@/lib/utils"
import React from "react"

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "outline"

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#1E3A5F] text-white",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  muted: "bg-gray-100 text-gray-500",
  outline: "border border-current bg-transparent text-gray-600",
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
