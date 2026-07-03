"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserRole } from "@/generated/prisma"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Truck,
  FileText,
  Users,
  CreditCard,
  Shield,
  ClipboardList,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  role: UserRole
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Loads",
    href: "/loads",
    icon: Truck,
  },
  {
    label: "My Loads",
    href: "/driver",
    icon: ClipboardList,
    roles: ["DRIVER"],
  },
  {
    label: "Templates",
    href: "/org/templates",
    icon: FileText,
    roles: ["CARRIER_ADMIN", "DISPATCHER", "BROKER"],
  },
  {
    label: "Team",
    href: "/org/users",
    icon: Users,
    roles: ["CARRIER_ADMIN", "BROKER", "PLATFORM_ADMIN"],
  },
  {
    label: "Billing",
    href: "/org/billing",
    icon: CreditCard,
    roles: ["CARRIER_ADMIN", "PLATFORM_ADMIN"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Shield,
    roles: ["PLATFORM_ADMIN"],
  },
]

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  const navContent = (
    <nav className="flex flex-col gap-1 p-4">
      {visibleItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
              active
                ? "bg-[#1E3A5F] text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-[#F59E0B]"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#1E3A5F]">HaulPass</span>
        </div>
        {navContent}
      </aside>
    </>
  )
}
