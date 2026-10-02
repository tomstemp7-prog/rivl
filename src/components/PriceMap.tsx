import { useEffect, useMemo, type ReactNode } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import { formatPrice, type Business, type Category } from '../mockData'
import { BAND_COLOUR, band } from '../lib/stats'
import type { Radius } from '../lib/url'

const METRES_PER_MILE = 1609.34

interface Props {
  center: { lat: number; lng: number }
  radius: Radius
  businesses: Business[]
  median: number
  category: Category
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Bumped when a business is picked from the list, so the map can bring it into view. */
  focusKey: number
  yourPrice: number | null
  searchId: number
  /** Extra space to keep clear at the bottom (mobile bottom sheet). */
  padBottom?: number
  overlay?: ReactNode
  className?: string
}

function pinIcon(label: string, colour: string, opts: { selected: boolean; dropping: boolean; delay: number }) {
  const classes = ['rivl-pin', opts.selected && 'is-selected', opts.dropping && 'is-dropping'].filter(Boolean).join(' ')
  return L.divIcon({
    className: 'rivl-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div class="${classes}" style="color:${colour};animation-delay:${opts.delay}ms"><span class="rivl-pin__label" style="background:${colour}">${label}</span><span class="rivl-pin__tail"></span></div>`,
  })
}

const homeIcon = L.divIcon({ className: 'rivl-marker', iconSize: [0, 0], html: '<div class="rivl-home"></div>' })

function youIcon(label: string) {
  return L.divIcon({
    className: 'rivl-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div class="rivl-pin rivl-pin--you is-dropping" style="color:#FF5A1F"><span class="rivl-pin__label">You · ${label}</span><span class="rivl-pin__tail"></span></div>`,
  })
}

function FitToRadius({ center, radius, padBottom }: { center: Props['center']; radius: Radius; padBottom: number }) {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLng(center).toBounds(radius * METRES_PER_MILE * 2)
    map.fitBounds(bounds, { paddingTopLeft: [16, 56], paddingBottomRight: [16, 16 + padBottom], animate: true })
  }, [map, center.lat, center.lng, radius, padBottom])
  return null
}

function FocusSelected({ business, focusKey, padBottom }: { business?: Business; focusKey: number; padBottom: number }) {
  const map = useMap()
  useEffect(() => {
    if (!business || !focusKey) return
    map.panInside([business.lat, business.lng], { paddingTopLeft: [60, 90], paddingBottomRight: [60, 220 + padBottom] })
  }, [focusKey])
  return null
}

function ClickAway({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

export function PriceMap(props: Props) {
  const { center, radius, businesses, median, category, selectedId, onSelect, focusKey, yourPrice, searchId, padBottom = 0, overlay, className } = props

  // Pins drop in for a moment after a new search or radius change; after that,
  // re-rendering a pin (e.g. selecting it) shouldn't replay the animation.
  const dropUntil = useMemo(() => performance.now() + 1600, [searchId, radius])
  const dropping = performance.now() < dropUntil

  // Show the user's own pin just off the searched postcode.
  const youPosition: [number, number] = [
    center.lat + 0.12 / 69,
    center.lng + 0.18 / (69 * Math.cos((center.lat * Math.PI) / 180)),
  ]

  const selected = businesses.find((b) => b.id === selectedId)

  return (
    <div className={`relative isolate overflow-hidden ${className ?? ''}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        zoomControl={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <FitToRadius center={center} radius={radius} padBottom={padBottom} />
        <FocusSelected business={selected} focusKey={focusKey} padBottom={padBottom} />
        <ClickAway onClick={() => onSelect(null)} />
        <Circle
          center={[center.lat, center.lng]}
          radius={radius * METRES_PER_MILE}
          pathOptions={{ color: '#FF5A1F', weight: 2, dashArray: '6 8', fillColor: '#FF5A1F', fillOpacity: 0.05 }}
          interactive={false}
        />
        <Marker position={[center.lat, center.lng]} icon={homeIcon} interactive={false} keyboard={false} />
        {businesses.map((b, i) => {
          const isSelected = b.id === selectedId
          const label = formatPrice(b.price, category.pence)
          return (
            <Marker
              key={`${searchId}-${b.id}`}
              position={[b.lat, b.lng]}
              icon={pinIcon(label, BAND_COLOUR[band(b.price, median)], { selected: isSelected, dropping, delay: i * 45 })}
              zIndexOffset={isSelected ? 1000 : 0}
              title={`${b.name}, ${label}`}
              alt={`${b.name}, ${label}`}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e)
                  onSelect(isSelected ? null : b.id)
                },
              }}
            />
          )
        })}
        {yourPrice !== null && (
          <Marker
            key={`you-${yourPrice}`}
            position={youPosition}
            icon={youIcon(formatPrice(yourPrice, category.pence))}
            zIndexOffset={2000}
            interactive={false}
            keyboard={false}
          />
        )}
      </MapContainer>
      {overlay}
    </div>
  )
}
