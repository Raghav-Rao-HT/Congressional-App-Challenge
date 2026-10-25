const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'short' })

export function DateBadge({ at }: { at: number }) {
  const date = new Date(at)
  return (
    <div
      aria-hidden
      className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-center text-white shadow-sm"
    >
      <div>
        <div className="text-[0.7rem] font-semibold uppercase leading-none tracking-wider text-white/80">
          {monthFormat.format(date)}
        </div>
        <div className="mt-0.5 text-2xl font-bold leading-none tabular-nums">{date.getDate()}</div>
      </div>
    </div>
  )
}
