export const SCENE_WIDTH = 800
export const SCENE_HEIGHT = 560

export interface Point {
  x: number
  y: number
}

export const STANDING_AREA = { cx: 400, cy: 346, rx: 240, ry: 54 }

export function isOnIsland({ x, y }: Point): boolean {
  const { cx, cy, rx, ry } = STANDING_AREA
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0000001
}

export function clampToIsland(point: Point): Point {
  const { cx, cy, rx, ry } = STANDING_AREA
  const nx = (point.x - cx) / rx
  const ny = (point.y - cy) / ry
  const distance = Math.hypot(nx, ny)
  if (distance <= 1) return point
  return { x: cx + (nx / distance) * rx, y: cy + (ny / distance) * ry }
}

export function roundPoint({ x, y }: Point): Point {
  return { x: Math.round(x), y: Math.round(y) }
}

export function settle(point: Point): Point {
  let settled = roundPoint(clampToIsland(point))
  while (!isOnIsland(settled)) {
    settled = { x: settled.x + Math.sign(STANDING_AREA.cx - settled.x), y: settled.y + Math.sign(STANDING_AREA.cy - settled.y) }
  }
  return settled
}

export function defaultPosition(index: number, count: number): Point {
  const { cx, cy, rx, ry } = STANDING_AREA
  if (count <= 1) return { x: cx, y: cy }
  const across = (2 * index) / (count - 1) - 1
  return roundPoint({ x: cx + 0.86 * rx * across, y: cy + ry * (index % 2 === 0 ? -0.25 : 0.45) })
}
