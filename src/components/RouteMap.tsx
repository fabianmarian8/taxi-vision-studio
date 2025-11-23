'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom component to fit bounds
function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
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
  distance: number;
}

export function RouteMap({
  fromLat,
  fromLng,
  fromName,
  toLat,
  toLng,
  toName,
  distance,
}: RouteMapProps) {
  const fromPosition: [number, number] = [fromLat, fromLng];
  const toPosition: [number, number] = [toLat, toLng];

  const bounds: [[number, number], [number, number]] = [
    [Math.min(fromLat, toLat), Math.min(fromLng, toLng)],
    [Math.max(fromLat, toLat), Math.max(fromLng, toLng)],
  ];

  return (
    <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-3d-lg border-2 border-foreground/10">
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

        {/* Fit map to show both markers */}
        <FitBounds bounds={bounds} />

        {/* Start marker (municipality) */}
        <Marker position={fromPosition} icon={icon}>
          <Popup>
            <div className="font-bold">{fromName}</div>
            <div className="text-sm">Začiatok trasy</div>
          </Popup>
        </Marker>

        {/* End marker (city with taxis) */}
        <Marker position={toPosition} icon={icon}>
          <Popup>
            <div className="font-bold">{toName}</div>
            <div className="text-sm">Taxislužby ({distance} km)</div>
          </Popup>
        </Marker>

        {/* Route line */}
        <Polyline
          positions={[fromPosition, toPosition]}
          color="#fbbf24"
          weight={3}
          opacity={0.7}
          dashArray="10, 10"
        />
      </MapContainer>
    </div>
  );
}
