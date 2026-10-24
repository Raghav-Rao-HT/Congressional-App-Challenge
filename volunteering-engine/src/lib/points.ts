import type { PetStage } from '../types/models'

// Tunable gamification constants. Kept as code (not a Firestore config doc)
// for MVP simplicity — changing them needs a redeploy, which is an
// acceptable trade for not adding a config round-trip to every approval.
export const POINTS_PER_HOUR = 10
export const STREAK_MILESTONES: { weeks: number; bonus: number }[] = [
  { weeks: 4, bonus: 25 },
  { weeks: 12, bonus: 100 },
]
export const GOAL_BONUS_BY_TIER = { small: 25, medium: 75, large: 150 } as const
// Hours a pet must hold to reach each sprite, in sprite order: the pet
// starts at 0 and switches sprite at 20, 50 and 100 hours.
export const PET_STAGE_THRESHOLDS: readonly number[] = [0, 20, 50, 100]

export function pointsForHours(hours: number): number {
  return Math.round(hours * POINTS_PER_HOUR)
}

export function deriveStage(xp: number): PetStage {
  let stage = 0
  PET_STAGE_THRESHOLDS.forEach((minXp, index) => {
    if (xp >= minXp) stage = index
  })
  return stage as PetStage
}

// Hours at which the pet next changes sprite, or null once fully grown.
export function nextStageThreshold(xp: number): number | null {
  return PET_STAGE_THRESHOLDS.find((minXp) => minXp > xp) ?? null
}

export function goalBonusForTarget(targetHours: number): number {
  if (targetHours < 10) return GOAL_BONUS_BY_TIER.small
  if (targetHours < 30) return GOAL_BONUS_BY_TIER.medium
  return GOAL_BONUS_BY_TIER.large
}

export function streakBonusForWeeks(streakWeeks: number): number {
  const hit = STREAK_MILESTONES.find((m) => m.weeks === streakWeeks)
  return hit ? hit.bonus : 0
}
