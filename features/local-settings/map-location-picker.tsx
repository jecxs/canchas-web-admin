'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon, Search01Icon } from '@hugeicons/core-free-icons'
import type { Map as MapboxMap, Marker } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditGuard } from '@/components/dashboard/edit-guard'
import { cn } from '@/lib/utils'

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
const DEFAULT_CENTER = { longitude: -77.0428, latitude: -12.0464 }
const MARKER_COLOR = '#f97316'

type MapboxModule = typeof import('mapbox-gl')['default']

export type LocationPatch = {
  latitude?: number
  longitude?: number
  address?: string
}

type GeocodeFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    full_address?: string
    place_formatted?: string
    name?: string
  }
}

function readAddress(feature?: GeocodeFeature) {
  const address = feature?.properties.full_address ?? feature?.properties.place_formatted
  return address?.trim().slice(0, 250)
}

export function MapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: {
  latitude: number | null
  longitude: number | null
  onLocationChange: (patch: LocationPatch) => void
}) {
  const guard = useEditGuard()
  const interactive = guard ? guard.editing : true

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const mapboxRef = useRef<MapboxModule | null>(null)
  const onChangeRef = useRef(onLocationChange)
  const interactiveRef = useRef(interactive)

  const initial = useRef({ latitude, longitude })
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    onChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    interactiveRef.current = interactive
    const map = mapRef.current
    if (!map) return
    const methods = [map.dragPan, map.scrollZoom, map.boxZoom, map.doubleClickZoom, map.touchZoomRotate, map.keyboard]
    for (const method of methods) {
      if (interactive) method.enable()
      else method.disable()
    }
    markerRef.current?.setDraggable(interactive)
    map.getCanvas().style.cursor = interactive ? '' : 'default'
  }, [interactive, ready])

  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    if (!ACCESS_TOKEN) return
    try {
      const params = new URLSearchParams({
        longitude: String(lng),
        latitude: String(lat),
        access_token: ACCESS_TOKEN,
        country: 'pe',
        language: 'es',
      })
      const response = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?${params.toString()}`)
      if (!response.ok) return
      const data = (await response.json()) as { features?: GeocodeFeature[] }
      const address = readAddress(data.features?.[0])
      if (address) onChangeRef.current({ address })
    } catch {
      // La dirección es un extra: si falla, las coordenadas ya quedaron guardadas.
    }
  }, [])

  const placeMarker = useCallback(
    (map: MapboxMap, mapboxgl: MapboxModule, lng: number, lat: number) => {
      if (!markerRef.current) {
        const marker = new mapboxgl.Marker({ color: MARKER_COLOR, draggable: interactiveRef.current })
          .setLngLat([lng, lat])
          .addTo(map)
        marker.on('dragend', () => {
          const position = marker.getLngLat()
          onChangeRef.current({ latitude: position.lat, longitude: position.lng })
          void reverseGeocode(position.lng, position.lat)
        })
        markerRef.current = marker
        return
      }
      markerRef.current.setLngLat([lng, lat])
    },
    [reverseGeocode],
  )

  useEffect(() => {
    if (!ACCESS_TOKEN || !containerRef.current) return
    let cancelled = false

    void (async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default
        if (cancelled || !containerRef.current) return
        if (!mapboxgl.supported()) {
          setLoadError('Tu navegador no soporta WebGL, necesario para el mapa.')
          return
        }
        mapboxgl.accessToken = ACCESS_TOKEN
        mapboxRef.current = mapboxgl

        const startLat = initial.current.latitude ?? DEFAULT_CENTER.latitude
        const startLng = initial.current.longitude ?? DEFAULT_CENTER.longitude
        const hasPoint =
          typeof initial.current.latitude === 'number' && typeof initial.current.longitude === 'number'

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [startLng, startLat],
          zoom: hasPoint ? 16 : 12,
          attributionControl: true,
        })
        mapRef.current = map

        map.on('error', (event) => {
          const message = event?.error?.message ?? 'No se pudo cargar el mapa.'
          console.error('[Mapbox]', message, event?.error ?? event)
          if (!cancelled) setLoadError(message)
        })

        if (hasPoint) placeMarker(map, mapboxgl, startLng, startLat)

        map.on('click', (event) => {
          if (!interactiveRef.current) return
          placeMarker(map, mapboxgl, event.lngLat.lng, event.lngLat.lat)
          onChangeRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
          void reverseGeocode(event.lngLat.lng, event.lngLat.lat)
        })

        map.on('load', () => {
          map.resize()
          if (!cancelled) setReady(true)
          if (!interactiveRef.current) {
            const methods = [map.dragPan, map.scrollZoom, map.boxZoom, map.doubleClickZoom, map.touchZoomRotate, map.keyboard]
            for (const method of methods) method.disable()
            map.getCanvas().style.cursor = 'default'
            markerRef.current?.setDraggable(false)
          }
        })
      } catch (error) {
        console.error('[Mapbox init]', error)
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'No se pudo iniciar el mapa.')
      }
    })()

    return () => {
      cancelled = true
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [placeMarker, reverseGeocode])

  async function handleSearch() {
    const value = query.trim()
    const map = mapRef.current
    if (!value || !map || !ACCESS_TOKEN || searching) return

    setSearching(true)
    setSearchError(null)
    try {
      const params = new URLSearchParams({
        q: value,
        access_token: ACCESS_TOKEN,
        country: 'pe',
        language: 'es',
        limit: '1',
        proximity: `${map.getCenter().lng},${map.getCenter().lat}`,
      })
      const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`)
      if (!response.ok) throw new Error('geocoding failed')
      const data = (await response.json()) as { features?: GeocodeFeature[] }
      const feature = data.features?.[0]
      if (!feature) {
        setSearchError('No encontramos esa zona. Prueba con otro nombre.')
        return
      }
      const [lng, lat] = feature.geometry.coordinates
      map.flyTo({ center: [lng, lat], zoom: 16 })
      if (mapboxRef.current) placeMarker(map, mapboxRef.current, lng, lat)
      onChangeRef.current({ latitude: lat, longitude: lng })
      const address = readAddress(feature)
      if (address) onChangeRef.current({ address })
      else void reverseGeocode(lng, lat)
    } catch {
      setSearchError('No se pudo buscar la zona. Inténtalo de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSearch()
              }
            }}
            placeholder="Buscar barrio o avenida…"
            aria-label="Buscar zona en el mapa"
            maxLength={120}
            disabled={!interactive}
          />
          <Button type="button" onClick={() => void handleSearch()} disabled={!interactive || searching || query.trim().length === 0} className="shrink-0">
            {searching ? <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin" /> : <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />}
            <span className="sr-only sm:not-sr-only">Buscar</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Busca una zona y luego mueve el pin con el dedo o haz clic en el mapa para afinar la posición.
        </p>
        {searchError ? <p className="text-sm font-medium text-destructive">{searchError}</p> : null}
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border bg-muted',
          'aspect-[4/3] w-full sm:aspect-[16/9]',
        )}
      >
        <div ref={containerRef} className="h-full w-full" />
        {!ACCESS_TOKEN ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
            Falta configurar <code className="mx-1 rounded bg-card px-1.5 py-0.5">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> para mostrar el mapa.
          </div>
        ) : null}
        {ACCESS_TOKEN && !ready && !loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-6 animate-spin" />
          </div>
        ) : null}
        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted px-6 text-center text-sm text-destructive">
            No se pudo cargar el mapa: {loadError}
          </div>
        ) : null}
        {ACCESS_TOKEN && ready && !interactive && !loadError ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
            <span className="rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              Activa la edición para mover el pin
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
