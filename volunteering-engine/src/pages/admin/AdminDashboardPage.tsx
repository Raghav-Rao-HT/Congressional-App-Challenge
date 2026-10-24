import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ActionCard } from '../../components/ui/ActionCard'
import { Page, PageHeader } from '../../components/ui/Page'
import { subscribeOrganizationsByStatus } from '../../lib/firestore/organizations'

export function AdminDashboardPage() {
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
      </div>
    </Page>
  )
}
