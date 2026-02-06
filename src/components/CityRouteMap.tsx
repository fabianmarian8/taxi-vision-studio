'use client';

import { useEffect, useRef, useCallback, useId, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons - using localized assets
const startIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom green icon for destination - using localized asset
const endIcon = L.icon({
  iconUrl: '/leaflet/marker-icon-2x-green.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CityRouteMapProps {
  fromLat: number;
  fromLng: number;
  fromName: string;
  toLat: number;
  toLng: number;
  toName: string;
}

interface RouteApiResponse {
  distance: number;
  duration: number;
  geometry: [number, number][];
  source: 'openrouteservice' | 'osrm' | 'estimate';
}

function CityRouteMapInner({
  fromLat,
  fromLng,
  fromName,
  toLat,
  toLng,
  toName,
}: CityRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);

  const fetchRoute = useCallback(async (): Promise<RouteApiResponse | null> => {
    routeAbortRef.current?.abort();
    const controller = new AbortController();
    routeAbortRef.current = controller;

    try {
      const params = new URLSearchParams({
        from: `${fromLat},${fromLng}`,
        to: `${toLat},${toLng}`,
      });

      const response = await fetch(`/api/route?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) return null;
      const data = (await response.json()) as RouteApiResponse;
      if (!Array.isArray(data.geometry) || data.geometry.length < 2) return null;
      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      console.error('CityRouteMap route fetch error:', error);
      return null;
    }
  }, [fromLat, fromLng, toLat, toLng]);

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const route = await fetchRoute();
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const fromPoint: L.LatLngTuple = [fromLat, fromLng];
    const toPoint: L.LatLngTuple = [toLat, toLng];
    const geometry = route?.geometry?.length ? route.geometry : [fromPoint, toPoint];
    const isEstimatedRoute = route?.source === 'estimate' || !route;

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
    }).setView(fromPoint, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker(fromPoint, { icon: startIcon })
      .addTo(map)
      .bindPopup(`<div class="font-bold">${fromName}</div><div class="text-sm">Štart</div>`);

    L.marker(toPoint, { icon: endIcon })
      .addTo(map)
      .bindPopup(`<div class="font-bold">${toName}</div><div class="text-sm">Cieľ</div>`);

    L.polyline(geometry, {
      color: '#fbbf24',
      weight: 4,
      opacity: 0.85,
      dashArray: isEstimatedRoute ? '10, 10' : undefined,
    }).addTo(map);

    const bounds = L.latLngBounds(geometry as L.LatLngTuple[]);
    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstanceRef.current = map;
  }, [fetchRoute, fromLat, fromLng, toLat, toLng, fromName, toName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void initMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      routeAbortRef.current?.abort();
      routeAbortRef.current = null;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  return (
    <div className="w-full h-[350px] md:h-[400px] rounded-xl overflow-hidden border-2 border-foreground/10 relative">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

// Wrapper to handle SSR and hydration
export function CityRouteMap(props: CityRouteMapProps) {
  const uniqueId = useId();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 50);

    return () => {
      clearTimeout(timer);
      setShouldRender(false);
    };
  }, [props.fromLat, props.fromLng, props.toLat, props.toLng]);

  if (!shouldRender) {
    return (
      <div className="w-full h-[350px] md:h-[400px] rounded-xl overflow-hidden border-2 border-foreground/10 bg-foreground/5 flex items-center justify-center">
        <span className="text-foreground/50">Načítavam mapu...</span>
      </div>
    );
  }

  return <CityRouteMapInner key={`map-${uniqueId}-${props.fromLat}-${props.toLat}`} {...props} />;
}

export default CityRouteMap;
