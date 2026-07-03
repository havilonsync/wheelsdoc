import { LoadStatus } from "@/generated/prisma"
import { Badge } from "@/components/ui/badge"
import { getLoadStatusColor, getLoadStatusLabel } from "@/lib/utils"

interface LoadStatusBadgeProps {
  status: LoadStatus
  className?: string
}

export function LoadStatusBadge({ status, className }: LoadStatusBadgeProps) {
  return (
    <Badge className={`${getLoadStatusColor(status)} ${className ?? ""}`}>
      {getLoadStatusLabel(status)}
    </Badge>
  )
}
