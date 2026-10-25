import type { PetStage } from '../types/models'

export interface Accessory {
  id: string
  name: string
}

export const ACCESSORIES: readonly Accessory[] = [
  { id: 'sombrero', name: 'Sombrero' },
  { id: 'sunglasses', name: 'Sunglasses' },
  { id: 'cap', name: 'Baseball cap' },
  { id: 'helmet', name: 'Army helmet' },
]

export function getAccessory(id: string | null | undefined): Accessory | null {
  return ACCESSORIES.find((accessory) => accessory.id === id) ?? null
}

interface Spot {
  x: number
  y: number
}

// Where one sprite's head is, measured on its 512 x 512 image, so an accessory
// can be drawn on it. Every sprite faces right; the Island flips a pet's whole
// picture (accessory included) when it should face left.
export interface HeadAnchor {
  // The bottom-centre of a hat resting on the head, and how wide the head is.
  hat: { x: number; y: number; width: number; tilt?: number }
  // The eyes, for sunglasses: two eyes seen from the front, or one seen from the side.
  eyes:
    | { kind: 'front'; left: Spot; right: Spot; size: number; tilt?: number }
    | { kind: 'side'; at: Spot; size: number; tilt?: number }
}

// Indexed by species, then by growth stage (0-3).
const ANCHORS: Record<string, readonly HeadAnchor[]> = {
  fox: [
    { hat: { x: 310, y: 235, width: 150 }, eyes: { kind: 'front', left: { x: 285, y: 292 }, right: { x: 378, y: 290 }, size: 36 } },
    { hat: { x: 330, y: 178, width: 125, tilt: -4 }, eyes: { kind: 'side', at: { x: 348, y: 218 }, size: 30, tilt: 28 } },
    { hat: { x: 322, y: 135, width: 125 }, eyes: { kind: 'side', at: { x: 322, y: 165 }, size: 28, tilt: 28 } },
    { hat: { x: 312, y: 128, width: 125 }, eyes: { kind: 'side', at: { x: 313, y: 157 }, size: 29, tilt: 26 } },
  ],
  gorilla: [
    { hat: { x: 322, y: 238, width: 175 }, eyes: { kind: 'front', left: { x: 298, y: 297 }, right: { x: 380, y: 295 }, size: 34 } },
    { hat: { x: 345, y: 178, width: 150 }, eyes: { kind: 'front', left: { x: 358, y: 223 }, right: { x: 412, y: 227 }, size: 28, tilt: 8 } },
    { hat: { x: 345, y: 135, width: 145 }, eyes: { kind: 'front', left: { x: 347, y: 165 }, right: { x: 392, y: 168 }, size: 26, tilt: 8 } },
    { hat: { x: 318, y: 138, width: 140 }, eyes: { kind: 'front', left: { x: 318, y: 167 }, right: { x: 363, y: 170 }, size: 26, tilt: 8 } },
  ],
  dragon: [
    { hat: { x: 335, y: 222, width: 120 }, eyes: { kind: 'side', at: { x: 333, y: 278 }, size: 34, tilt: 22 } },
    { hat: { x: 385, y: 200, width: 100 }, eyes: { kind: 'side', at: { x: 388, y: 227 }, size: 28, tilt: 18 } },
    { hat: { x: 385, y: 138, width: 90 }, eyes: { kind: 'side', at: { x: 388, y: 168 }, size: 21, tilt: 18 } },
    { hat: { x: 418, y: 138, width: 95 }, eyes: { kind: 'side', at: { x: 445, y: 167 }, size: 22, tilt: 18 } },
  ],
  fish: [
    { hat: { x: 335, y: 335, width: 90 }, eyes: { kind: 'side', at: { x: 342, y: 383 }, size: 30, tilt: 14 } },
    { hat: { x: 400, y: 305, width: 90 }, eyes: { kind: 'side', at: { x: 398, y: 338 }, size: 28, tilt: 18 } },
    { hat: { x: 415, y: 245, width: 80 }, eyes: { kind: 'side', at: { x: 412, y: 283 }, size: 25, tilt: 18 } },
    { hat: { x: 430, y: 160, width: 80 }, eyes: { kind: 'side', at: { x: 434, y: 192 }, size: 21, tilt: 10 } },
  ],
}

export function headAnchor(species: string, stage: PetStage | number): HeadAnchor | null {
  const stages = ANCHORS[species]
  return stages ? stages[Math.min(Math.max(stage, 0), stages.length - 1)] : null
}
