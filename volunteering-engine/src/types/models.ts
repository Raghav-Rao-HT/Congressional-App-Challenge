export type AccountType = 'member' | 'organization_officer' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  homeState: string
  accountType: AccountType
  // Kind of nonprofit, chosen by organization officers at sign-up. Optional
  // because profiles created before this field existed don't have it.
  nonprofitType?: string | null
  // The organization's IRS tax-exempt classification, e.g. "501(c)(3) ...",
  // chosen at sign-up. Optional for the same reason as nonprofitType.
  irsClassification?: string | null
  // Set by an admin to take this member off the leaderboard (reversible).
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
  // Kind of nonprofit, carried over from the officer's sign-up. Optional
  // because organizations registered before this field existed don't have it.
  nonprofitType?: string | null
  irsClassification?: string | null
  status: OrgStatus
  submittedByUid: string
  createdAt: number
  reviewedAt: number | null
  reviewedByAdminUid: string | null
  rejectionReason: string | null
  memberCount: number
  // Geocoded from `address` at submission time, for the map tab. Optional
  // because orgs submitted before the map existed (or whose address
  // couldn't be geocoded) don't have it and simply don't get a marker.
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
  // The pet the member chose to give these hours to. Optional because logs
  // submitted before pet choice existed don't have it (treated as the
  // default pet).
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
  // The officer's sign-off: a "data:image/png;base64,..." URL stored on the
  // log itself (there is no Cloud Storage bucket). Usable directly as an
  // <img src>.
  signatureURL: string | null
  pointsAwarded: number | null
}

// Index into the sprite order: 0 = starting sprite, then one step up at each
// hour threshold (see PET_STAGE_THRESHOLDS in lib/points.ts).
export type PetStage = 0 | 1 | 2 | 3

// Stored at users/{uid}/pets/{species}: one pet per species, and a member
// chooses which of their pets receives the hours on each submission.
export interface Pet {
  species: string
  name: string
  xp: number
  stage: PetStage
  unlockedCosmetics: string[]
  lastGrownAt: number | null
}

// How a member has customised one pet: a colour scheme and an accessory, each
// the id of an option in lib/petColors.ts / lib/petAccessories.ts (null = none).
export interface PetLook {
  color?: string | null
  accessory?: string | null
}

// Stored at users/{uid}/island/state. Positions are in island scene units
// (see lib/islandLayout.ts); a pet with no entry stands in its default spot.
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

// 'members' posts are visible only to the posting organization's approved
// members; 'public' posts are visible to every signed-in user.
export type BulletinAudience = 'public' | 'members'

export interface BulletinPost {
  postId: string
  authorUid: string
  authorType: 'member' | 'org'
  orgId: string | null
  audience: BulletinAudience
  // Denormalized count of approved RSVPs, kept in step by the poster's
  // approve/decline writes so the board never has to count per card.
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

// Stored at bulletinPosts/{postId}/rsvps/{uid}: one RSVP per person per post.
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
