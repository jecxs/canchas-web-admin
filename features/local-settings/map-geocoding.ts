export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export type GeocodeFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    full_address?: string
    place_formatted?: string
    name?: string
  }
}

export function readGeocodeAddress(feature?: GeocodeFeature) {
  const address = feature?.properties.full_address ?? feature?.properties.place_formatted
  return address?.trim().slice(0, 250)
}

export async function reverseGeocodeAddress(lng: number, lat: number): Promise<string | null> {
  if (!MAPBOX_ACCESS_TOKEN) return null
  try {
    const params = new URLSearchParams({
      longitude: String(lng),
      latitude: String(lat),
      access_token: MAPBOX_ACCESS_TOKEN,
      country: 'pe',
      language: 'es',
    })
    const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`)
    if (!response.ok) return null
    const data = (await response.json()) as { features?: GeocodeFeature[] }
    return readGeocodeAddress(data.features?.[0]) ?? null
  } catch {
    return null
  }
}
