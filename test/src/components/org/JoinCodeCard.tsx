import { KeyRound, RefreshCw, Power } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { issueJoinCode, subscribeOrgJoinCodes, turnOffJoinCode, type JoinCodeRow } from '../../lib/firestore/joinCodes'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CodeBadge } from '../ui/CodeBadge'

/**
 * Officers hand this code to volunteers they already trust (a teacher's class, a vetted club). Anyone holding
 * it joins immediately, so share it where you would share a sign-up sheet, and turn it off when you're done.
 */
export function JoinCodeCard({ orgId }: { orgId: string }) {
  const { user } = useAuth()
  const [codes, setCodes] = useState<JoinCodeRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeOrgJoinCodes(orgId, setCodes), [orgId])

  const active = codes.find((c) => c.active)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      console.error(err)
      setError("Couldn't update the join code. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-fg">Join code</h2>
          <p className="mt-1 text-sm text-muted">
            Volunteers who enter this code join your roster right away, with no review step. Only share it with people you trust, and
            turn it off when you&apos;re done.
          </p>
        </div>
      </div>

      {active ? (
        <>
          <CodeBadge code={active.code} label="Join code" />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => run(() => issueJoinCode({ orgId, officerUid: user.uid, current: codes }))}
            >
              <RefreshCw className="size-4" aria-hidden />
              Replace with a new code
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => turnOffJoinCode(active.code))}>
              <Power className="size-4" aria-hidden />
              Turn off
            </Button>
          </div>
        </>
      ) : (
        <Button loading={busy} onClick={() => run(() => issueJoinCode({ orgId, officerUid: user.uid, current: codes }))}>
          <KeyRound className="size-4" aria-hidden />
          Create a join code
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </Card>
  )
}
