import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { decideRsvp, subscribePostRsvps } from '../../lib/firestore/rsvps'
import type { Rsvp } from '../../types/models'
import { Badge, type BadgeTone } from '../ui/Badge'
import { Button } from '../ui/Button'

const statusTone: Record<Rsvp['status'], BadgeTone> = {
  pending: 'warn',
  approved: 'ok',
  declined: 'neutral',
}

// The poster's panel: everyone who asked to join, with approve/decline.
export function ManageRsvps({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false)
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Subscribed even while collapsed so the pending count on the toggle is live.
  useEffect(() => subscribePostRsvps(postId, setRsvps), [postId])

  const pendingCount = rsvps.filter((r) => r.status === 'pending').length

  async function decide(rsvpUid: string, status: 'approved' | 'declined') {
    setBusyUid(rsvpUid)
    setError(null)
    try {
      await decideRsvp({ postId, rsvpUid, status })
    } catch (err) {
      console.error(err)
      setError('Could not save that decision. Try again.')
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        Manage RSVPs
        {pendingCount > 0 && <Badge tone="warn">{pendingCount} new</Badge>}
        <ChevronDown className={cn('size-4 transition', open && 'rotate-180')} aria-hidden />
      </Button>

      {open && (
        <ul className="mt-3 space-y-2">
          {rsvps.map((rsvp) => (
            <li
              key={rsvp.uid}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-4 py-2.5"
            >
              <span className="font-medium text-fg">{rsvp.displayName}</span>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[rsvp.status]} className="capitalize">
                  {rsvp.status}
                </Badge>
                {rsvp.status !== 'approved' && (
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busyUid === rsvp.uid}
                    onClick={() => decide(rsvp.uid, 'approved')}
                  >
                    <Check className="size-4" aria-hidden />
                    Approve
                  </Button>
                )}
                {rsvp.status !== 'declined' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyUid === rsvp.uid}
                    onClick={() => decide(rsvp.uid, 'declined')}
                  >
                    <X className="size-4" aria-hidden />
                    Decline
                  </Button>
                )}
              </div>
            </li>
          ))}
          {rsvps.length === 0 && <p className="text-sm text-muted">No one has RSVP&apos;d yet.</p>}
          {error && (
            <p role="alert" className="text-sm font-medium text-bad">
              {error}
            </p>
          )}
        </ul>
      )}
    </div>
  )
}
