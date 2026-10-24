import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const controlClasses =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg shadow-sm transition ' +
  'placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-bad'

// A label that wraps its control, so the two are associated without ids.
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs font-medium text-bad">
          {error}
        </span>
      )}
    </label>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClasses, className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(controlClasses, 'pr-8', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlClasses, 'resize-y', className)} {...props} />
}
