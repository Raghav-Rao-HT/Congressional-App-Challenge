import { cn } from '../../lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2 whitespace-nowrap rounded-xl px-2 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-line',
        )}
      >
        <span
          className={cn('size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')}
        />
      </span>
      {label}
    </button>
  )
}
