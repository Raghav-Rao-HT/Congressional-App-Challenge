import { Check, UserCheck, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useMyOrganization } from '../../hooks/useOrg'
import { setMemberStatus, subscribeOrgMembers } from '../../lib/firestore/organizations'
import type { OrgMember } from '../../types/models'

export function OrgMembersPage() {
  const { user } = useAuth()
  const { org, loading: orgLoading } = useMyOrganization()
  const [members, setMembers] = useState<OrgMember[]>([])

  useEffect(() => {
    if (!org) return
    return subscribeOrgMembers(org.orgId, setMembers)
  }, [org])

  if (orgLoading) return null
  if (!org)
    return (
      <Page>
        <PageHeader title="Members" />
        <p className="text-sm text-muted">No organization yet.</p>
      </Page>
    )

  const applications = members.filter((m) => m.status === 'applied')
  const roster = members.filter((m) => m.status === 'approved')

  async function handleDecision(memberUid: string, status: 'approved' | 'rejected') {
    if (!user) return
    await setMemberStatus({ orgId: org!.orgId, memberUid, status, reviewerUid: user.uid })
  }

  return (
    <Page width="narrow">
      <PageHeader title="Members" description="Approve people who want to join, and see your roster." back={{ to: '/org', label: 'Dashboard' }} />

      <Section title={`Applications${applications.length ? ` (${applications.length})` : ''}`}>
        {applications.length === 0 ? (
          <EmptyState icon={UserPlus} title="No pending applications" description="New requests to join will show up here." />
        ) : (
          <ul className="space-y-2">
            {applications.map((m) => (
              <li key={m.uid}>
                <Card className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="truncate font-semibold text-fg">{m.displayName}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => handleDecision(m.uid, 'approved')}>
                      <Check className="size-4" aria-hidden />
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDecision(m.uid, 'rejected')}>
                      <X className="size-4" aria-hidden />
                      Reject
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Roster">
        {roster.length === 0 ? (
          <EmptyState icon={UserCheck} title="No approved members yet" />
        ) : (
          <ul className="space-y-2">
            {roster.map((m) => (
              <li key={m.uid}>
                <Card className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="flex items-center gap-2 truncate font-semibold text-fg">
                    {m.displayName}
                    {m.roleInOrg === 'officer' && <Badge tone="brand">Officer</Badge>}
                  </span>
                  <span className="text-sm text-muted tabular-nums">{m.totalHoursApprovedForOrg}h approved</span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}
