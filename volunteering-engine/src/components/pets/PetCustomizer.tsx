import { Brush, Sparkles, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ACCESSORIES } from '../../lib/petAccessories'
import { getColorScheme } from '../../lib/petColors'
import { petStageLabel } from '../../lib/petVisuals'
import type { Pet, PetLook } from '../../types/models'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { AccessoryIcon } from './PetAccessory'
import { Easel } from './Easel'
import { PetSprite } from './PetSprite'

// A window for dressing up one pet: paint it from the easel, and pick an
// accessory. Each choice is saved as soon as it is made, and shows up on the
// member's island too.
export function PetCustomizer({
  pet,
  look,
  onChange,
  onClose,
}: {
  pet: Pet
  look: PetLook
  onChange: (patch: PetLook) => void
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const scheme = getColorScheme(look.color)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    // Keep the page behind from scrolling while the window is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-fg/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-3xl rounded-card border border-line bg-surface shadow-lift"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-info-soft text-info">
              <Brush className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-lg font-bold text-fg">
                Dress up {pet.name}
              </h2>
              <p className="text-sm text-muted">Pick a paint colour and an accessory.</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1.05fr_1fr]">
          <div>
            <Easel colorId={look.color} onPick={(color) => onChange({ color })}>
              <PetSprite species={pet.species} stage={pet.stage} size={200} look={look} className="relative drop-shadow-md" />
            </Easel>
            <p className="mt-3 text-center text-sm text-muted">
              {scheme ? (
                <>
                  Painted <span className="font-semibold text-fg">{scheme.name}</span>
                </>
              ) : (
                'Original colours. Click a paint blob to repaint.'
              )}
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-fg">Accessories</h3>
              <Badge tone="violet">{petStageLabel(pet.stage)}</Badge>
            </div>
            <div role="group" aria-label="Accessories" className="mt-3 grid grid-cols-2 gap-3">
              <AccessoryChoice label="None" selected={!look.accessory} onClick={() => onChange({ accessory: null })}>
                <span className="grid h-10 w-16 place-items-center text-muted">
                  <Sparkles className="size-6" aria-hidden />
                </span>
              </AccessoryChoice>
              {ACCESSORIES.map((accessory) => (
                <AccessoryChoice
                  key={accessory.id}
                  label={accessory.name}
                  selected={look.accessory === accessory.id}
                  onClick={() => onChange({ accessory: accessory.id })}
                >
                  <AccessoryIcon id={accessory.id} />
                </AccessoryChoice>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Your changes save automatically, and {pet.name} wears them on your island too.
            </p>
            <div className="mt-auto flex justify-end pt-5">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessoryChoice({
  label,
  selected,
  onClick,
  children,
}: {
  label: string
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition',
        selected ? 'border-brand-500 bg-info-soft shadow-sm' : 'border-line bg-surface hover:border-brand-300',
      )}
    >
      {children}
      <span className="text-sm font-semibold text-fg">{label}</span>
    </button>
  )
}
