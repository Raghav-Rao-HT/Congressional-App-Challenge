import { Check, RotateCcw } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { COLOR_SCHEMES } from '../../lib/petColors'

// An artist's easel: a canvas board (holding `children`, the pet being
// painted), a tray of paint blobs to click, and legs. `colorId` is the
// scheme in use, or null for the pet's original colours.
export function Easel({
  colorId,
  onPick,
  children,
}: {
  colorId: string | null | undefined
  onPick: (colorId: string | null) => void
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-sm">
      {/* the board: a wooden clamp across the top, then the canvas in its frame */}
      <div className="mx-auto h-3 w-[88%] rounded-full bg-gradient-to-b from-[#d9a66b] to-[#a8703a] shadow-sm" />
      <div className="mx-auto -mt-1 w-[80%] rounded-lg border-[10px] border-[#c28b52] bg-gradient-to-b from-info-soft to-violet-soft shadow-lift">
        <div className="relative grid aspect-square place-items-center">
          <div aria-hidden className="absolute bottom-[12%] h-4 w-1/2 rounded-[50%] bg-fg/10 blur-md" />
          {children}
        </div>
      </div>

      {/* the tray the paint sits on */}
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
          {COLOR_SCHEMES.map((scheme) => (
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
      </div>

      {/* the legs */}
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
  onClick,
  style,
  mark,
}: {
  label: string
  selected: boolean
  onClick: () => void
  style: CSSProperties
  mark: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      style={style}
      className={cn(
        'grid size-9 place-items-center rounded-[48%_52%_46%_54%/55%_45%_55%_45%] shadow-[inset_0_-3px_5px_rgb(0_0_0/0.18),inset_0_2px_3px_rgb(255_255_255/0.45)] transition hover:scale-110 focus-visible:outline-offset-4',
        selected && 'ring-[3px] ring-white ring-offset-2 ring-offset-[#b5773f]',
      )}
    >
      {selected && mark}
    </button>
  )
}
