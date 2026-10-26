import { Paintbrush } from 'lucide-react'
import { useState } from 'react'
import { PetCustomizer } from '../../components/pets/PetCustomizer'
import { PetSprite } from '../../components/pets/PetSprite'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useIslandState } from '../../hooks/useIslandState'
import { useMyPets } from '../../hooks/useMyPets'
import { petStageLabel } from '../../lib/petVisuals'
import { nextStageThreshold, PET_STAGE_THRESHOLDS } from '../../lib/points'

export function PetsPage() {
  const pets = useMyPets()
  const { profile } = useAuth()
  const { looks, error, setLook } = useIslandState()
  const [customizing, setCustomizing] = useState<string | null>(null)
  const chosen = pets.find((pet) => pet.species === customizing)

  return (
    <Page>
      <PageHeader
        title="Your pets"
        description={`When you log hours you choose which pet they go to. Each pet changes its look at ${PET_STAGE_THRESHOLDS.slice(1).join(', ')} hours. Click a pet to paint it, dress it up or give it something to hold. Some looks unlock as you give more service hours.`}
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => {
          const next = nextStageThreshold(pet.xp)
          const previous = PET_STAGE_THRESHOLDS[pet.stage]
          const progress = next === null ? 100 : ((pet.xp - previous) / (next - previous)) * 100
          const open = () => setCustomizing(pet.species)
          return (
            <Card
              key={pet.species}
              interactive
              role="button"
              tabIndex={0}
              aria-label={`Customise ${pet.name}`}
              onClick={open}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  open()
                }
              }}
              className="cursor-pointer overflow-hidden"
            >
              <div className="relative grid h-44 place-items-center bg-gradient-to-b from-info-soft to-violet-soft">
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-info shadow-sm">
                  <Paintbrush className="size-3.5" aria-hidden />
                  Customise
                </span>
                <div aria-hidden className="absolute bottom-6 h-4 w-28 rounded-[50%] bg-fg/10 blur-md" />
                <PetSprite
                  species={pet.species}
                  stage={pet.stage}
                  size={112}
                  look={looks[pet.species]}
                  name={pet.name}
                  className="relative drop-shadow-md"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-fg">{pet.name}</h2>
                  <Badge tone="violet">{petStageLabel(pet.stage)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted tabular-nums">{pet.xp} hours given</p>
                <div
                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-2"
                  role="progressbar"
                  aria-label={`${pet.name} growth`}
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-coral-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {next === null ? 'Fully grown 🎉' : `${next - pet.xp}h to the next stage`}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {chosen && (
        <PetCustomizer
          pet={chosen}
          look={looks[chosen.species] ?? {}}
          hours={profile?.totalHoursApproved ?? 0}
          onChange={(patch) => setLook(chosen.species, { ...looks[chosen.species], ...patch })}
          onClose={() => setCustomizing(null)}
        />
      )}
    </Page>
  )
}
