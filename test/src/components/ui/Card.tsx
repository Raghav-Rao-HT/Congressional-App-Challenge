import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, interactive, ...props }: ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface shadow-card',
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...props}
    />
  )
}
