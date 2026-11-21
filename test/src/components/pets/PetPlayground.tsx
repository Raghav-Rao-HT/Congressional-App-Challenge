import { Heart } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import {
  clampToFloor,
  EAT_SECONDS,
  stepPlay,
  type PlayScene,
  type PlayState,
  type Point,
} from '../../lib/petPlay'
import { createPlaySounds, playPetSound, stepIntervalFor, unlockAudio } from '../../lib/petSounds'
import type { Pet, PetLook } from '../../types/models'
import { PetSprite } from './PetSprite'
import { Pillow, VetSnack, YarnBall } from './PlayItems'

const START: PlayState = { pet: { x: 30, y: 84 }, facing: 1, mood: 'idle', eating: 0, hearts: 0 }
const NOTHING: PlayScene = { item: null, ball: { x: 72, y: 78 }, snack: null, pillow: null }

const sameState = (a: PlayState, b: PlayState) =>
  a.pet.x === b.pet.x && a.pet.y === b.pet.y && a.facing === b.facing && a.mood === b.mood && a.eating === b.eating && a.hearts === b.hearts

const at = ({ x, y }: Point, width: number, lift: number): CSSProperties => ({
  left: `${x}%`,
  top: `${y}%`,
  width: `${width}%`,
  transform: `translate(-50%, -${lift}%)`,
})

