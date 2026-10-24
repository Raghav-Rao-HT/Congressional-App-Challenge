import { differenceInCalendarWeeks, parseISO, startOfWeek } from 'date-fns'
import { streakBonusForWeeks } from './points'

export interface StreakUpdate {
  currentStreakWeeks: number
  longestStreakWeeks: number
  bonusPoints: number
}

// A "service week" (Monday-start) counts once a member has >=1 approved
// hour log in it. Consecutive active weeks increment the streak; a skipped
// week resets it to 1. Multiple approvals in the same week are a no-op here
// (weekDiff === 0) so the streak isn't double-counted.
export function applyStreakUpdate(params: {
  lastServiceDate: string | null
  currentStreakWeeks: number
  longestStreakWeeks: number
  newServiceDateISO: string
}): StreakUpdate {
  const newWeekStart = startOfWeek(parseISO(params.newServiceDateISO), { weekStartsOn: 1 })

  if (!params.lastServiceDate) {
    return { currentStreakWeeks: 1, longestStreakWeeks: Math.max(params.longestStreakWeeks, 1), bonusPoints: 0 }
  }

  const lastWeekStart = startOfWeek(parseISO(params.lastServiceDate), { weekStartsOn: 1 })
  const weekDiff = differenceInCalendarWeeks(newWeekStart, lastWeekStart, { weekStartsOn: 1 })

  if (weekDiff === 0) {
    return {
      currentStreakWeeks: params.currentStreakWeeks,
      longestStreakWeeks: params.longestStreakWeeks,
      bonusPoints: 0,
    }
  }

  const currentStreakWeeks = weekDiff === 1 ? params.currentStreakWeeks + 1 : 1
  const longestStreakWeeks = Math.max(params.longestStreakWeeks, currentStreakWeeks)
  return { currentStreakWeeks, longestStreakWeeks, bonusPoints: streakBonusForWeeks(currentStreakWeeks) }
}
