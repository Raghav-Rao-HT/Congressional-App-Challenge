import { CircleCheck, Hourglass } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { cancelRsvp, rsvpToPost, subscribeMyRsvp } from '../../lib/firestore/rsvps'
import type { Rsvp } from '../../types/models'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

export function RsvpControl({
  postId,
  uid,
  displayName,
}: {
  postId: string
  uid: string
  displayName: string
}) {
  const { profile } = useAuth()
  const [rsvp, setRsvp] = useState<Rsvp | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeMyRsvp(postId, uid, setRsvp), [postId, uid])

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError(failure)
    } finally {
      setBusy(false)
    }
  }

  if (rsvp === undefined) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {rsvp === null && (
        <Button
          loading={busy}
          onClick={() => run(
              () => rsvpToPost({ postId, uid, displayName, autoApprove: !!profile?.isTestAccount }),
              'Could not send your RSVP. Try again.',
            )}
        >
          {busy ? 'Sending…' : 'RSVP'}
        </Button>
      )}

      {rsvp?.status === 'pending' && (
        <>
          <Badge tone="warn">
            <Hourglass className="size-3.5" aria-hidden />
            RSVP sent · waiting for approval
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => run(() => cancelRsvp(postId, uid), 'Could not cancel your RSVP. Try again.')}
          >
            Cancel RSVP
          </Button>
        </>
      )}

      {rsvp?.status === 'approved' && (
        <Badge tone="ok">
          <CircleCheck className="size-3.5" aria-hidden />
          You&apos;re going
        </Badge>
      )}

      {rsvp?.status === 'declined' && (
        <Badge tone="neutral">The organizer couldn&apos;t include you this time</Badge>
      )}

      {error && (
        <span role="alert" className="text-xs font-medium text-bad">
          {error}
        </span>
      )}
    </div>
  )
}
