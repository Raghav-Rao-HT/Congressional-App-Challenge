import type { ReactElement } from 'react'
import { headAnchor } from '../../lib/petAccessories'
import { Bat, Diamond, Fan, Guitar, IceCream, Pompom, RubberDuck, Trophy } from './HeldItems'

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

function Beanie() {
  return (
    <g>
      <path d="M-47 4 C-50 -30 -28 -52 0 -52 C28 -52 50 -30 47 4 Z" fill="#2bb5a0" />
      <path d="M-47 4 C-50 -30 -28 -52 0 -52 C-14 -40 -18 -18 -16 4 Z" fill="#1d8c7b" opacity="0.55" />
      <path d="M9 -51 C30 -44 46 -26 46 -2 L36 -2 C36 -24 26 -40 9 -51 Z" fill="#5fd3c0" opacity="0.6" />
      <g fill="none" stroke="#1d8c7b" strokeOpacity="0.4" strokeWidth="2.2" strokeLinecap="round">
        <path d="M-28 -12 C-30 -28 -22 -40 -10 -47" />
        <path d="M-10 -14 C-12 -30 -8 -42 0 -49" />
        <path d="M10 -14 C12 -30 12 -42 8 -49" />
        <path d="M28 -12 C32 -26 28 -38 20 -45" />
      </g>
      <rect x="-52" y="-16" width="104" height="21" rx="8" fill="#f6f1e6" />
      <rect x="-52" y="-16" width="104" height="7" rx="3.5" fill="#fff" opacity="0.7" />
      <g stroke="#d6c9b0" strokeWidth="2.4" strokeLinecap="round">
        {[-42, -30, -18, -6, 6, 18, 30, 42].map((x) => (
          <path key={x} d={`M${x} -9 L${x} 2`} />
        ))}
      </g>
      <g>
        <circle cx="0" cy="-60" r="13" fill="#ffd166" />
        <circle cx="-8" cy="-64" r="7" fill="#ffe08f" />
        <circle cx="8" cy="-56" r="6.5" fill="#f2b84b" />
        <circle cx="-4" cy="-66" r="3" fill="#fff3c9" opacity="0.8" />
      </g>
    </g>
  )
}

function AstronautHelmet() {
  return (
    <g>
      <ellipse cx="0" cy="22" rx="68" ry="72" fill="#bfe3ff" fillOpacity="0.2" />
      <ellipse cx="0" cy="22" rx="68" ry="72" fill="none" stroke="#f4f7fb" strokeWidth="8" />
      <ellipse cx="0" cy="22" rx="64" ry="68" fill="none" stroke="#8aa5c4" strokeOpacity="0.45" strokeWidth="2" />
      <path d="M-46 -4 C-40 -24 -24 -36 -4 -41" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
      <circle cx="-52" cy="8" r="3.5" fill="#fff" opacity="0.85" />
      <path d="M-64 66 C-44 88 44 88 64 66 L70 80 C46 104 -46 104 -70 80 Z" fill="#e6ecf5" />
      <path d="M-70 80 C-46 104 46 104 70 80 L68 86 C44 110 -44 110 -68 86 Z" fill="#aab6c8" />
      <path d="M-64 66 C-44 88 44 88 64 66 L66 72 C44 94 -44 94 -66 72 Z" fill="#ff6b3d" />
      <circle cx="-72" cy="40" r="6.5" fill="#ff6b3d" stroke="#f4f7fb" strokeWidth="3" />
      <circle cx="72" cy="40" r="6.5" fill="#38c172" stroke="#f4f7fb" strokeWidth="3" />
    </g>
  )
}

function HairTop() {
  return (
    <g>
      <path d="M-50 6 C-54 -34 -26 -56 4 -54 C34 -52 54 -28 49 8 C44 -8 34 -20 20 -24 C8 -8 -12 -4 -28 8 C-34 -2 -42 0 -50 6 Z" fill="#f3c35a" />
      <path d="M-50 6 C-54 -34 -26 -56 4 -54 C-20 -44 -34 -26 -28 8 C-34 -2 -42 0 -50 6 Z" fill="#d49a2c" opacity="0.7" />
      <path d="M-30 -36 C-14 -48 10 -50 28 -42" fill="none" stroke="#ffe39a" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <path d="M20 -24 C8 -8 -12 -4 -28 8" fill="none" stroke="#d49a2c" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
    </g>
  )
}

function HairBack() {
  return (
    <g>
      <path
        d="M0 -50 C-46 -50 -74 -22 -74 26 C-74 62 -84 92 -72 114 C-58 106 -50 114 -38 106 C-30 114 -18 104 -8 110 C-2 90 22 80 28 56 C42 22 42 -42 0 -50 Z"
        fill="#e0a838"
      />
      <path d="M-74 26 C-74 62 -84 92 -72 114 C-58 106 -50 114 -38 106 C-52 82 -60 56 -58 30 Z" fill="#c68a1f" opacity="0.65" />
      <g fill="none" stroke="#ffe39a" strokeWidth="4" strokeLinecap="round" opacity="0.75">
        <path d="M-60 20 C-66 50 -70 70 -62 92" />
        <path d="M-44 24 C-48 52 -52 76 -46 98" />
      </g>
    </g>
  )
}

function Hair() {
  return <HairTop />
}

