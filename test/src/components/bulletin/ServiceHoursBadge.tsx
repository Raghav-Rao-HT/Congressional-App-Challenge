import { Clock } from 'lucide-react'
import { Badge } from '../ui/Badge'

export function ServiceHoursBadge({ offers }: { offers: boolean | undefined }) {
  if (offers === undefined) return null
  return offers ? (
    <Badge tone="ok">
      <Clock className="size-3" aria-hidden />
      Service hours
    </Badge>
  ) : (
    <Badge>No service hours</Badge>
  )
}
