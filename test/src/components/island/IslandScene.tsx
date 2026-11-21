import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../../lib/cn'
import { SCENES, type SceneId } from '../../lib/islandScenes'
import {
  clampToIsland,
  defaultPosition,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  settle,
  type Point,
} from '../../lib/islandLayout'
import { petStageLabel } from '../../lib/petVisuals'
import type { Pet, PetLook } from '../../types/models'
import { PetSprite } from '../pets/PetSprite'

function Cloud({ x, y, scale = 1, delay = 0 }: { x: number; y: number; scale?: number; delay?: number }) {
  return (
    <g className="island-drift" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx="0" cy="0" rx="64" ry="20" />
        <ellipse cx="-28" cy="-14" rx="30" ry="22" />
        <ellipse cx="16" cy="-22" rx="38" ry="28" />
      </g>
    </g>
  )
}

function SkyBackdrop() {
  return (
    <>
      <defs>
        <radialGradient id="is-sun-glow">
          <stop offset="0" stopColor="#fff8cc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff8cc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="665" cy="92" r="130" fill="url(#is-sun-glow)" />
      <circle cx="665" cy="92" r="42" fill="#fff4b8" />
      <g fill="#fff" opacity="0.92">
        <Cloud x={120} y={120} scale={1.1} delay={-4} />
        <Cloud x={420} y={70} scale={0.8} delay={-9} />
        <Cloud x={690} y={250} scale={1} delay={-2} />
        <Cloud x={70} y={330} scale={0.9} delay={-11} />
      </g>
    </>
  )
}

const STARS = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 173 + 41) % 800,
  y: (i * 97 + 23) % 440,
  r: 0.9 + (i % 3) * 0.5,
  delay: (i % 7) * -0.45,
}))

function SpaceBackdrop() {
  return (
    <>
      <defs>
        <radialGradient id="is-nebula-pink">
          <stop offset="0" stopColor="#ff7ad9" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ff7ad9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="is-nebula-blue">
          <stop offset="0" stopColor="#6ea8ff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#6ea8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="is-planet" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffc98a" />
          <stop offset="1" stopColor="#d9488f" />
        </radialGradient>
      </defs>
      <ellipse cx="630" cy="190" rx="300" ry="170" fill="url(#is-nebula-pink)" />
      <ellipse cx="150" cy="330" rx="280" ry="150" fill="url(#is-nebula-blue)" />
      {STARS.map((star, i) => (
        <circle
          key={i}
          className="island-twinkle"
          style={{ animationDelay: `${star.delay}s` }}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="#fff"
        />
      ))}
      <g transform="translate(130 125) rotate(-18)">
        <ellipse cx="0" cy="0" rx="82" ry="16" fill="none" stroke="#f3c6ff" strokeOpacity="0.7" strokeWidth="6" />
        <circle cx="0" cy="0" r="46" fill="url(#is-planet)" />
        <path d="M-82 0 A82 16 0 0 0 82 0" fill="none" stroke="#f3c6ff" strokeOpacity="0.9" strokeWidth="6" />
      </g>
      <circle cx="700" cy="105" r="20" fill="#e7defc" />
      <circle cx="693" cy="99" r="4" fill="#cdbff0" />
      <circle cx="707" cy="112" r="3" fill="#cdbff0" />
    </>
  )
}

function wavePath(y: number) {
  return `M-60 ${y} q 30 -12 60 0${' t 60 0'.repeat(15)}`
}

