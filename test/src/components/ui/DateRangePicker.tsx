import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { DATE_FORMAT, parseISODate, todayISO } from '../../lib/eventDates'
import { Card } from './Card'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function DateRangePicker({
  start,
  end,
  onChange,
  invalid,
}: {
  start: string
  end: string
  onChange: (start: string, end: string) => void
  invalid?: boolean
}) {
  const today = parseISODate(todayISO())
  const startDate = start ? parseISODate(start) : null
  const endDate = end ? parseISODate(end) : null

  const [month, setMonth] = useState(startOfMonth(startDate ?? today))
  const [focused, setFocused] = useState<Date>(startDate && !isBefore(startDate, today) ? startDate : today)
  const [pickingEnd, setPickingEnd] = useState(false)
  const [hover, setHover] = useState<Date | null>(null)
  const grid = useRef<HTMLDivElement>(null)
  const moveFocus = useRef(false)

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) })
  const canGoBack = !isBefore(endOfMonth(addMonths(month, -1)), today)

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${format(focused, DATE_FORMAT)}"]`)?.focus()
  }, [focused, month])

  function pick(day: Date) {
    const iso = format(day, DATE_FORMAT)
    setFocused(day)
    if (pickingEnd && startDate && !isBefore(day, startDate)) {
      onChange(start, iso)
      setPickingEnd(false)
    } else {
      onChange(iso, iso)
      setPickingEnd(true)
    }
  }

  function move(to: Date) {
    const next = isBefore(to, today) ? today : to
    moveFocus.current = true
    setFocused(next)
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next))
  }

  function onKeyDown(event: KeyboardEvent) {
    const steps: Record<string, Date> = {
      ArrowLeft: addDays(focused, -1),
      ArrowRight: addDays(focused, 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      Home: startOfWeek(focused),
      End: endOfWeek(focused),
      PageUp: addMonths(focused, -1),
      PageDown: addMonths(focused, 1),
    }
    if (!steps[event.key]) return
    event.preventDefault()
    move(steps[event.key])
  }

  const previewEnd = pickingEnd && hover && startDate && !isBefore(hover, startDate) ? hover : endDate

  return (
    <Card className={cn('p-4', invalid && 'border-bad')}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setMonth(addMonths(month, -1))}
          className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p aria-live="polite" className="font-semibold text-fg">
          {format(month, 'MMMM yyyy')}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth(addMonths(month, 1))}
          className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-muted">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      <div ref={grid} role="group" aria-label={format(month, 'MMMM yyyy')} onKeyDown={onKeyDown} className="grid grid-cols-7">
        {days.map((day) => {
          const outside = !isSameMonth(day, month)
          const past = isBefore(day, today)
          const isStart = !!startDate && isSameDay(day, startDate)
          const isEnd = !!previewEnd && isSameDay(day, previewEnd)
          const inRange = !!startDate && !!previewEnd && !isBefore(day, startDate) && !isBefore(previewEnd, day)
          return (
            <div key={day.toISOString()} className={cn('grid place-items-center', inRange && 'bg-info-soft', isStart && 'rounded-l-full', isEnd && 'rounded-r-full')}>
              <button
                type="button"
                data-date={format(day, DATE_FORMAT)}
                disabled={past}
                tabIndex={isSameDay(day, focused) ? 0 : -1}
                aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                aria-pressed={isStart || isEnd}
                onClick={() => pick(day)}
                onFocus={() => setFocused(day)}
                onMouseEnter={() => setHover(day)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  'size-10 rounded-full text-sm font-medium tabular-nums transition',
                  past && 'cursor-not-allowed text-muted/40',
                  !past && outside && 'text-muted',
                  !past && !outside && 'text-fg',
                  !past && !isStart && !isEnd && 'hover:bg-surface-2',
                  isSameDay(day, today) && !isStart && !isEnd && 'ring-1 ring-brand-500',
                  (isStart || isEnd) && 'bg-brand-600 text-white hover:bg-brand-700',
                )}
              >
                {format(day, 'd')}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {!startDate
          ? 'Pick the first day of the event.'
          : pickingEnd
            ? 'Now pick the last day. Pick the same day again for a one-day event.'
            : `${format(startDate, 'EEE, MMM d, yyyy')} to ${endDate ? format(endDate, 'EEE, MMM d, yyyy') : ''}`}
      </p>
    </Card>
  )
}
