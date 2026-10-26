import { CalendarDays, Lock, MapPin, Trash2, Users } from 'lucide-react'
import type { BulletinPost } from '../../types/models'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DateBadge } from './DateBadge'
import { ServiceHoursBadge } from './ServiceHoursBadge'

export function AdminEventCard({
  post,
  confirming,
  busy,
  onAskDelete,
  onCancel,
  onConfirm,
}: {
  post: BulletinPost
  confirming: boolean
  busy: boolean
  onAskDelete: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex gap-4">
        <DateBadge at={post.startAt} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-fg">{post.title}</h2>
            {post.audience === 'members' && (
              <Badge tone="violet">
                <Lock className="size-3" aria-hidden />
                Members only
              </Badge>
            )}
            <Badge tone={post.authorType === 'org' ? 'brand' : 'neutral'}>
              {post.authorType === 'org' ? 'Organization' : 'Volunteer'}
            </Badge>
            <ServiceHoursBadge offers={post.offersServiceHours} />
            {post.status !== 'open' && (
              <Badge tone="warn" className="capitalize">
                {post.status}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 line-clamp-2 text-pretty text-muted">{post.description}</p>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              <dt className="sr-only">When</dt>
              <dd>
                {new Date(post.startAt).toLocaleDateString()} – {new Date(post.endAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              <dt className="sr-only">Where</dt>
              <dd>
                {post.location.city}, {post.location.state}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              <dt className="sr-only">Going</dt>
              <dd>{post.approvedCount ?? 0} going</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {confirming ? (
          <div role="group" aria-label={`Confirm deleting ${post.title}`} className="space-y-3">
            <p className="text-sm font-medium text-bad">
              Delete “{post.title}”? This permanently removes the event and all of its RSVPs. It can’t be undone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={onConfirm} loading={busy}>
                <Trash2 className="size-4" aria-hidden />
                {busy ? 'Deleting…' : 'Delete event'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" size="sm" onClick={onAskDelete}>
            <Trash2 className="size-4" aria-hidden />
            Delete event
          </Button>
        )}
      </div>
    </Card>
  )
}
