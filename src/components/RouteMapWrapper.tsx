'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

// Dynamically import RouteMap to avoid SSR issues with Leaflet
const RouteMap = dynamic(() => import('./RouteMap').then((mod) => mod.RouteMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border-2 border-foreground/10">
      <Skeleton className="w-full h-full" />
    </div>
  ),
});

interface RouteMapWrapperProps {
  fromLat: number;
  fromLng: number;
  fromName: string;
  toLat: number;
  toLng: number;
  toName: string;
  distance: number;
}

export function RouteMapWrapper(props: RouteMapWrapperProps) {
  return <RouteMap {...props} />;
}
