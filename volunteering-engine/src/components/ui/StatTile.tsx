import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Card } from './Card'

const tones = {
  brand: 'bg-info-soft text-info',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  violet: 'bg-violet-soft text-violet',
} as const

export function StatTile({
  icon: Icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tone?: keyof typeof tones
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', tones[tone])}>
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-fg tabular-nums">{value}</p>
      </div>
    </Card>
  )
}
