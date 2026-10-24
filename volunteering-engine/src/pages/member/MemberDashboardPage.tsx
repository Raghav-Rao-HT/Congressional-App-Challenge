import {
  Building2,
  CalendarHeart,
  Clock,
  Flame,
  Map as MapIcon,
  PawPrint,
  Sparkles,
  Target,
  TreePalm,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ActionCard } from '../../components/ui/ActionCard'
import { Card } from '../../components/ui/Card'
import { EmptyState, Page, PageHeader, Section } from '../../components/ui/Page'
import { StatTile } from '../../components/ui/StatTile'
import { useAuth } from '../../context/AuthProvider'
import { useOrgApplications } from '../../hooks/useOrgApplications'
import { subscribeApprovedOrganizations } from '../../lib/firestore/organizations'
import type { Organization, OrgMemberStatus } from '../../types/models'

const applicationTone: Record<OrgMemberStatus, BadgeTone> = {
  applied: 'warn',
  approved: 'ok',
  rejected: 'bad',
  removed: 'neutral',
}

export function MemberDashboardPage() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const { applications, applyingTo, apply: handleApply } = useOrgApplications()

  useEffect(() => subscribeApprovedOrganizations(setOrgs), [])

  const firstName = profile?.displayName.trim().split(' ')[0] ?? ''
  const streak = profile?.currentStreakWeeks ?? 0

  return (
    <Page>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Here's your volunteering at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={Sparkles} label="Points" value={profile?.totalPoints ?? 0} tone="brand" />
        <StatTile icon={Clock} label="Hours approved" value={profile?.totalHoursApproved ?? 0} tone="ok" />
        <StatTile icon={Flame} label="Week streak" value={streak} tone="warn" />
      </div>

      <Section title="Jump in">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard to="/member/log-hours" icon={Clock} title="Log hours">
            Submit hours for sign-off and feed a pet.
          </ActionCard>
          <ActionCard to="/member/pets" icon={PawPrint} title="Pets">
            See how your pets are growing.
          </ActionCard>
          <ActionCard to="/member/island" icon={TreePalm} title="Island">
            Visit your pets together.
          </ActionCard>
          <ActionCard to="/member/goals" icon={Target} title="Goals">
            Set a target and earn a bonus.
          </ActionCard>
          <ActionCard to="/member/friends" icon={Users} title="Friends">
            Compare points with friends.
          </ActionCard>
          <ActionCard to="/bulletin" icon={CalendarHeart} title="Opportunities">
            RSVP to events from organizations.
          </ActionCard>
          <ActionCard to="/map" icon={MapIcon} title="New Jersey map">
            Find organizations near you.
          </ActionCard>
        </div>
      </Section>

      <Section title="Organizations">
        {orgs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No approved organizations yet"
            description="Once an organization is approved by an admin, it will show up here."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {orgs.map((org) => {
              const status = applications[org.orgId]
              return (
                <li key={org.orgId}>
                  <Card className="flex h-full items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted">
                        <Building2 className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{org.name}</p>
                        <p className="truncate text-sm text-muted">{org.causeArea}</p>
                      </div>
                    </div>
                    {status ? (
                      <Badge tone={applicationTone[status]} className="capitalize">
                        {status}
                      </Badge>
                    ) : (
                      <Button size="sm" loading={applyingTo === org.orgId} onClick={() => handleApply(org.orgId)}>
                        Apply
                      </Button>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </Page>
  )
}