function OceanBackdrop() {
  return (
    <>
      <defs>
        <linearGradient id="is-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fc3e8" />
          <stop offset="0.5" stopColor="#1b86c4" />
          <stop offset="1" stopColor="#0a4a82" />
        </linearGradient>
      </defs>
      <circle cx="738" cy="298" r="46" fill="#fff3b0" opacity="0.95" />
      <g fill="#fff" opacity="0.85">
        <Cloud x={150} y={110} scale={1} delay={-5} />
        <Cloud x={520} y={70} scale={0.75} delay={-10} />
        <Cloud x={720} y={180} scale={0.7} delay={-1} />
      </g>
      <rect x="0" y="300" width="800" height="260" fill="url(#is-sea)" />
      <path d="M0 300 H800" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
      {[336, 378, 426, 480, 532].map((y, i) => (
        <g key={y} className="island-drift" style={{ animationDelay: `${i * -2.6}s` }}>
          <path d={wavePath(y)} fill="none" stroke="#fff" strokeOpacity={0.42 - i * 0.05} strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <g fill="#fff" opacity="0.4">
        <ellipse cx="738" cy="320" rx="38" ry="3" />
        <ellipse cx="734" cy="344" rx="26" ry="2.5" />
        <ellipse cx="742" cy="370" rx="16" ry="2" />
      </g>
    </>
  )
}

function Backdrop({ scene }: { scene: SceneId }) {
  return (
    <svg viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} className="absolute inset-0 size-full" aria-hidden>
      {scene === 'sky' && <SkyBackdrop />}
      {scene === 'space' && <SpaceBackdrop />}
      {scene === 'ocean' && <OceanBackdrop />}
    </svg>
  )
}

const ROCK_PATH =
  'M100 330 C112 405 196 440 252 468 C296 490 330 508 362 536 C380 552 420 552 438 536 C470 508 504 490 548 468 C604 440 688 405 700 330 Z'

const FLOWERS = [
  { x: 205, y: 352, c: '#fff' },
  { x: 232, y: 372, c: '#ffd43b' },
  { x: 330, y: 400, c: '#ffa8d1' },
  { x: 470, y: 404, c: '#fff' },
  { x: 560, y: 380, c: '#ffd43b' },
  { x: 610, y: 346, c: '#ffa8d1' },
  { x: 300, y: 300, c: '#ffd43b' },
  { x: 508, y: 306, c: '#fff' },
]

function IslandArt() {
  return (
    <svg viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <clipPath id="is-rock-clip">
          <path d={ROCK_PATH} />
        </clipPath>
        <linearGradient id="is-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a39180" />
          <stop offset="1" stopColor="#5c5047" />
        </linearGradient>
        <radialGradient id="is-grass" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#8be05a" />
          <stop offset="1" stopColor="#46b043" />
        </radialGradient>
        <g id="is-tree-round">
          <rect x="-6" y="-46" width="12" height="46" rx="3" fill="#7a4e2d" />
          <circle cx="0" cy="-78" r="34" fill="#2f9e44" />
          <circle cx="-22" cy="-62" r="24" fill="#2b8a3e" />
          <circle cx="22" cy="-62" r="24" fill="#37b24d" />
          <circle cx="-8" cy="-92" r="16" fill="#69db7c" opacity="0.65" />
        </g>
        <g id="is-tree-pine">
          <rect x="-5" y="-48" width="10" height="48" rx="2" fill="#7a4e2d" />
          <path d="M0 -140 L34 -84 L14 -84 L42 -44 L-42 -44 L-14 -84 L-34 -84 Z" fill="#2b8a3e" />
          <path d="M0 -140 L22 -100 L-4 -96 Z" fill="#51cf66" opacity="0.55" />
        </g>
      </defs>

      <path d="M150 470 l22 -14 l24 10 l-8 22 l-30 4 z" fill="#7a6a5b" />
      <path d="M640 482 l18 -12 l22 8 l-6 18 l-26 4 z" fill="#6b5d50" />
      <path d="M560 520 l12 -8 l14 6 l-4 12 l-18 2 z" fill="#7a6a5b" />

      <path d={ROCK_PATH} fill="url(#is-rock)" />
      <path
        d="M700 330 L760 330 L760 580 L400 580 L400 549 C470 520 560 470 620 410 C660 370 690 350 700 330 Z"
        fill="#000"
        opacity="0.16"
        clipPath="url(#is-rock-clip)"
      />
      <g fill="none" stroke="#4a3f36" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M250 420 l14 24 l-8 20 l16 26" />
        <path d="M470 430 l-10 26 l12 22" />
        <path d="M350 456 l8 20 l-6 16" />
      </g>

      <ellipse cx="400" cy="336" rx="300" ry="92" fill="#6d4b2e" />
      <ellipse cx="400" cy="326" rx="300" ry="92" fill="#3f9f3e" />
      <ellipse cx="400" cy="318" rx="300" ry="90" fill="url(#is-grass)" />

      {FLOWERS.map((flower, i) => (
        <g key={i}>
          <circle cx={flower.x} cy={flower.y} r="5" fill={flower.c} />
          <circle cx={flower.x} cy={flower.y} r="2" fill="#f59f00" />
        </g>
      ))}

      <use href="#is-tree-pine" transform="translate(212 282) scale(1)" />
      <use href="#is-tree-round" transform="translate(142 300) scale(1.05)" />
      <use href="#is-tree-pine" transform="translate(594 280) scale(1.1)" />
      <use href="#is-tree-round" transform="translate(664 302) scale(0.95)" />
    </svg>
  )
}

const KEY_STEP = 10

type Drag = { species: string; point: Point; grab: Point; origin: Point; moved: boolean }

const DRAG_THRESHOLD = 4

export function IslandScene({
  scene,
  pets,
  positions = {},
  looks = {},
  onMovePet,
  onClickPet,
}: {
  scene: SceneId
  pets: Pet[]
  positions?: Record<string, Point>
  looks?: Record<string, PetLook>
  onMovePet?: (species: string, point: Point) => void
  onClickPet?: (species: string) => void
}) {
  const floaterRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [hopping, setHopping] = useState<string | null>(null)
  const dragRef = useRef<Drag | null>(null)
  function updateDrag(next: Drag | null) {
    dragRef.current = next
    setDrag(next)
  }
  const width = pets.length > 4 ? 14 : 19
  const background = SCENES.find((s) => s.id === scene)?.background

  function scenePoint(event: PointerEvent): Point | null {
    const frame = floaterRef.current?.getBoundingClientRect()
    if (!frame || frame.width === 0) return null
    return {
      x: ((event.clientX - frame.left) / frame.width) * SCENE_WIDTH,
      y: ((event.clientY - frame.top) / frame.height) * SCENE_HEIGHT,
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>, species: string, at: Point) {
    const pointer = scenePoint(event)
    if (!(onMovePet || onClickPet) || !pointer || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    updateDrag({ species, point: at, grab: { x: at.x - pointer.x, y: at.y - pointer.y }, origin: at, moved: false })
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>, species: string) {
    const current = dragRef.current
    const pointer = scenePoint(event)
    if (!onMovePet || !current || current.species !== species || !pointer) return
    const point = clampToIsland({ x: pointer.x + current.grab.x, y: pointer.y + current.grab.y })
    const moved = current.moved || Math.hypot(point.x - current.origin.x, point.y - current.origin.y) > DRAG_THRESHOLD
    updateDrag({ ...current, point: moved ? point : current.origin, moved })
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, species: string) {
    const current = dragRef.current
    if (!current || current.species !== species) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    updateDrag(null)
    if (event.type !== 'pointerup') return
    if (current.moved) onMovePet?.(species, settle(current.point))
    else click(species)
  }

  function click(species: string) {
    setHopping(species)
    onClickPet?.(species)
  }

  function nudge(event: KeyboardEvent<HTMLDivElement>, species: string, at: Point) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      click(species)
      return
    }
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!onMovePet || !step) return
    event.preventDefault()
    onMovePet(species, settle({ x: at.x + step[0] * KEY_STEP, y: at.y + step[1] * KEY_STEP }))
  }

  return (
    <div
      className="relative aspect-[10/7] w-full overflow-hidden rounded-card border border-line shadow-card"
      style={{ background }}
    >
      <Backdrop scene={scene} />
      <div ref={floaterRef} className="island-float absolute inset-0">
        <IslandArt />
        {pets.map((pet, index) => {
          const saved = positions[pet.species] ?? defaultPosition(index, pets.length)
          const dragging = drag?.species === pet.species
          const at = dragging ? drag.point : saved
          return (
            <div
              key={pet.species}
              className={cn(
                'absolute touch-none select-none',
                (onMovePet || onClickPet) && (dragging ? 'cursor-grabbing' : 'cursor-pointer'),
                onMovePet && !dragging && 'cursor-grab',
              )}
              style={{
                left: `${(at.x / SCENE_WIDTH) * 100}%`,
                top: `${(at.y / SCENE_HEIGHT) * 100}%`,
                width: `${width}%`,
                transform: 'translate(-50%, -96%)',
                zIndex: dragging ? 1000 : Math.round(at.y),
              }}
              title={`${pet.name} (${petStageLabel(pet.stage)}, ${pet.xp}h)`}
              {...((onMovePet || onClickPet) && {
                role: 'button',
                tabIndex: 0,
                'aria-label': `${pet.name}. Click to hear it${onMovePet ? ', drag to move it around the island, or use the arrow keys' : ''}.`,
                onPointerDown: (event: PointerEvent<HTMLDivElement>) => startDrag(event, pet.species, saved),
                onPointerMove: (event: PointerEvent<HTMLDivElement>) => moveDrag(event, pet.species),
                onPointerUp: (event: PointerEvent<HTMLDivElement>) => endDrag(event, pet.species),
                onPointerCancel: (event: PointerEvent<HTMLDivElement>) => endDrag(event, pet.species),
                onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => nudge(event, pet.species, saved),
              })}
            >
              <span
                aria-hidden
                className="absolute bottom-[1%] left-1/2 h-[6%] w-[62%] -translate-x-1/2 rounded-full bg-black/20 blur-[3px]"
              />
              <div
                className={cn('island-bob', dragging && 'scale-105')}
                style={{ animationDelay: `${index * -0.7}s`, animationPlayState: dragging ? 'paused' : 'running' }}
              >
                <div
                  className={cn('size-full', hopping === pet.species && 'island-hop')}
                  onAnimationEnd={() => setHopping(null)}
                >
                  <PetSprite
                    species={pet.species}
                    stage={pet.stage}
                    fill
                    look={looks[pet.species]}
                    name={pet.name}
                    className={cn('pointer-events-none size-full drop-shadow-md', at.x > SCENE_WIDTH / 2 && '-scale-x-100')}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