function Antlers() {
  const antler = (
    <g fill="none" strokeLinecap="round">
      <g stroke="#6f4524" strokeWidth="9">
        <path d="M-22 4 C-28 -24 -32 -48 -42 -78" />
        <path d="M-29 -28 C-40 -32 -50 -38 -56 -52" />
        <path d="M-35 -52 C-26 -60 -22 -68 -22 -80" />
        <path d="M-40 -70 C-50 -72 -58 -80 -60 -92" />
      </g>
      <g stroke="#c08a52" strokeWidth="4">
        <path d="M-22 4 C-28 -24 -32 -48 -42 -78" />
        <path d="M-29 -28 C-40 -32 -50 -38 -56 -52" />
        <path d="M-35 -52 C-26 -60 -22 -68 -22 -80" />
        <path d="M-40 -70 C-50 -72 -58 -80 -60 -92" />
      </g>
    </g>
  )
  return (
    <g transform="scale(0.9)">
      {antler}
      <g transform="scale(-1 1)">{antler}</g>
      <ellipse cx="-22" cy="4" rx="9" ry="6" fill="#6f4524" />
      <ellipse cx="22" cy="4" rx="9" ry="6" fill="#6f4524" />
    </g>
  )
}

function Crown() {
  return (
    <g>
      <path d="M-38 4 L-43 -40 L-21 -19 L0 -52 L21 -19 L43 -40 L38 4 Z" fill="#f6c43c" />
      <path d="M-38 4 L-43 -40 L-21 -19 L-12 4 Z" fill="#d79a1b" opacity="0.6" />
      <path d="M12 4 L21 -19 L43 -40 L38 4 Z" fill="#ffe178" opacity="0.5" />
      <rect x="-39" y="-12" width="78" height="16" rx="5" fill="#e8a91f" />
      <rect x="-39" y="-12" width="78" height="5" rx="2.5" fill="#ffe178" opacity="0.7" />
      <circle cx="-22" cy="-4" r="5.5" fill="#3b82f6" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      <circle cx="0" cy="-4" r="6.5" fill="#e0314b" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      <circle cx="22" cy="-4" r="5.5" fill="#22c55e" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      <g fill="#fff" stroke="#e8a91f" strokeWidth="1.5">
        <circle cx="-43" cy="-41" r="4.6" />
        <circle cx="0" cy="-53" r="5" />
        <circle cx="43" cy="-41" r="4.6" />
      </g>
      <path d="M-30 -22 L-24 -34" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  )
}

type Art = () => ReactElement

const HATS: Record<string, Art | undefined> = {
  sombrero: Sombrero,
  cap: Cap,
  helmet: Helmet,
  beanie: Beanie,
  astronaut: AstronautHelmet,
  hair: Hair,
  antlers: Antlers,
  crown: Crown,
}

const HELD: Record<string, Art | undefined> = {
  icecream: IceCream,
  fan: Fan,
  pompom: Pompom,
  bat: Bat,
  guitar: Guitar,
  duck: RubberDuck,
  trophy: Trophy,
  diamond: Diamond,
}

const BEHIND: Record<string, Art | undefined> = { hair: HairBack }

export function PetAccessory({
  species,
  stage,
  accessory,
  held,
  layer = 'front',
}: {
  species: string
  stage: number
  accessory: string | null | undefined
  held?: string | null
  layer?: 'back' | 'front'
}) {
  const anchor = headAnchor(species, stage)
  if (!anchor) return null

  if (layer === 'back') {
    const Behind = accessory ? BEHIND[accessory] : undefined
    if (!Behind) return null
    return (
      <svg viewBox="0 0 512 512" className="pointer-events-none absolute inset-0 z-0 size-full" aria-hidden>
        <g transform={`translate(${anchor.hat.x} ${anchor.hat.y}) rotate(${anchor.hat.tilt ?? 0}) scale(${anchor.hat.width / 100})`}>
          <Behind />
        </g>
      </svg>
    )
  }

  const Hat = accessory ? HATS[accessory] : undefined
  const Held = held ? HELD[held] : undefined
  if (!Hat && !Held && accessory !== 'sunglasses') return null

  const { hand } = anchor
  const heldScale = hand.scale
  return (
    <svg viewBox="0 0 512 512" className="pointer-events-none absolute inset-0 z-[3] size-full" aria-hidden>
      {Held && (
        <g transform={`translate(${hand.x} ${hand.y}) rotate(${hand.tilt ?? 0}) scale(${heldScale})`}>
          <Held />
        </g>
      )}
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

const ICON_BOX: Record<string, string> = {
  sombrero: '-100 -75 200 100',
  cap: '-100 -75 200 100',
  helmet: '-100 -75 200 100',
  beanie: '-70 -85 140 100',
  astronaut: '-85 -55 170 165',
  hair: '-90 -65 180 235',
  antlers: '-75 -100 150 120',
  crown: '-65 -65 130 80',
  icecream: '-45 -115 90 150',
  fan: '-78 -66 156 126',
  pompom: '-70 -80 140 140',
  bat: '-30 -100 60 150',
  guitar: '-45 -130 90 195',
  duck: '-62 -85 124 100',
  trophy: '-52 -90 104 115',
  diamond: '-56 -90 112 125',
}

export function AccessoryIcon({ id }: { id: string }) {
  const Hat = HATS[id]
  const Held = HELD[id]
  const Behind = BEHIND[id]
  return (
    <svg viewBox={ICON_BOX[id] ?? '-100 -75 200 100'} className="h-14 w-20" aria-hidden>
      {Held ? (
        <Held />
      ) : Hat ? (
        <>
          {Behind && <Behind />}
          <Hat />
        </>
      ) : (
        <g transform="translate(0 -22) scale(0.9)">
          <FrontSunglasses left={{ x: -42, y: 0 }} right={{ x: 42, y: 0 }} size={32} />
        </g>
      )}
    </svg>
  )
}
