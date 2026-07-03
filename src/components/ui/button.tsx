import { cn } from "@/lib/utils"
import React from "react"

type Variant =
  | "default"
  | "secondary"
  | "danger"
  | "success"
  | "outline"
  | "ghost"
  | "amber"
  | "warning"

type Size = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  default:
    "bg-[#1E3A5F] text-white hover:bg-[#162d4a] focus-visible:ring-[#1E3A5F]",
  secondary:
    "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 focus-visible:ring-gray-400",
  danger:
    "bg-[#EF4444] text-white hover:bg-red-600 focus-visible:ring-red-400",
  success:
    "bg-[#10B981] text-white hover:bg-emerald-600 focus-visible:ring-emerald-400",
  outline:
    "bg-transparent text-[#1E3A5F] border border-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white focus-visible:ring-[#1E3A5F]",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400",
  amber:
    "bg-[#F59E0B] text-white hover:bg-amber-500 focus-visible:ring-amber-400",
  warning:
    "bg-[#F97316] text-white hover:bg-orange-600 focus-visible:ring-orange-400",
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
}

const baseClasses =
  "inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"

export function buttonVariants({
  variant = "default",
  size = "md",
  className,
}: {
  variant?: Variant
  size?: Size
  className?: string
} = {}): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
