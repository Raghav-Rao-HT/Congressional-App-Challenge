import { format, parse, startOfDay } from 'date-fns'

export const DATE_FORMAT = 'yyyy-MM-dd'

export function todayISO(): string {
  return format(new Date(), DATE_FORMAT)
}

export function parseISODate(iso: string): Date {
  return parse(iso, DATE_FORMAT, new Date())
}

export function startOfDayMillis(iso: string): number {
  return parseISODate(iso).getTime()
}

export function endOfDayMillis(iso: string): number {
  const date = parseISODate(iso)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

export function startOfTodayMillis(): number {
  return startOfDay(new Date()).getTime()
}
