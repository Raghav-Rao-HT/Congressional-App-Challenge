import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const medals: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
  2: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
  3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950',
}

// One line of a ranking: medal/number, name, and a score on the right.
export function RankRow({
  rank,
  name,
  meta,
  value,
  highlight,
}: {
  rank: number
  name: string
  meta?: ReactNode
  value: ReactNode
  highlight?: boolean
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-4 rounded-2xl border px-4 py-3 transition',
        highlight ? 'border-brand-300 bg-info-soft' : 'border-line bg-surface',
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums',
          medals[rank] ?? 'bg-surface-2 text-muted',
        )}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-fg">{name}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
      <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-fg">
        <Star className="size-4 text-warn" aria-hidden />
        {value}
      </span>
    </li>
  )
}
