'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoute, estimateRoadTaxiPrice, type RouteResult } from '@/utils/routing';
import { Car, Clock, Navigation } from 'lucide-react';

// Fix for default marker icons in React Leaflet
const startIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom green icon for destination
const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom component to fit bounds
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);

  return null;
}

interface RouteMapProps {
  fromLat: number;
  fromLng: number;
  fromName: string;
  toLat: number;
  toLng: number;
  toName: string;
  distance: number; // Fallback distance (air distance)
}

export function RouteMap({
  fromLat,
  fromLng,
  fromName,
  toLat,
  toLng,
  toName,
  distance: airDistance,
}: RouteMapProps) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fromPosition: [number, number] = [fromLat, fromLng];
  const toPosition: [number, number] = [toLat, toLng];

  // Fetch route on mount
  useEffect(() => {
    let mounted = true;

    async function fetchRoute() {
      setLoading(true);
      setError(false);

      const result = await getRoute(fromLat, fromLng, toLat, toLng);

      if (mounted) {
        if (result) {
          setRoute(result);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    }

    fetchRoute();

    return () => {
      mounted = false;
    };
  }, [fromLat, fromLng, toLat, toLng]);

  // Use route distance or fallback to air distance * 1.3 (rough estimate)
  const roadDistance = route?.distance ?? Math.round(airDistance * 1.3 * 10) / 10;
  const duration = route?.duration ?? Math.round(roadDistance * 1.5); // Rough estimate: 40 km/h average
  const price = estimateRoadTaxiPrice(roadDistance);

  // Calculate bounds
  const bounds: [[number, number], [number, number]] = route?.geometry
    ? [
        [
          Math.min(...route.geometry.map(p => p[0])),
          Math.min(...route.geometry.map(p => p[1])),
        ],
        [
          Math.max(...route.geometry.map(p => p[0])),
          Math.max(...route.geometry.map(p => p[1])),
        ],
      ]
    : [
        [Math.min(fromLat, toLat), Math.min(fromLng, toLng)],
        [Math.max(fromLat, toLat), Math.max(fromLng, toLng)],
      ];

  return (
    <div className="space-y-4">
      {/* Route Info Box */}
      <div className="bg-gradient-to-r from-primary-yellow/20 to-primary-yellow/10 rounded-xl p-4 border border-primary-yellow/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <Navigation className="h-5 w-5 text-primary-yellow mb-1" />
            <span className="text-xs text-foreground/60 font-medium">Vzdialenosť</span>
            <span className="text-lg font-black text-foreground">
              {loading ? '...' : `${roadDistance} km`}
            </span>
            {route && (
              <span className="text-[10px] text-foreground/50">po ceste</span>
            )}
          </div>
          <div className="flex flex-col items-center">
            <Clock className="h-5 w-5 text-primary-yellow mb-1" />
            <span className="text-xs text-foreground/60 font-medium">Čas jazdy</span>
            <span className="text-lg font-black text-foreground">
              {loading ? '...' : `${duration} min`}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Car className="h-5 w-5 text-primary-yellow mb-1" />
            <span className="text-xs text-foreground/60 font-medium">Odhadovaná cena</span>
            <span className="text-lg font-black text-foreground">
              {loading ? '...' : `${price.min}€ - ${price.max}€`}
            </span>
          </div>
        </div>
        {error && (
          <p className="text-xs text-center text-foreground/50 mt-2">
            * Odhad na základe vzdialenosti vzdušnou čiarou
          </p>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-3d-lg border-2 border-foreground/10 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-[1000] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-primary-yellow border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-foreground/70">Načítavam trasu...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={fromPosition}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fit map to show entire route */}
          <FitBounds bounds={bounds} />

          {/* Start marker (municipality) */}
          <Marker position={fromPosition} icon={startIcon}>
            <Popup>
              <div className="font-bold text-foreground">{fromName}</div>
              <div className="text-sm text-foreground/70">Začiatok trasy</div>
            </Popup>
          </Marker>

          {/* End marker (city with taxis) */}
          <Marker position={toPosition} icon={endIcon}>
            <Popup>
              <div className="font-bold text-foreground">{toName}</div>
              <div className="text-sm text-foreground/70">
                Taxislužby • {roadDistance} km
              </div>
            </Popup>
          </Marker>

          {/* Route line - real road route or fallback to straight line */}
          {route?.geometry ? (
            <Polyline
              positions={route.geometry}
              color="#f59e0b"
              weight={4}
              opacity={0.9}
            />
          ) : (
            <Polyline
              positions={[fromPosition, toPosition]}
              color="#fbbf24"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
