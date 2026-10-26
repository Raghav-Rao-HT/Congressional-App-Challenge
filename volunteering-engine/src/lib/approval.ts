import type { Goal, HourLogStatus, OrgMemberStatus, Pet, UserProfile } from '../types/models'
import { computeGoalProgress, type GoalProgressResult } from './goalProgress'
import { getPetSpecies } from './petVisuals'
import { deriveStage, pointsForHours } from './points'
import { applyStreakUpdate } from './streaks'

export class ApprovalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApprovalError'
  }
}

export interface ApprovalInputs {
  hours: number
  date: string
  petId: string
  orgId: string
  logStatus: HourLogStatus
  membershipStatus: OrgMemberStatus | null
  member: UserProfile | null
  pet: Pet | null
  goals: Goal[]
  now: number
}

export interface ApprovalPlan {
  pointsAwarded: number
  member: Pick<
    UserProfile,
    'totalPoints' | 'totalHoursApproved' | 'currentStreakWeeks' | 'longestStreakWeeks' | 'lastServiceDate'
  >
  pet: Pet
  goals: GoalProgressResult[]
}

const MEMBERSHIP_PROBLEMS: Record<OrgMemberStatus, string> = {
  approved: '',
  applied:
    "This volunteer's application to join is still waiting for your approval. Accept it under Members & applications first, then approve these hours.",
  rejected: 'This volunteer is not a member of your organization (their application was rejected).',
  removed: 'This volunteer is no longer a member of your organization.',
}

export function planApproval(input: ApprovalInputs): ApprovalPlan {
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new ApprovalError('These hours are not a valid amount.')
  }
  if (input.logStatus !== 'pending') {
    throw new ApprovalError('This submission has already been reviewed.')
  }
  if (input.membershipStatus === null) {
    throw new ApprovalError(
      "This volunteer hasn't joined your organization. They need to apply, and you need to accept them under Members & applications, before their hours can be approved.",
    )
  }
  if (input.membershipStatus !== 'approved') {
    throw new ApprovalError(MEMBERSHIP_PROBLEMS[input.membershipStatus])
  }
  if (!input.member) {
    throw new ApprovalError("This volunteer's account could not be found.")
  }

  const streak = applyStreakUpdate({
    lastServiceDate: input.member.lastServiceDate,
    currentStreakWeeks: input.member.currentStreakWeeks,
    longestStreakWeeks: input.member.longestStreakWeeks,
    newServiceDateISO: input.date,
  })

  const goals = input.goals
    .filter((g) => g.status === 'active' && (g.orgId === null || g.orgId === input.orgId))
    .map((g) => computeGoalProgress(g, input.hours))
  const goalBonus = goals.reduce((sum, g) => sum + g.awardedBonus, 0)

  const pointsAwarded = pointsForHours(input.hours) + streak.bonusPoints + goalBonus

  const species = getPetSpecies(input.petId)
  const xp = (input.pet?.xp ?? 0) + input.hours

  return {
    pointsAwarded,
    member: {
      totalPoints: input.member.totalPoints + pointsAwarded,
      totalHoursApproved: input.member.totalHoursApproved + input.hours,
      currentStreakWeeks: streak.currentStreakWeeks,
      longestStreakWeeks: streak.longestStreakWeeks,
      lastServiceDate: input.date,
    },
    pet: {
      species: species.id,
      name: input.pet?.name ?? species.name,
      xp,
      stage: deriveStage(xp),
      unlockedCosmetics: input.pet?.unlockedCosmetics ?? [],
      lastGrownAt: input.now,
    },
    goals,
  }
}
