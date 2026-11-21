import type { OrgLocation } from '../types/models'

export const NJ_BOUNDS: [[number, number], [number, number]] = [
  [38.78, -75.6],
  [41.37, -73.85],
]

export const NJ_CENTER: [number, number] = [40.15, -74.7]

export function isInNewJersey(location: OrgLocation): boolean {
  const [[south, west], [north, east]] = NJ_BOUNDS
  return location.lat >= south && location.lat <= north && location.lng >= west && location.lng <= east
}
