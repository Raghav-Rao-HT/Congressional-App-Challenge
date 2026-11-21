import type { PetStage } from '../types/models'
import { PET_STAGE_THRESHOLDS } from './points'

export interface PetSpecies {
  id: string
  name: string
  fallbackEmoji: string
}

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

export function petSpriteUrl(speciesId: string, stage: PetStage, asleep = false): string {
  const number = Math.min(stage, PET_STAGE_THRESHOLDS.length - 1) + 1
  return `/pets/${speciesId}/stage-${number}${asleep ? '-asleep' : ''}.png`
}

export function petStageLabel(stage: PetStage): string {
  return `Stage ${stage + 1}`
}

export const PET_NAME_MAX_LENGTH = 24

export function cleanPetName(typed: string): string | null {
  const name = typed.replace(/\s+/g, ' ').trim().slice(0, PET_NAME_MAX_LENGTH).trim()
  return name || null
}
