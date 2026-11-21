import { Brush, Lock, Sparkles, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ACCESSORIES, HELD_ITEMS, isUnlocked } from '../../lib/petAccessories'
import { getColorScheme } from '../../lib/petColors'
import { cleanPetName, getPetSpecies, PET_NAME_MAX_LENGTH, petStageLabel } from '../../lib/petVisuals'
import type { Pet, PetLook } from '../../types/models'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Tabs } from '../ui/Tabs'
import { AccessoryIcon } from './PetAccessory'
import { Easel } from './Easel'
import { PetPlayground } from './PetPlayground'
import { PetSprite } from './PetSprite'

export function PetCustomizer({
  pet,
  look,
  hours,
  onChange,
  onClose,
}: {
  pet: Pet
  look: PetLook
  hours: number
  onChange: (patch: PetLook) => void
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const scheme = getColorScheme(look.color)
  const [tab, setTab] = useState<'dress' | 'play'>('dress')

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
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
                {tab === 'dress' ? 'Dress up' : 'Play with'} {pet.name}
              </h2>
              <p className="text-sm text-muted">
                {tab === 'dress' ? 'Pick a paint colour, something to wear and something to hold.' : `Use an item and see what ${pet.name} does.`}
              </p>
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

        <div className="px-5 pt-4 sm:px-6">
          <Tabs
            tabs={[
              { value: 'dress', label: 'Dress up' },
              { value: 'play', label: 'Play' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'dress' ? (
          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1.05fr_1fr]">
          <div>
            <Easel colorId={look.color} hours={hours} onPick={(color) => onChange({ color })}>
              <PetSprite species={pet.species} stage={pet.stage} size={200} look={look} name={pet.name} className="relative drop-shadow-md" />
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
            <NameField
              saved={look.name ?? ''}
              fallback={getPetSpecies(pet.species).name}
              onSave={(name) => onChange({ name })}
            />

            <div className="mt-5 flex items-center gap-2">
              <h3 className="text-base font-semibold text-fg">Accessories</h3>
              <Badge tone="violet">{petStageLabel(pet.stage)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              You have <span className="font-semibold text-fg tabular-nums">{hours}</span> service hours. Earn more to unlock
              the locked ones.
            </p>

            <h4 className="mt-4 text-sm font-semibold text-fg">Wear</h4>
            <div role="group" aria-label="Accessories to wear" className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
              <AccessoryChoice label="None" selected={!look.accessory} onClick={() => onChange({ accessory: null })}>
                <span className="grid h-14 w-20 place-items-center text-muted">
                  <Sparkles className="size-6" aria-hidden />
                </span>
              </AccessoryChoice>
              {ACCESSORIES.map((accessory) => (
                <AccessoryChoice
                  key={accessory.id}
                  label={accessory.name}
                  selected={look.accessory === accessory.id}
                  lockedUntil={isUnlocked(accessory, hours) ? undefined : accessory.minHours}
                  onClick={() => onChange({ accessory: accessory.id })}
                >
                  <AccessoryIcon id={accessory.id} />
                </AccessoryChoice>
              ))}
            </div>

            <h4 className="mt-5 text-sm font-semibold text-fg">Hold</h4>
            <div role="group" aria-label="Items to hold" className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
              <AccessoryChoice label="None" selected={!look.held} onClick={() => onChange({ held: null })}>
                <span className="grid h-14 w-20 place-items-center text-muted">
                  <Sparkles className="size-6" aria-hidden />
                </span>
              </AccessoryChoice>
              {HELD_ITEMS.map((item) => (
                <AccessoryChoice
                  key={item.id}
                  label={item.name}
                  selected={look.held === item.id}
                  lockedUntil={isUnlocked(item, hours) ? undefined : item.minHours}
                  onClick={() => onChange({ held: item.id })}
                >
                  <AccessoryIcon id={item.id} />
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
        ) : (
          <div className="mx-auto max-w-xl p-5 sm:p-6">
            <PetPlayground pet={pet} look={look} />
            <div className="mt-5 flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AccessoryChoice({
  label,
  selected,
  lockedUntil,
  onClick,
  children,
}: {
  label: string
  selected: boolean
  lockedUntil?: number
  onClick: () => void
  children: ReactNode
}) {
  const locked = lockedUntil !== undefined
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      aria-pressed={selected}
      aria-disabled={locked || undefined}
      title={locked ? `Unlocks at ${lockedUntil} service hours` : undefined}
      className={cn(
        'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition',
        selected ? 'border-brand-500 bg-info-soft shadow-sm' : 'border-line bg-surface',
        locked ? 'cursor-not-allowed bg-surface-2' : !selected && 'hover:border-brand-300',
      )}
    >
      <span className={cn('contents', locked && '[&>svg]:opacity-40 [&>svg]:grayscale')}>{children}</span>
      <span className={cn('text-sm font-semibold', locked ? 'text-muted' : 'text-fg')}>{label}</span>
      {locked && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
          <Lock className="size-3" aria-hidden />
          {lockedUntil} h
        </span>
      )}
    </button>
  )
}

function NameField({
  saved,
  fallback,
  onSave,
}: {
  saved: string
  fallback: string
  onSave: (name: string | null) => void
}) {
  const [draft, setDraft] = useState(saved)
  const edited = useRef(false)
  const latest = useRef({ draft, onSave })
  useEffect(() => {
    latest.current = { draft, onSave }
  })

  function commit() {
    if (!edited.current) return
    edited.current = false
    const name = cleanPetName(draft)
    onSave(name)
    setDraft(name ?? '')
  }

  useEffect(
    () => () => {
      if (edited.current) latest.current.onSave(cleanPetName(latest.current.draft))
    },
    [],
  )

  return (
    <Field label="Name" hint="Call it anything you like. The app uses this name wherever your pet is mentioned.">
      <Input
        value={draft}
        placeholder={fallback}
        maxLength={PET_NAME_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => {
          edited.current = true
          setDraft(event.target.value)
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
        }}
      />
    </Field>
  )
}
