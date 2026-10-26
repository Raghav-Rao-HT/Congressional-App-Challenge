import { CalendarDays, ShieldCheck, UserCog } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ActionCard } from '../../components/ui/ActionCard'
import { Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { subscribeOrganizationsByStatus } from '../../lib/firestore/organizations'

export function AdminDashboardPage() {
  const { isSiteOwner } = useAuth()
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => subscribeOrganizationsByStatus('pending', (orgs) => setPendingCount(orgs.length)), [])

  return (
    <Page>
      <PageHeader
        title="Admin"
        description={
          pendingCount === null
            ? 'Checking for organizations to verify…'
            : pendingCount === 0
              ? 'No organizations are waiting for verification.'
              : `${pendingCount} organization${pendingCount === 1 ? ' is' : 's are'} waiting for verification.`
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard to="/admin/orgs" icon={ShieldCheck} title="Verify organizations">
          Review new organizations and approve or reject them.
        </ActionCard>
        <ActionCard to="/admin/events" icon={CalendarDays} title="Manage events">
          Review every event and remove ones that shouldn’t be posted.
        </ActionCard>
        {isSiteOwner && (
          <ActionCard to="/owner/accounts" icon={UserCog} title="Manage accounts">
            See everyone who is registered, make accounts admins, or mark test accounts.
          </ActionCard>
        )}
      </div>
    </Page>
  )
}
