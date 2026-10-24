import { goalBonusForTarget } from './points'
import type { Goal } from '../types/models'

export interface GoalProgressResult {
  goalId: string
  progressHours: number
  status: Goal['status']
  bonusPointsAwarded: boolean
  bonusAmount: number
  awardedBonus: number
}

// Pure: what a goal's progress update would be for an approval of `hours`,
// without writing anything. Kept free of Firebase imports so the approval
// math can be planned (and tested) on its own.
export function computeGoalProgress(goal: Goal, hours: number): GoalProgressResult {
  const progressHours = goal.progressHours + hours
  const justCompleted = !goal.bonusPointsAwarded && progressHours >= goal.targetHours
  const bonusAmount = justCompleted ? goalBonusForTarget(goal.targetHours) : goal.bonusAmount
  return {
    goalId: goal.goalId,
    progressHours,
    status: justCompleted ? 'completed' : goal.status,
    bonusPointsAwarded: justCompleted || goal.bonusPointsAwarded,
    bonusAmount,
    awardedBonus: justCompleted ? bonusAmount : 0,
  }
}
