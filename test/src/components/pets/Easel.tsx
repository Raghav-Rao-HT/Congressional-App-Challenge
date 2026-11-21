import { Check, Lock, RotateCcw } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { COLOR_SCHEMES, isSpecialScheme } from '../../lib/petColors'

export function Easel({
  colorId,
  hours,
  onPick,
  children,
}: {
  colorId: string | null | undefined
  hours: number
  onPick: (colorId: string | null) => void
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mx-auto h-3 w-[88%] rounded-full bg-gradient-to-b from-[#d9a66b] to-[#a8703a] shadow-sm" />
      <div className="mx-auto -mt-1 w-[80%] rounded-lg border-[10px] border-[#c28b52] bg-gradient-to-b from-info-soft to-violet-soft shadow-lift">
        <div className="relative grid aspect-square place-items-center">
          <div aria-hidden className="absolute bottom-[12%] h-4 w-1/2 rounded-[50%] bg-fg/10 blur-md" />
          {children}
        </div>
      </div>

      <div className="relative z-10 -mt-3 rounded-2xl bg-gradient-to-b from-[#d9a66b] to-[#b5773f] p-3 shadow-card">
        <div
          role="group"
          aria-label="Paint colours"
          className="mx-auto flex max-w-[14.5rem] flex-wrap items-center justify-center gap-2.5"
        >
          <PaintBlob
            label="Original colours"
            selected={!colorId}
            onClick={() => onPick(null)}
            style={{ background: 'linear-gradient(135deg, #ffffff 0 46%, #e9e9ef 46% 54%, #ffffff 54%)' }}
            mark={<RotateCcw className="size-4 text-muted" aria-hidden />}
          />
          {COLOR_SCHEMES.filter((scheme) => !isSpecialScheme(scheme)).map((scheme) => (
            <PaintBlob
              key={scheme.id}
              label={scheme.name}
              selected={colorId === scheme.id}
              onClick={() => onPick(scheme.id)}
              style={{ background: scheme.swatch }}
              mark={<Check className="size-4 text-white drop-shadow" aria-hidden />}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-white/90">Special finishes</p>
        <div role="group" aria-label="Special finishes" className="mt-2 flex items-start justify-center gap-3">
          {COLOR_SCHEMES.filter(isSpecialScheme).map((scheme) => {
            const locked = hours < scheme.minHours
            return (
              <div key={scheme.id} className="flex w-12 flex-col items-center gap-1">
                <PaintBlob
                  label={locked ? `${scheme.name} (unlocks at ${scheme.minHours} service hours)` : scheme.name}
                  selected={colorId === scheme.id}
                  locked={locked}
                  onClick={() => onPick(scheme.id)}
                  style={{ background: scheme.swatch }}
                  mark={<Check className="size-4 text-white drop-shadow" aria-hidden />}
                />
                <span className="text-[11px] font-semibold leading-none text-white/95">
                  {locked ? `${scheme.minHours} h` : scheme.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <svg viewBox="0 0 320 110" className="mx-auto -mt-2 block h-24 w-[80%]" aria-hidden>
        <g stroke="#a8703a" strokeWidth="14" strokeLinecap="round">
          <path d="M90 6 L48 100" />
          <path d="M230 6 L272 100" />
          <path d="M160 6 L160 104" />
        </g>
        <g stroke="#d9a66b" strokeWidth="4" strokeLinecap="round" opacity="0.7">
          <path d="M86 10 L46 96" />
          <path d="M226 10 L268 96" />
          <path d="M156 10 L156 100" />
        </g>
        <path d="M70 62 H250" stroke="#b5773f" strokeWidth="9" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function PaintBlob({
  label,
  selected,
  locked = false,
  onClick,
  style,
  mark,
}: {
  label: string
  selected: boolean
  locked?: boolean
  onClick: () => void
  style: CSSProperties
  mark: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      aria-pressed={selected}
      aria-disabled={locked || undefined}
      aria-label={label}
      title={label}
      style={style}
      className={cn(
        'grid size-9 place-items-center rounded-[48%_52%_46%_54%/55%_45%_55%_45%] shadow-[inset_0_-3px_5px_rgb(0_0_0/0.18),inset_0_2px_3px_rgb(255_255_255/0.45)] transition focus-visible:outline-offset-4',
        locked ? 'cursor-not-allowed opacity-70 saturate-50' : 'hover:scale-110',
        selected && 'ring-[3px] ring-white ring-offset-2 ring-offset-[#b5773f]',
      )}
    >
      {locked ? <Lock className="size-4 text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]" aria-hidden /> : selected && mark}
    </button>
  )
}
