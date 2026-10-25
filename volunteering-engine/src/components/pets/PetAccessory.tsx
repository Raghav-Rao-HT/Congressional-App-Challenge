import type { ReactElement } from 'react'
import { headAnchor } from '../../lib/petAccessories'

// The hats are drawn at a fixed size, 100 units across the head, with their
// origin at the bottom-centre of the hat (up is negative). Each sprite then
// scales and places them using its measured head position.

function Sombrero() {
  return (
    <g>
      <ellipse cx="0" cy="7" rx="80" ry="15" fill="#b9791f" />
      <ellipse cx="0" cy="0" rx="80" ry="14" fill="#f1c04f" />
      <ellipse cx="0" cy="0" rx="80" ry="14" fill="none" stroke="#e0457b" strokeWidth="3" strokeDasharray="7 5" />
      <path d="M-30 0 C-34 -34 -20 -58 0 -58 C20 -58 34 -34 30 0 Z" fill="#f1c04f" />
      <path d="M8 -57 C26 -50 36 -26 30 0 L14 0 C20 -24 16 -46 8 -57 Z" fill="#d9a032" opacity="0.7" />
      <path d="M-31 -6 C-12 0 12 0 31 -6 L30 -19 C12 -13 -12 -13 -30 -19 Z" fill="#e0457b" />
      <g fill="#fff3c4">
        <circle cx="-18" cy="-10.5" r="2.4" />
        <circle cx="-6" cy="-8.5" r="2.4" />
        <circle cx="6" cy="-8.5" r="2.4" />
        <circle cx="18" cy="-10.5" r="2.4" />
      </g>
    </g>
  )
}

function Cap() {
  return (
    <g>
      <path d="M-46 2 C-48 -32 -24 -54 2 -54 C30 -54 50 -32 48 2 Z" fill="#e8403f" />
      <path d="M-46 2 C-48 -32 -24 -54 2 -54 C-12 -42 -16 -20 -14 2 Z" fill="#b82626" opacity="0.55" />
      <path d="M2 -54 C6 -34 6 -14 4 2" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" fill="none" />
      <circle cx="2" cy="-54" r="4.5" fill="#b82626" />
      <circle cx="24" cy="-26" r="7" fill="#fff" opacity="0.92" />
      <path d="M-48 -3 H50 L50 5 H-48 Z" fill="#b82626" />
      <path d="M36 -2 C58 -6 88 -2 96 8 C72 14 46 12 34 6 Z" fill="#8f1d1d" />
      <path d="M36 -2 C58 -6 88 -2 96 8 C80 4 56 2 36 -2 Z" fill="#c43a3a" />
    </g>
  )
}

function Helmet() {
  return (
    <g>
      <path d="M-56 4 C-56 -42 -30 -62 0 -62 C30 -62 56 -42 56 4 Z" fill="#5f6f3b" />
      <path d="M-56 4 C-56 -42 -30 -62 0 -62 C-16 -48 -20 -20 -18 4 Z" fill="#46542b" opacity="0.6" />
      <path d="M10 -61 C34 -56 54 -34 55 -6 L40 -6 C40 -30 28 -50 10 -61 Z" fill="#7d8d52" opacity="0.7" />
      <g stroke="#3d4a25" strokeOpacity="0.35" strokeWidth="1.6" fill="none">
        <path d="M-40 -8 L-14 -52 M-20 -8 L6 -58 M2 -8 L28 -54 M24 -8 L48 -40" />
        <path d="M-46 -26 L48 -34 M-52 -12 L52 -20" />
      </g>
      <path d="M-60 3 C-60 -6 60 -6 60 3 C60 11 -60 11 -60 3 Z" fill="#46542b" />
      <path d="M-54 -10 C-20 -4 20 -4 54 -10 L54 -19 C20 -13 -20 -13 -54 -19 Z" fill="#2f3a1c" opacity="0.8" />
      <path d="M0 -44 l3.2 6.6 7.2 1 -5.2 5 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5 7.2 -1 z" fill="#f1e8b0" />
    </g>
  )
}

type Spot = { x: number; y: number }

