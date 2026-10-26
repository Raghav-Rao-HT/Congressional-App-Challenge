export type AccountType = 'member' | 'organization_officer' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  homeState: string
  accountType: AccountType
  roleBeforeAdmin?: 'member' | 'organization_officer'
  isTestAccount?: boolean
  nonprofitType?: string | null
  irsClassification?: string | null
  leaderboardHidden?: boolean
  orgId: string | null
  totalPoints: number
  totalHoursApproved: number
  currentStreakWeeks: number
  longestStreakWeeks: number
  lastServiceDate: string | null
  createdAt: number
  lastActiveAt: number
}

export type OrgStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface OrgAddress {
  street: string
  city: string
  state: string
  zip: string
}

export interface Organization {
  orgId: string
  name: string
  legalName: string
  address: OrgAddress
  contactEmail: string
  contactPhone: string
  website: string
  causeArea: string
  nonprofitType?: string | null
  irsClassification?: string | null
  status: OrgStatus
  submittedByUid: string
  createdAt: number
  reviewedAt: number | null
  reviewedByAdminUid: string | null
  rejectionReason: string | null
  memberCount: number
  location?: OrgLocation | null
}

export interface OrgLocation {
  lat: number
  lng: number
}

export type OrgMemberStatus = 'applied' | 'approved' | 'rejected' | 'removed'
export type OrgMemberRole = 'member' | 'officer'

export interface OrgMember {
  uid: string
  displayName: string
  status: OrgMemberStatus
  roleInOrg: OrgMemberRole
  appliedAt: number
  approvedAt: number | null
  approvedByUid: string | null
  totalHoursApprovedForOrg: number
}

export type HourLogStatus = 'pending' | 'approved' | 'rejected'

export interface HourLog {
  logId: string
  memberUid: string
  orgId: string
  petId?: string
  date: string
  hours: number
  description: string
  attachmentURLs: string[]
  status: HourLogStatus
  submittedAt: number
  reviewedAt: number | null
  reviewedByUid: string | null
  rejectionReason: string | null
  signatureURL: string | null
  pointsAwarded: number | null
  autoApproved?: boolean
  replyImageURL?: string | null
  replyAt?: number | null
}

export type PetStage = 0 | 1 | 2 | 3

export interface Pet {
  species: string
  name: string
  xp: number
  stage: PetStage
  unlockedCosmetics: string[]
  lastGrownAt: number | null
}

export interface PetLook {
  color?: string | null
  accessory?: string | null
  held?: string | null
  name?: string | null
}

export interface IslandState {
  petPositions: Record<string, { x: number; y: number }>
  petLooks?: Record<string, PetLook>
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export interface Friendship {
  participants: [string, string]
  requesterUid: string
  recipientUid: string
  status: FriendshipStatus
  createdAt: number
  respondedAt: number | null
}

export type GoalStatus = 'active' | 'completed' | 'missed'

export interface Goal {
  goalId: string
  orgId: string | null
  targetHours: number
  periodStart: string
  periodEnd: string
  progressHours: number
  status: GoalStatus
  bonusPointsAwarded: boolean
  bonusAmount: number
}

export type BulletinPostStatus = 'open' | 'closed' | 'cancelled'

export type BulletinAudience = 'public' | 'members'

export interface BulletinPost {
  postId: string
  authorUid: string
  authorType: 'member' | 'org'
  orgId: string | null
  audience: BulletinAudience
  offersServiceHours?: boolean
  approvedCount: number
  title: string
  description: string
  startAt: number
  endAt: number
  location: { address: string; city: string; state: string }
  tags: string[]
  status: BulletinPostStatus
  createdAt: number
}

export type RsvpStatus = 'pending' | 'approved' | 'declined'

export interface Rsvp {
  uid: string
  displayName: string
  status: RsvpStatus
  createdAt: number
  decidedAt: number | null
}

export interface GamificationConfig {
  pointsPerHour: number
  streakMilestones: { weeks: number; bonus: number }[]
  goalBonusByTier: { tier: 'small' | 'medium' | 'large'; bonus: number }[]
  petStageThresholds: { stage: PetStage; minXp: number }[]
}
