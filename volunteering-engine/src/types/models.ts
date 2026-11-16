export type AccountType = 'member' | 'organization_officer' | 'admin'

/** Coarse age bracket captured at signup. We never store a birth date. VetWork is 13+. */
export type AgeBand = '13-17' | '18+'

export interface UserProfile {
  uid: string
  /**
   * LEGACY. Email now lives in the owner/admin-only `users/{uid}/private/contact` document (see
   * UserContact). Profiles created before that split may still carry it until scripts/migrateEmails.mjs
   * runs; new profiles never do, and nothing outside admin screens should read it.
   */
  email?: string
  displayName: string
  homeState: string
  accountType: AccountType
  ageBand?: AgeBand
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

/** Private contact details: readable only by the user and admins. Stored at users/{uid}/private/contact. */
export interface UserContact {
  email: string
  /** Unguessable 8-character code others use to find and friend this user (and officers use to award hours). */
  friendCode: string
}

/** friendCodes/{code}: lets someone who ALREADY knows a code learn whose it is. Cannot be listed. */
export interface FriendCodeEntry {
  uid: string
  displayName: string
}

/** joinCodes/{code}: an officer-issued code that admits the holder to the org immediately. */
export interface JoinCode {
  orgId: string
  createdByUid: string
  createdAt: number
  active: boolean
}

/** A profile plus the email an admin may see (merged from the private contact document). */
export type AdminUser = UserProfile & { email: string }

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
  /** IRS Employer Identification Number, formatted NN-NNNNNNN. */
  ein?: string | null
  /** Set only by an admin after confirming the org is a recognized, active 501(c)(3). */
  irsVerifiedAt?: number | null
  irsVerifiedByUid?: string | null
  irsVerifiedSource?: string | null
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
  /** Set when the volunteer was admitted by presenting an officer-issued join code. */
  joinCode?: string
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
  awardedByOrg?: boolean
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
