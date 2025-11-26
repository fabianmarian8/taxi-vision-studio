'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoute, estimateRoadTaxiPrice, type RouteResult } from '@/utils/routing';
import { Car, Clock, Navigation } from 'lucide-react';

// Fix for default marker icons
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fromPosition: L.LatLngExpression = [fromLat, fromLng];
  const toPosition: L.LatLngExpression = [toLat, toLng];

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

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
    }).setView(fromPosition, 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add start marker
    L.marker(fromPosition, { icon: startIcon })
      .addTo(map)
      .bindPopup(`<div class="font-bold">${fromName}</div><div class="text-sm">Začiatok trasy</div>`);

    // Add end marker
    L.marker(toPosition, { icon: endIcon })
      .addTo(map)
      .bindPopup(`<div class="font-bold">${toName}</div><div class="text-sm">Taxislužby</div>`);

    // Fit bounds
    const bounds = L.latLngBounds([fromPosition, toPosition]);
    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstanceRef.current = map;
  }, [fromLat, fromLng, toLat, toLng, fromName, toName]);

  // Update route line when route data is available
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Marker)) {
        map.removeLayer(layer);
      }
    });

    if (route?.geometry) {
      // Add real route
      const polyline = L.polyline(route.geometry as L.LatLngExpression[], {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      // Fit to route bounds
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    } else {
      // Add straight line fallback
      L.polyline([fromPosition, toPosition], {
        color: '#fbbf24',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(map);
    }
  }, [route, fromLat, fromLng, toLat, toLng]);

  // Initialize and cleanup map
  useEffect(() => {
    // Small delay to ensure container is ready
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  // Use route distance or fallback to air distance * 2.0 (rough estimate for mountainous Slovak roads)
  const roadDistance = route?.distance ?? Math.round(airDistance * 2.0 * 10) / 10;
  const duration = route?.duration ?? Math.round(roadDistance * 1.5); // Rough estimate: 40 km/h average
  const price = estimateRoadTaxiPrice(roadDistance);

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
        <div
          ref={mapContainerRef}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}