function Lens({ at, rx, ry }: { at: Spot; rx: number; ry: number }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.y} rx={rx} ry={ry} fill="#1b1b2c" stroke="#0b0b14" strokeWidth={Math.max(2, rx * 0.12)} />
      <path
        d={`M${at.x - rx * 0.55} ${at.y - ry * 0.25} L${at.x - rx * 0.1} ${at.y - ry * 0.65}`}
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth={Math.max(2, rx * 0.16)}
        strokeLinecap="round"
      />
    </g>
  )
}

// Two eyes seen from the front: a lens over each, a bridge between them and
// short arms at the outer edges.
export function FrontSunglasses({ left, right, size, tilt = 0 }: { left: Spot; right: Spot; size: number; tilt?: number }) {
  const rx = size
  const ry = size * 0.8
  const mid = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 }
  const stroke = Math.max(2.5, size * 0.12)
  return (
    <g transform={`rotate(${tilt} ${mid.x} ${mid.y})`}>
      <path
        d={`M${left.x + rx * 0.85} ${left.y - ry * 0.25} Q${mid.x} ${mid.y - ry * 1.05} ${right.x - rx * 0.85} ${right.y - ry * 0.25}`}
        fill="none"
        stroke="#0b0b14"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path d={`M${left.x - rx * 0.95} ${left.y - ry * 0.2} l${-rx * 0.5} ${-ry * 0.1}`} stroke="#0b0b14" strokeWidth={stroke} strokeLinecap="round" />
      <path d={`M${right.x + rx * 0.95} ${right.y - ry * 0.2} l${rx * 0.5} ${-ry * 0.1}`} stroke="#0b0b14" strokeWidth={stroke} strokeLinecap="round" />
      <Lens at={left} rx={rx} ry={ry} />
      <Lens at={right} rx={rx} ry={ry} />
    </g>
  )
}

// One eye seen from the side: a lens over it (tilted like the eye) and an arm
// running back toward the ear.
export function SideSunglasses({ at, size, tilt = 0 }: { at: Spot; size: number; tilt?: number }) {
  const stroke = Math.max(2.5, size * 0.13)
  return (
    <g>
      <path
        d={`M${at.x - size * 0.8} ${at.y - size * 0.25} L${at.x - size * 2.3} ${at.y - size * 0.6}`}
        stroke="#0b0b14"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path d={`M${at.x + size * 0.85} ${at.y - size * 0.1} l${size * 0.3} ${size * 0.12}`} stroke="#0b0b14" strokeWidth={stroke} strokeLinecap="round" />
      <g transform={`rotate(${tilt} ${at.x} ${at.y})`}>
        <Lens at={at} rx={size} ry={size * 0.74} />
      </g>
    </g>
  )
}

const HATS: Record<string, () => ReactElement> = { sombrero: Sombrero, cap: Cap, helmet: Helmet }

// Draws an accessory over a pet's sprite. It fills the same square as the
// image (512 x 512 units), so it moves, scales and flips along with the pet.
export function PetAccessory({
  species,
  stage,
  accessory,
}: {
  species: string
  stage: number
  accessory: string | null | undefined
}) {
  const anchor = headAnchor(species, stage)
  if (!anchor || !accessory) return null

  const Hat = HATS[accessory]
  return (
    <svg viewBox="0 0 512 512" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      {Hat && (
        <g transform={`translate(${anchor.hat.x} ${anchor.hat.y}) rotate(${anchor.hat.tilt ?? 0}) scale(${anchor.hat.width / 100})`}>
          <Hat />
        </g>
      )}
      {accessory === 'sunglasses' &&
        (anchor.eyes.kind === 'front' ? (
          <FrontSunglasses left={anchor.eyes.left} right={anchor.eyes.right} size={anchor.eyes.size} tilt={anchor.eyes.tilt} />
        ) : (
          <SideSunglasses at={anchor.eyes.at} size={anchor.eyes.size} tilt={anchor.eyes.tilt} />
        ))}
    </svg>
  )
}

// A small picture of an accessory on its own, for the list in the customiser.
export function AccessoryIcon({ id }: { id: string }) {
  const Hat = HATS[id]
  return (
    <svg viewBox="-100 -75 200 100" className="h-10 w-16" aria-hidden>
      {Hat ? (
        <g transform="translate(0 12) scale(1)">
          <Hat />
        </g>
      ) : (
        <g transform="translate(0 -22) scale(0.9)">
          <FrontSunglasses left={{ x: -42, y: 0 }} right={{ x: 42, y: 0 }} size={32} />
        </g>
      )}
    </svg>
  )
}
