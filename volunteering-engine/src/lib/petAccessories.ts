import type { PetStage } from '../types/models'

export interface Accessory {
  id: string
  name: string
  minHours: number
}

export const ACCESSORIES: readonly Accessory[] = [
  { id: 'sombrero', name: 'Sombrero', minHours: 0 },
  { id: 'sunglasses', name: 'Sunglasses', minHours: 0 },
  { id: 'cap', name: 'Baseball cap', minHours: 0 },
  { id: 'helmet', name: 'Army helmet', minHours: 0 },
  { id: 'beanie', name: 'Beanie', minHours: 0 },
  { id: 'astronaut', name: 'Astronaut helmet', minHours: 50 },
  { id: 'hair', name: 'Long hair', minHours: 100 },
  { id: 'antlers', name: 'Antlers', minHours: 200 },
  { id: 'crown', name: 'Crown', minHours: 400 },
]

export const HELD_ITEMS: readonly Accessory[] = [
  { id: 'icecream', name: 'Ice cream', minHours: 0 },
  { id: 'fan', name: 'Fan', minHours: 0 },
  { id: 'pompom', name: 'Pom-pom', minHours: 0 },
  { id: 'bat', name: 'Baseball bat', minHours: 0 },
  { id: 'guitar', name: 'Guitar', minHours: 50 },
  { id: 'duck', name: 'Rubber duck', minHours: 100 },
  { id: 'trophy', name: 'Trophy', minHours: 200 },
  { id: 'diamond', name: 'Diamond', minHours: 400 },
]

export function getAccessory(id: string | null | undefined): Accessory | null {
  return ACCESSORIES.find((accessory) => accessory.id === id) ?? null
}

export function getHeldItem(id: string | null | undefined): Accessory | null {
  return HELD_ITEMS.find((item) => item.id === id) ?? null
}

export function isUnlocked(item: { minHours: number }, hours: number): boolean {
  return hours >= item.minHours
}

interface Spot {
  x: number
  y: number
}

export interface HeadAnchor {
  hat: { x: number; y: number; width: number; tilt?: number }
  eyes:
    | { kind: 'front'; left: Spot; right: Spot; size: number; tilt?: number }
    | { kind: 'side'; at: Spot; size: number; tilt?: number }
  hand: { x: number; y: number; tilt?: number; scale: number }
}

const ANCHORS: Record<string, readonly HeadAnchor[]> = {
  fox: [
    { hat: { x: 310, y: 235, width: 150 }, eyes: { kind: 'front', left: { x: 285, y: 292 }, right: { x: 378, y: 290 }, size: 36 }, hand: { x: 322, y: 438, tilt: 28, scale: 1.14 } },
    { hat: { x: 330, y: 178, width: 125, tilt: -4 }, eyes: { kind: 'side', at: { x: 348, y: 218 }, size: 30, tilt: 28 }, hand: { x: 350, y: 418, tilt: 10, scale: 1.2 } },
    { hat: { x: 322, y: 135, width: 125 }, eyes: { kind: 'side', at: { x: 322, y: 165 }, size: 28, tilt: 28 }, hand: { x: 325, y: 410, tilt: 8, scale: 1.32 } },
    { hat: { x: 312, y: 128, width: 125 }, eyes: { kind: 'side', at: { x: 313, y: 157 }, size: 29, tilt: 26 }, hand: { x: 345, y: 425, tilt: 8, scale: 1.32 } },
  ],
  gorilla: [
    { hat: { x: 322, y: 238, width: 175 }, eyes: { kind: 'front', left: { x: 298, y: 297 }, right: { x: 380, y: 295 }, size: 34 }, hand: { x: 335, y: 450, tilt: 28, scale: 1.38 } },
    { hat: { x: 345, y: 178, width: 150 }, eyes: { kind: 'front', left: { x: 360, y: 228 }, right: { x: 414, y: 227 }, size: 28, tilt: 8 }, hand: { x: 362, y: 452, tilt: 8, scale: 1.38 } },
    { hat: { x: 345, y: 135, width: 145 }, eyes: { kind: 'front', left: { x: 350, y: 169 }, right: { x: 393, y: 168 }, size: 26, tilt: 8 }, hand: { x: 362, y: 452, tilt: 8, scale: 1.44 } },
    { hat: { x: 318, y: 138, width: 140 }, eyes: { kind: 'front', left: { x: 318, y: 168 }, right: { x: 358, y: 168 }, size: 26, tilt: 8 }, hand: { x: 350, y: 458, tilt: 8, scale: 1.44 } },
  ],
  dragon: [
    { hat: { x: 335, y: 222, width: 120 }, eyes: { kind: 'side', at: { x: 333, y: 278 }, size: 34, tilt: 22 }, hand: { x: 335, y: 445, tilt: 22, scale: 1.14 } },
    { hat: { x: 385, y: 200, width: 100 }, eyes: { kind: 'side', at: { x: 388, y: 227 }, size: 28, tilt: 18 }, hand: { x: 415, y: 440, tilt: 8, scale: 1.2 } },
    { hat: { x: 385, y: 138, width: 90 }, eyes: { kind: 'side', at: { x: 388, y: 168 }, size: 21, tilt: 18 }, hand: { x: 410, y: 440, tilt: 8, scale: 1.26 } },
    { hat: { x: 418, y: 138, width: 95 }, eyes: { kind: 'side', at: { x: 419, y: 163 }, size: 22, tilt: 18 }, hand: { x: 415, y: 440, tilt: 8, scale: 1.32 } },
  ],
  fish: [
    { hat: { x: 335, y: 335, width: 90 }, eyes: { kind: 'side', at: { x: 342, y: 383 }, size: 30, tilt: 14 }, hand: { x: 290, y: 425, tilt: 20, scale: 1.08 } },
    { hat: { x: 400, y: 305, width: 90 }, eyes: { kind: 'side', at: { x: 398, y: 338 }, size: 28, tilt: 18 }, hand: { x: 330, y: 420, tilt: 0, scale: 1.14 } },
    { hat: { x: 415, y: 245, width: 80 }, eyes: { kind: 'side', at: { x: 412, y: 283 }, size: 25, tilt: 18 }, hand: { x: 330, y: 420, tilt: 0, scale: 1.2 } },
    { hat: { x: 430, y: 160, width: 80 }, eyes: { kind: 'side', at: { x: 438, y: 197 }, size: 21, tilt: 10 }, hand: { x: 330, y: 420, tilt: 0, scale: 1.26 } },
  ],
}

export function headAnchor(species: string, stage: PetStage | number): HeadAnchor | null {
  const stages = ANCHORS[species]
  return stages ? stages[Math.min(Math.max(stage, 0), stages.length - 1)] : null
}
