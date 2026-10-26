import { Building2, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'
import { subscribeOrganizationsByStatus } from '../../lib/firestore/organizations'
import type { Organization, OrgStatus } from '../../types/models'

type Tab = Extract<OrgStatus, 'pending' | 'approved' | 'rejected'>

const TAB_INFO: Record<Tab, { label: string; empty: string; action: string; tone: BadgeTone }> = {
  pending: { label: 'Pending', empty: 'No organizations are waiting for verification.', action: 'Review', tone: 'warn' },
  approved: { label: 'Approved', empty: 'No organizations have been approved yet.', action: 'View', tone: 'ok' },
  rejected: { label: 'Rejected', empty: 'No organizations have been rejected.', action: 'View', tone: 'bad' },
}

const TABS = (Object.keys(TAB_INFO) as Tab[]).map((value) => ({ value, label: TAB_INFO[value].label }))

export function AdminOrgQueuePage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [result, setResult] = useState<{ tab: Tab; orgs: Organization[] }>({ tab: 'pending', orgs: [] })
  const info = TAB_INFO[tab]
  const orgs = result.tab === tab ? result.orgs : []

  useEffect(() => subscribeOrganizationsByStatus(tab, (next) => setResult({ tab, orgs: next })), [tab])

  return (
    <Page width="narrow">
      <PageHeader
        title="Verify organizations"
        description="Review each submission, then approve it to make it available to members or reject it with a reason."
        back={{ to: '/admin', label: 'Admin' }}
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {orgs.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Building2} title={info.empty} />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orgs.map((org) => (
            <li key={org.orgId}>
              <Link to={`/admin/orgs/${org.orgId}`} className="group block rounded-card focus-visible:outline-offset-4">
                <Card interactive className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-fg">{org.name}</p>
                    <p className="truncate text-sm text-muted">
                      {[`${org.address.city}, ${org.address.state}`, org.nonprofitType, org.causeArea]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={info.tone}>{info.action}</Badge>
                    <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5" aria-hidden />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
