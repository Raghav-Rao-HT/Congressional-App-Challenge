export interface Point {
  x: number
  y: number
}

export type PlayItem = 'yarn' | 'snack' | 'pillow'
export type Mood = 'idle' | 'walking' | 'eating' | 'asleep'

export interface PlayState {
  pet: Point
  facing: 1 | -1
  mood: Mood
  eating: number
  hearts: number
}

export interface PlayScene {
  item: PlayItem | null
  ball: Point
  snack: Point | null
  pillow: Point | null
}

export const FLOOR = { left: 8, right: 92, top: 62, bottom: 94 }

export const SPEED = 38
export const EAT_SECONDS = 1.8
export const HEARTS_SECONDS = 1.6
export const BALL_GAP = 12
export const SNACK_GAP = 9

export function clampToFloor({ x, y }: Point): Point {
  return {
    x: Math.min(FLOOR.right, Math.max(FLOOR.left, x)),
    y: Math.min(FLOOR.bottom, Math.max(FLOOR.top, y)),
  }
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function stepToward(from: Point, to: Point, maxStep: number): Point {
  const gap = distance(from, to)
  if (gap <= maxStep) return { ...to }
  return { x: from.x + ((to.x - from.x) / gap) * maxStep, y: from.y + ((to.y - from.y) / gap) * maxStep }
}

function spotBeside(pet: Point, thing: Point, gap: number): Point {
  const side = pet.x >= thing.x ? 1 : -1
  return clampToFloor({ x: thing.x + side * gap, y: thing.y })
}

export function stepPlay(
  state: PlayState,
  scene: PlayScene,
  dt: number,
): { state: PlayState; snackEaten: boolean } {
  let { facing, mood, eating, hearts } = state
  let pet = state.pet
  hearts = Math.max(0, hearts - dt)
  let snackEaten = false

  if (mood === 'asleep') {
    if (scene.item === 'pillow' && scene.pillow) return { state: { ...state, hearts }, snackEaten }
    mood = 'idle'
  }

  if (mood === 'eating') {
    if (scene.item === 'snack' && scene.snack) {
      eating += dt
      if (eating >= EAT_SECONDS) {
        snackEaten = true
        mood = 'idle'
        eating = 0
        hearts = HEARTS_SECONDS
      }
      return { state: { pet, facing, mood, eating, hearts }, snackEaten }
    }
    mood = 'idle'
    eating = 0
  }

  let goal: Point | null = null
  let lookAt: Point | null = null
  if (scene.item === 'yarn') {
    goal = spotBeside(pet, scene.ball, BALL_GAP)
    lookAt = scene.ball
  } else if (scene.item === 'snack' && scene.snack) {
    goal = spotBeside(pet, scene.snack, SNACK_GAP)
    lookAt = scene.snack
  } else if (scene.item === 'pillow' && scene.pillow) {
    goal = scene.pillow
  }

  if (!goal) return { state: { pet, facing, mood: 'idle', eating: 0, hearts }, snackEaten }

  const next = stepToward(pet, goal, SPEED * dt)
  const arrived = distance(next, goal) < 0.05
  const heading = goal.x - pet.x
  if (Math.abs(heading) > 0.3) facing = heading > 0 ? 1 : -1
  pet = next

  if (!arrived) return { state: { pet, facing, mood: 'walking', eating: 0, hearts }, snackEaten }

  if (lookAt) facing = lookAt.x >= pet.x ? 1 : -1
  if (scene.item === 'snack') return { state: { pet, facing, mood: 'eating', eating: 0, hearts }, snackEaten }
  if (scene.item === 'pillow') return { state: { pet, facing, mood: 'asleep', eating: 0, hearts }, snackEaten }
  return { state: { pet, facing, mood: 'idle', eating: 0, hearts }, snackEaten }
}
