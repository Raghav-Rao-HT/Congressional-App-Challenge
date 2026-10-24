import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/Page'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthProvider'
import { approveOrganization, rejectOrganization, subscribeOrganization } from '../../lib/firestore/organizations'
import type { Organization, OrgStatus } from '../../types/models'

const statusTone: Record<OrgStatus, BadgeTone> = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'bad',
  suspended: 'bad',
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-fg">{children}</dd>
    </div>
  )
}

export function AdminOrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [org, setOrg] = useState<Organization | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    return subscribeOrganization(orgId, setOrg)
  }, [orgId])

  if (!org || !orgId)
    return (
      <Page width="narrow">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-64" />
      </Page>
    )

  async function handleApprove() {
    if (!user || !orgId || !org) return
    setBusy(true)
    setError(null)
    try {
      await approveOrganization({ orgId, submittedByUid: org.submittedByUid, adminUid: user.uid })
      navigate('/admin/orgs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve. Try again.')
      setBusy(false)
    }
  }

  async function handleReject() {
    if (!user || !orgId) return
    setBusy(true)
    setError(null)
    try {
      await rejectOrganization({ orgId, adminUid: user.uid, reason: reason || 'Not specified' })
      navigate('/admin/orgs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject. Try again.')
      setBusy(false)
    }
  }

  return (
    <Page width="narrow">
      <PageHeader
        title={org.name}
        back={{ to: '/admin/orgs', label: 'All organizations' }}
        actions={
          <Badge tone={statusTone[org.status]} className="capitalize">
            {org.status}
          </Badge>
        }
        description={org.status === 'rejected' && org.rejectionReason ? `Rejected: ${org.rejectionReason}` : undefined}
      />

      <Card className="p-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Detail label="Legal name">{org.legalName}</Detail>
          <Detail label="Nonprofit type">{org.nonprofitType ?? '—'}</Detail>
          <Detail label="Cause area">{org.causeArea}</Detail>
          <Detail label="Address">
            {org.address.street}, {org.address.city}, {org.address.state} {org.address.zip}
            <span className="mt-1 block text-xs text-muted">
              {org.location ? 'Located on the map' : 'Not located on the map'}
            </span>
          </Detail>
          <Detail label="Contact">
            {org.contactEmail}
            <span className="block text-muted">{org.contactPhone}</span>
          </Detail>
          {org.website && <Detail label="Website">{org.website}</Detail>}
        </dl>
      </Card>

      {(org.status === 'pending' || org.status === 'rejected') && (
        <Card className="mt-6 space-y-5 p-6">
          <Field label="Rejection reason" hint="Only needed if you're rejecting.">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>

          {error && (
            <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="success" size="lg" loading={busy} onClick={handleApprove}>
              <Check className="size-5" aria-hidden />
              Approve
            </Button>
            <Button variant="danger" size="lg" disabled={busy} onClick={handleReject}>
              <X className="size-5" aria-hidden />
              Reject
            </Button>
          </div>
        </Card>
      )}
    </Page>
  )
}
