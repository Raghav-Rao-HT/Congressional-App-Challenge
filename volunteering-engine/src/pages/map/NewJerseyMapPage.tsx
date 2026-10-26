import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPinOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState, Page, PageHeader } from '../../components/ui/Page'
import { useAuth } from '../../context/AuthProvider'
import { useOrgApplications } from '../../hooks/useOrgApplications'
import { subscribeApprovedOrganizations } from '../../lib/firestore/organizations'
import { isInNewJersey, NJ_BOUNDS } from '../../lib/newJersey'
import type { Organization, OrgLocation } from '../../types/models'

const markerImage = L.divIcon({
  className: '',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="pin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f5eff"/><stop offset="1" stop-color="#4a38d3"/></linearGradient></defs>
    <path d="M17 1C8.7 1 2 7.6 2 15.8c0 10.4 13.2 25.8 14.1 26.8a1.2 1.2 0 0 0 1.8 0C18.8 41.6 32 26.2 32 15.8 32 7.6 25.3 1 17 1z" fill="url(#pin)" stroke="#fff" stroke-width="2"/>
    <circle cx="17" cy="15.5" r="5.5" fill="#fff"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
  popupAnchor: [0, -38],
  tooltipAnchor: [18, -22],
})

const PAN_LIMIT: [[number, number], [number, number]] = [
  [NJ_BOUNDS[0][0] - 0.4, NJ_BOUNDS[0][1] - 0.4],
  [NJ_BOUNDS[1][0] + 0.4, NJ_BOUNDS[1][1] + 0.4],
]

type MappedOrg = Organization & { location: OrgLocation }

function safeHttpUrl(value: string): string | null {
  return /^https?:\/\//i.test(value) ? value : null
}

function OrgPopup({
  org,
  canJoin,
  status,
  joining,
  onJoin,
}: {
  org: Organization
  canJoin: boolean
  status: string | undefined
  joining: boolean
  onJoin: () => void
}) {
  const website = safeHttpUrl(org.website)

  return (
    <div className="w-64 text-sm text-fg">
      <div className="text-lg font-bold leading-tight tracking-tight">{org.name}</div>
      <Badge tone="brand" className="mt-1.5">
        {org.causeArea}
      </Badge>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Legal name</dt>
          <dd>{org.legalName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Address</dt>
          <dd>
            {org.address.street}
            <br />
            {org.address.city}, {org.address.state} {org.address.zip}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Contact</dt>
          <dd>
            <a href={`mailto:${org.contactEmail}`} className="text-info hover:underline">
              {org.contactEmail}
            </a>
            <br />
            <a href={`tel:${org.contactPhone}`} className="text-info hover:underline">
              {org.contactPhone}
            </a>
          </dd>
        </div>
        {org.website && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Website</dt>
            <dd className="break-words">
              {website ? (
                <a href={website} target="_blank" rel="noreferrer" className="text-info hover:underline">
                  {org.website}
                </a>
              ) : (
                org.website
              )}
            </dd>
          </div>
        )}
      </dl>

      {canJoin && (
        <div className="mt-4 border-t border-line pt-4">
          {status ? (
            <div className="text-sm font-medium text-muted">
              Your membership: <span className="capitalize">{status}</span>
            </div>
          ) : (
            <>
              <div className="text-sm font-semibold text-fg">Want to volunteer with {org.name}?</div>
              <Button className="mt-3 w-full" loading={joining} onClick={onJoin}>
                {joining ? 'Joining…' : 'Join this organization'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const ALWAYS_LABEL_ZOOM = 9

function OrgMarkers({
  orgs,
  canJoin,
  applications,
  applyingTo,
  onJoin,
}: {
  orgs: MappedOrg[]
  canJoin: boolean
  applications: Record<string, string>
  applyingTo: string | null
  onJoin: (orgId: string) => void
}) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  const labelsAlwaysOn = zoom >= ALWAYS_LABEL_ZOOM

  return (
    <>
      {orgs.map((org) => (
        <Marker key={org.orgId} position={[org.location.lat, org.location.lng]} icon={markerImage}>
          <Tooltip key={labelsAlwaysOn ? 'always' : 'hover'} permanent={labelsAlwaysOn} direction="right">
            {org.name}
          </Tooltip>
          <Popup minWidth={260} maxWidth={300}>
            <OrgPopup
              org={org}
              canJoin={canJoin}
              status={applications[org.orgId]}
              joining={applyingTo === org.orgId}
              onJoin={() => onJoin(org.orgId)}
            />
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export function NewJerseyMapPage() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const { applications, applyingTo, apply } = useOrgApplications()

  useEffect(() => subscribeApprovedOrganizations(setOrgs), [])

  const mapped = useMemo(
    () => orgs.filter((org): org is MappedOrg => !!org.location && isInNewJersey(org.location)),
    [orgs],
  )

  return (
    <Page width="wide">
      <PageHeader
        title="New Jersey map"
        description={`Click a marker to see an organization's details${profile?.accountType === 'member' ? ' and join it.' : '.'}`}
      />

      <div className="overflow-hidden rounded-card border border-line shadow-card">
        <MapContainer
          bounds={NJ_BOUNDS}
          maxBounds={PAN_LIMIT}
          maxBoundsViscosity={1}
          minZoom={7}
          className="h-[70vh] min-h-96 w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <OrgMarkers
            orgs={mapped}
            canJoin={profile?.accountType === 'member'}
            applications={applications}
            applyingTo={applyingTo}
            onJoin={apply}
          />
        </MapContainer>
      </div>

      {mapped.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={MapPinOff}
            title="No organizations on the map yet"
            description="Approved organizations appear here once they're located."
          />
        </div>
      )}
    </Page>
  )
}