export function PetPlayground({ pet, look }: { pet: Pet; look: PetLook }) {
  const yardRef = useRef<HTMLDivElement>(null)
  const [scene, setSceneState] = useState<PlayScene>(NOTHING)
  const sceneRef = useRef<PlayScene>(NOTHING)
  const simRef = useRef<PlayState>(START)
  const [sim, setSim] = useState<PlayState>(START)
  const grab = useRef<Point | null>(null)
  const sounds = useMemo(
    () => createPlaySounds((event) => playPetSound(pet.species, look.color, event), stepIntervalFor(pet.species, look.color)),
    [pet.species, look.color],
  )

  function setScene(next: PlayScene) {
    sceneRef.current = next
    setSceneState(next)
  }

  useEffect(() => {
    let last = performance.now()
    let frame = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const result = stepPlay(simRef.current, sceneRef.current, dt)
      simRef.current = result.state
      sounds.tick(result.state.mood, dt, sceneRef.current.item)
      if (result.snackEaten) {
        sounds.finishedSnack()
        sceneRef.current = { ...sceneRef.current, item: null, snack: null }
        setSceneState(sceneRef.current)
      }
      setSim((previous) => (sameState(previous, result.state) ? previous : result.state))
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [sounds])

  const toggleYarn = () => {
    unlockAudio()
    if (scene.item !== 'yarn') sounds.itemOut('yarn')
    setScene(
      scene.item === 'yarn'
        ? NOTHING
        : { ...NOTHING, item: 'yarn', ball: { x: sim.pet.x < 50 ? 74 : 26, y: 78 } },
    )
  }
  const giveSnack = () => {
    if (scene.item === 'snack') return
    unlockAudio()
    sounds.itemOut('snack')
    setScene({ ...NOTHING, item: 'snack', snack: clampToFloor({ x: 25 + Math.random() * 50, y: 78 + Math.random() * 12 }) })
  }
  const togglePillow = () => {
    unlockAudio()
    setScene(
      scene.item === 'pillow' ? NOTHING : { ...NOTHING, item: 'pillow', pillow: { x: 38 + Math.random() * 24, y: 86 } },
    )
  }

  function yardPoint(event: PointerEvent): Point | null {
    const rect = yardRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }
  }
  function startBallDrag(event: PointerEvent<HTMLDivElement>) {
    const pointer = yardPoint(event)
    if (!pointer || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    grab.current = { x: sceneRef.current.ball.x - pointer.x, y: sceneRef.current.ball.y - pointer.y }
  }
  function moveBallDrag(event: PointerEvent<HTMLDivElement>) {
    const pointer = yardPoint(event)
    if (!grab.current || !pointer) return
    setScene({ ...sceneRef.current, ball: clampToFloor({ x: pointer.x + grab.current.x, y: pointer.y + grab.current.y }) })
  }
  function endBallDrag(event: PointerEvent<HTMLDivElement>) {
    if (!grab.current) return
    grab.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const asleep = sim.mood === 'asleep'
  const eatenFraction = Math.min(1, sim.eating / EAT_SECONDS)
  const status = {
    yarn: `Drag the yarn ball around the yard and watch ${pet.name} follow it.`,
    snack: sim.mood === 'eating' ? `${pet.name} is munching the vet snack.` : `${pet.name} spotted the vet snack.`,
    pillow: asleep ? `${pet.name} is fast asleep. Click ${pet.name} or put the pillow away to wake it.` : `${pet.name} is heading for the pillow.`,
  }[scene.item ?? 'yarn']

  return (
    <div>
      <div
        ref={yardRef}
        className="relative aspect-[5/4] touch-none select-none overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-info-soft to-violet-soft"
      >
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-[#e7dcfb] to-[#d3c1f2]" />
        <div aria-hidden className="absolute inset-x-0 bottom-[42%] h-px bg-white/60" />

        {scene.item === 'pillow' && scene.pillow && (
          <Pillow className="absolute z-[1] h-auto" style={at(scene.pillow, 36, 70)} />
        )}

        <div
          className={cn(
            'absolute z-[2]',
            asleep && 'cursor-pointer',
          )}
          style={at(sim.pet, 38, asleep ? 90 : 94)}
          onClick={() => asleep && setScene(NOTHING)}
          role={asleep ? 'button' : undefined}
          tabIndex={asleep ? 0 : undefined}
          aria-label={asleep ? `Wake ${pet.name}` : undefined}
          onKeyDown={(event) => asleep && (event.key === 'Enter' || event.key === ' ') && setScene(NOTHING)}
        >
          {!asleep && (
            <span
              aria-hidden
              className="absolute bottom-[2%] left-1/2 h-[6%] w-[60%] -translate-x-1/2 rounded-full bg-black/15 blur-[3px]"
            />
          )}
          <div className={cn(sim.mood === 'walking' && 'play-walk', sim.mood === 'eating' && 'play-munch', asleep && 'play-breathe')}>
            <PetSprite
              species={pet.species}
              stage={pet.stage}
              fill
              look={look}
              name={pet.name}
              asleep={asleep}
              className={cn('drop-shadow-md', sim.facing === -1 && '-scale-x-100')}
            />
          </div>
          {asleep && (
            <div aria-hidden className="pointer-events-none absolute -top-[6%] right-[8%] flex gap-0.5 text-lg font-extrabold text-info">
              <span className="play-zzz" style={{ animationDelay: '0s' }}>
                z
              </span>
              <span className="play-zzz" style={{ animationDelay: '0.5s' }}>
                z
              </span>
              <span className="play-zzz" style={{ animationDelay: '1s' }}>
                Z
              </span>
            </div>
          )}
          {sim.hearts > 0 && (
            <div aria-hidden className="pointer-events-none absolute -top-[4%] left-1/2 flex -translate-x-1/2 gap-1">
              {[0, 0.15, 0.3].map((delay) => (
                <Heart key={delay} className="play-heart size-5 fill-bad text-bad" style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          )}
        </div>

        {scene.item === 'snack' && scene.snack && (
          <VetSnack
            className="absolute z-[3] h-auto"
            style={{
              ...at(scene.snack, 19, 60),
              clipPath: sim.facing === 1 ? `inset(0 0 0 ${eatenFraction * 100}%)` : `inset(0 ${eatenFraction * 100}% 0 0)`,
            }}
          />
        )}

        {scene.item === 'yarn' && (
          <div
            className="absolute z-[3] cursor-grab touch-none active:cursor-grabbing"
            style={at(scene.ball, 16, 78)}
            onPointerDown={startBallDrag}
            onPointerMove={moveBallDrag}
            onPointerUp={endBallDrag}
            onPointerCancel={endBallDrag}
            role="img"
            aria-label="Yarn ball. Drag it around."
          >
            <YarnBall className="pointer-events-none h-auto w-full drop-shadow-md" style={{ transform: `rotate(${scene.ball.x * 7}deg)` }} />
          </div>
        )}
      </div>

      <p role="status" className="mt-3 min-h-10 text-sm text-muted">
        {scene.item ? status : `Pick an item below to play with ${pet.name}.`}
      </p>

      <div role="toolbar" aria-label="Items" className="mt-2 grid grid-cols-3 gap-3">
        <ItemButton label="Yarn ball" hint="Drag it, it follows" active={scene.item === 'yarn'} onClick={toggleYarn}>
          <YarnBall className="h-9 w-auto" />
        </ItemButton>
        <ItemButton label="Vet snack" hint="Treat time" active={scene.item === 'snack'} onClick={giveSnack}>
          <VetSnack className="h-9 w-auto" />
        </ItemButton>
        <ItemButton label="Pillow" hint="Nap time" active={scene.item === 'pillow'} onClick={togglePillow}>
          <Pillow className="h-9 w-auto" />
        </ItemButton>
      </div>
    </div>
  )
}

function ItemButton({
  label,
  hint,
  active,
  onClick,
  children,
}: {
  label: string
  hint: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition',
        active ? 'border-brand-500 bg-info-soft shadow-sm' : 'border-line bg-surface hover:border-brand-300',
      )}
    >
      {children}
      <span className="text-sm font-semibold text-fg">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>
  )
}
