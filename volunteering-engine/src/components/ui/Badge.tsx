import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'violet'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-info-soft text-info',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  violet: 'bg-violet-soft text-violet',
}

export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
