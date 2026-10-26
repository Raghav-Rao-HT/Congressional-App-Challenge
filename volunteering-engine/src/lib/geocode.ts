import type { OrgAddress, OrgLocation } from '../types/models'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export class AddressNotFoundError extends Error {
  constructor() {
    super('We could not find that address. Check the street, city, state and ZIP.')
    this.name = 'AddressNotFoundError'
  }
}

export async function geocodeAddress(address: OrgAddress): Promise<OrgLocation> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'us',
    street: address.street,
    city: address.city,
    state: address.state,
    postalcode: address.zip,
  })
  const response = await fetch(`${NOMINATIM_URL}?${params}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('The address lookup service is unavailable. Try again in a moment.')

  const results = (await response.json()) as { lat: string; lon: string }[]
  if (results.length === 0) throw new AddressNotFoundError()

  return { lat: Number(results[0].lat), lng: Number(results[0].lon) }
}
