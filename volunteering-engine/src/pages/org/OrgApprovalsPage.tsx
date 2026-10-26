import { Check, ClipboardCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ImageThumb } from '../../components/hourlog/ImageViewer'
import { ReplyImage } from '../../components/hourlog/ReplyImage'
import { SignaturePad, type SignaturePadHandle } from '../../components/hourlog/SignaturePad'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useMyOrganization } from '../../hooks/useOrg'
import {
  approveHourLog,
  rejectHourLog,
  subscribeOrgPendingHourLogs,
  subscribeOrgReviewedHourLogs,
} from '../../lib/firestore/hourLogs'
import { DEFAULT_PET_ID } from '../../lib/petVisuals'
import type { HourLog } from '../../types/models'

function ApprovalRow({ log, reviewerUid, orgId }: { log: HourLog; reviewerUid: string; orgId: string }) {
  const sigRef = useRef<SignaturePadHandle>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleApprove() {
    const dataUrl = sigRef.current?.getDataUrl()
    if (!dataUrl) {
      setError('Sign before approving.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await approveHourLog({
        logId: log.logId,
        orgId,
        memberUid: log.memberUid,
        petId: log.petId ?? DEFAULT_PET_ID,
        hours: log.hours,
        date: log.date,
        reviewerUid,
        signatureDataUrl: dataUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve. Try again.')
      setBusy(false)
    }
  }

  async function handleReject() {
    setBusy(true)
    try {
      await rejectHourLog({ logId: log.logId, reviewerUid, reason: 'Rejected by organization' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject. Try again.')
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-lg font-bold text-fg tabular-nums">
        {log.hours}h <span className="text-base font-normal text-muted">· {log.date}</span>
      </p>
      <p className="mt-1 text-muted">{log.description}</p>
      {log.attachmentURLs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {log.attachmentURLs.map((url) => (
            <ImageThumb key={url.slice(-40)} src={url} label="Student's scan" />
          ))}
        </div>
      )}

      <ReplyImage log={log} />

      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-fg">Sign to approve</p>
        <div className="max-w-sm">
          <SignaturePad ref={sigRef} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <Button variant="success" loading={busy} onClick={handleApprove}>
          <Check className="size-4" aria-hidden />
          Approve
        </Button>
        <Button variant="secondary" disabled={busy} onClick={handleReject}>
          <X className="size-4" aria-hidden />
          Reject
        </Button>
      </div>
    </Card>
  )
}

function ReviewedRow({ log }: { log: HourLog }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold text-fg tabular-nums">
            {log.hours}h <span className="text-base font-normal text-muted">· {log.date}</span>
          </p>
          <p className="mt-1 text-muted">{log.description}</p>
        </div>
        <Badge tone={log.status === 'approved' ? 'ok' : 'bad'} className="capitalize">
          {log.status}
        </Badge>
      </div>
      {log.attachmentURLs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {log.attachmentURLs.map((url) => (
            <ImageThumb key={url.slice(-40)} src={url} label="Student's scan" />
          ))}
        </div>
      )}
      <ReplyImage log={log} />
    </Card>
  )
}

export function OrgApprovalsPage() {
  const { user } = useAuth()
  const { org, loading: orgLoading } = useMyOrganization()
  const [logs, setLogs] = useState<HourLog[]>([])
  const [reviewed, setReviewed] = useState<HourLog[]>([])

  useEffect(() => {
    if (!org) return
    return subscribeOrgPendingHourLogs(org.orgId, setLogs)
  }, [org])

  useEffect(() => {
    if (!org) return
    return subscribeOrgReviewedHourLogs(org.orgId, setReviewed)
  }, [org])

  if (orgLoading) return null
  if (!org || !user)
    return (
      <Page>
        <PageHeader title="Hour approvals" />
        <p className="text-sm text-muted">No organization yet.</p>
      </Page>
    )

  return (
    <Page width="narrow">
      <PageHeader
        title="Hour approvals"
        description="Review each submission and sign to approve it."
        back={{ to: '/org', label: 'Dashboard' }}
      />
      {logs.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nothing to review" description="New hour submissions will appear here." />
      ) : (
        <ul className="space-y-4">
          {logs.map((log) => (
            <li key={log.logId}>
              <ApprovalRow log={log} reviewerUid={user.uid} orgId={org.orgId} />
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 && (
        <Section title="Recently reviewed">
          <ul className="space-y-4">
            {reviewed.map((log) => (
              <li key={log.logId}>
                <ReviewedRow log={log} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Page>
  )
}
