import type { PetStage } from '../types/models'
import { PET_STAGE_THRESHOLDS } from './points'

export interface PetSpecies {
  id: string
  name: string
  // Shown until the species' sprite images exist (and if one fails to load).
  fallbackEmoji: string
}

// The pets a member can choose to give hours to. Adding a species is one
// entry here plus its sprite images under public/pets/<id>/.
export const PET_SPECIES: readonly PetSpecies[] = [
  { id: 'fox', name: 'Fox', fallbackEmoji: '🦊' },
  { id: 'gorilla', name: 'Gorilla', fallbackEmoji: '🦍' },
  { id: 'dragon', name: 'Dragon', fallbackEmoji: '🐉' },
  { id: 'fish', name: 'Fish', fallbackEmoji: '🐟' },
]

export const DEFAULT_PET_ID = PET_SPECIES[0].id

export function getPetSpecies(id: string | undefined): PetSpecies {
  return PET_SPECIES.find((s) => s.id === id) ?? PET_SPECIES[0]
}

// One image per stage, in order: stage-1.png (starting sprite) through
// stage-4.png (100 hours). A stage past the last one (a pet saved back when
// there were five) shows the final sprite.
export function petSpriteUrl(speciesId: string, stage: PetStage): string {
  return `/pets/${speciesId}/stage-${Math.min(stage, PET_STAGE_THRESHOLDS.length - 1) + 1}.png`
}

export function petStageLabel(stage: PetStage): string {
  return `Stage ${stage + 1}`
}
