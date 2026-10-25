import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const medals: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950',
}

// One line of a ranking: medal/number, name, and a score on the right.
// `rank` is null for an entry that isn't ranked (shown as a dash), `muted`
// dims it, `action` adds controls (e.g. an admin's Remove button) after the
// score, and `footer` adds a line underneath (e.g. a confirmation).
export function RankRow({
  rank,
  name,
  meta,
  value,
  highlight,
  muted,
  action,
  footer,
}: {
  rank: number | null
  name: string
  meta?: ReactNode
  value: ReactNode
  highlight?: boolean
  muted?: boolean
  action?: ReactNode
  footer?: ReactNode
}) {
  return (
    <li
      className={cn(
        'rounded-2xl border px-4 py-3 transition',
        highlight ? 'border-brand-300 bg-info-soft' : 'border-line bg-surface',
        muted && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums',
            (rank !== null && medals[rank]) || 'bg-surface-2 text-muted',
          )}
        >
          {rank ?? '–'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{name}</p>
          {meta && <p className="text-xs text-muted">{meta}</p>}
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-fg">
          <Star className="size-4 text-warn" aria-hidden />
          {value}
        </span>
        {action}
      </div>
      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </li>
  )
}
