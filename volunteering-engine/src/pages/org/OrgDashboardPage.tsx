import { Building2, CalendarPlus, ClipboardCheck, Users } from 'lucide-react'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/Button'
import { ActionCard } from '../../components/ui/ActionCard'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { Skeleton } from '../../components/ui/Skeleton'
import { useMyOrganization } from '../../hooks/useOrg'
import type { OrgStatus } from '../../types/models'

const statusCopy: Record<OrgStatus, string> = {
  pending: 'Your organization is pending admin approval. Members will be able to log hours against it once approved.',
  approved: 'Your organization is approved and visible to members.',
  rejected: 'Your organization application was rejected.',
  suspended: 'Your organization has been suspended.',
}

const statusTone: Record<OrgStatus, BadgeTone> = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'bad',
  suspended: 'bad',
}

export function OrgDashboardPage() {
  const { org, loading } = useMyOrganization()

  if (loading) {
    return (
      <Page>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
        <Skeleton className="mt-8 h-28" />
      </Page>
    )
  }

  if (!org) {
    return (
      <Page>
        <PageHeader title="Organization dashboard" />
        <EmptyState
          icon={Building2}
          title="Register your organization"
          description="Tell us about your organization. Once an admin approves it, you can sign off volunteer hours and post opportunities."
          action={<ButtonLink to="/org/onboarding">Register organization</ButtonLink>}
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title={org.name}
        description={statusCopy[org.status]}
        actions={
          <Badge tone={statusTone[org.status]} className="capitalize">
            {org.status}
          </Badge>
        }
      />

      {org.status === 'approved' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <ActionCard to="/bulletin/new?for=members" icon={CalendarPlus} title="Post an opportunity">
            Share an event with your members, or with everyone.
          </ActionCard>
          <ActionCard to="/org/members" icon={Users} title="Members & applications">
            Review who wants to join your organization.
          </ActionCard>
          <ActionCard to="/org/approvals" icon={ClipboardCheck} title="Hour approvals">
            Sign off on volunteer hours.
          </ActionCard>
        </div>
      )}
    </Page>
  )
}
