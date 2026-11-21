import { differenceInCalendarWeeks, parseISO, startOfWeek } from 'date-fns'
import { streakBonusForWeeks } from './points'

export interface StreakUpdate {
  currentStreakWeeks: number
  longestStreakWeeks: number
  bonusPoints: number
}

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
