import type { BadgeTone } from '../components/ui/Badge'
import type { UserProfile } from '../types/models'
import { isSiteOwner } from './roles'

export function roleBadge(user: UserProfile): { label: string; tone: BadgeTone } {
  if (isSiteOwner(user.uid)) return { label: 'Owner', tone: 'violet' }
  switch (user.accountType) {
    case 'admin':
      return { label: 'Admin', tone: 'brand' }
    case 'organization_officer':
      return { label: 'Organization', tone: 'neutral' }
    default:
      return { label: 'Volunteer', tone: 'neutral' }
  }
}
