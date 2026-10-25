// The island scene is drawn in an 800 x 560 space that scales with the screen.
// A pet's position is where its feet touch the ground, in that space.
export const SCENE_WIDTH = 800
export const SCENE_HEIGHT = 560

export interface Point {
  x: number
  y: number
}

// Where a pet's feet may be: an ellipse that sits inside the grass top (which
// is an ellipse 300 wide and 90 tall around (400, 318)), pulled in from the
// edge so the pet itself stays on the island. Dragging stops at its border.
export const STANDING_AREA = { cx: 400, cy: 346, rx: 240, ry: 54 }

export function isOnIsland({ x, y }: Point): boolean {
  const { cx, cy, rx, ry } = STANDING_AREA
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0000001
}

// The closest spot on the island: a point already on it is unchanged, one
// outside it slides to the border along the line to the island's centre.
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

// A whole-number spot that is certainly on the island: what gets saved when a
// pet is dropped. Rounding a point on the border can nudge it fractionally
// outside, so step it back toward the centre until it is inside again.
export function settle(point: Point): Point {
  let settled = roundPoint(clampToIsland(point))
  while (!isOnIsland(settled)) {
    settled = { x: settled.x + Math.sign(STANDING_AREA.cx - settled.x), y: settled.y + Math.sign(STANDING_AREA.cy - settled.y) }
  }
  return settled
}

// Where a pet stands until its owner moves it: pets spread across the island
// in a loose zigzag (even ones further back, odd ones forward), so neighbours
// overlap a little instead of lining up. Every default is inside the island.
export function defaultPosition(index: number, count: number): Point {
  const { cx, cy, rx, ry } = STANDING_AREA
  if (count <= 1) return { x: cx, y: cy }
  const across = (2 * index) / (count - 1) - 1 // -1 (left) .. 1 (right)
  return roundPoint({ x: cx + 0.86 * rx * across, y: cy + ry * (index % 2 === 0 ? -0.25 : 0.45) })
}
