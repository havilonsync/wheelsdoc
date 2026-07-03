"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { logoutAction } from "@/app/actions/auth"

interface TopbarProps {
  userName: string | null | undefined
  userEmail: string | null | undefined
  userAvatar?: string | null
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/loads": "Loads",
  "/driver": "My Loads",
  "/org/users": "Team",
  "/org/billing": "Billing",
  "/org/templates": "Templates",
  "/admin": "Admin",
}

export function Topbar({ userName, userEmail, userAvatar }: TopbarProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    "WheelsDoc"

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-base font-semibold text-gray-900 pl-10 lg:pl-0">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-[#1E3A5F]/20 transition"
            aria-label="User menu"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName ?? "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userName ?? "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/org/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/org/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
