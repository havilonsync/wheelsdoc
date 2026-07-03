import Link from "next/link"
import { LoadStatus } from "@/generated/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { LoadStatusBadge } from "./load-status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"

interface LoadCardProps {
  load: {
    id: string
    loadNumber: string
    status: LoadStatus
    agreedRate: string | number
    updatedAt: Date | string
    assignedDriver?: { name: string | null } | null
    stops?: Array<{
      stopType: string
      stopNumber: number
      city: string
      state: string
    }>
  }
}

export function LoadCard({ load }: LoadCardProps) {
  const pickupStop = load.stops?.find((s) => s.stopType === "PICKUP")
  const deliveryStop = load.stops?.find((s) => s.stopType === "DELIVERY")

  const route =
    pickupStop && deliveryStop
      ? `${pickupStop.city}, ${pickupStop.state} → ${deliveryStop.city}, ${deliveryStop.state}`
      : "Route not set"

  return (
    <Link href={`/loads/${load.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-[#1E3A5F]">
                {load.loadNumber}
              </span>
              <LoadStatusBadge status={load.status} />
            </div>
            <p className="text-sm text-gray-600 truncate">{route}</p>
            {load.assignedDriver?.name && (
              <p className="text-xs text-gray-400 mt-0.5">
                Driver: {load.assignedDriver.name}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(load.agreedRate)}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(load.updatedAt, "MMM d")}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
