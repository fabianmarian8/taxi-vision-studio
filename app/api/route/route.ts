/**
 * API Route for Road Routing
 * Uses OpenRouteService API for accurate road distances
 *
 * GET /api/route?from=lat,lng&to=lat,lng
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteResponse {
  distance: number; // kilometers
  duration: number; // minutes
  geometry: [number, number][]; // [lat, lng] coordinates
  source: 'openrouteservice' | 'osrm' | 'estimate';
}

// Decode Google Polyline format used by OpenRouteService
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// OpenRouteService API (primary - most accurate for Europe)
async function getRouteFromORS(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResponse | null> {
  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    console.log('ORS_API_KEY not configured, skipping OpenRouteService');
    return null;
  }

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [[fromLng, fromLat], [toLng, toLat]],
      }),
    });

    if (!response.ok) {
      console.error('ORS API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const geometry = decodePolyline(route.geometry);

    return {
      distance: Math.round(route.summary.distance / 100) / 10, // meters to km, 1 decimal
      duration: Math.round(route.summary.duration / 60), // seconds to minutes
      geometry,
      source: 'openrouteservice',
    };
  } catch (error) {
    console.error('ORS fetch error:', error);
    return null;
  }
}

// OSRM API (fallback)
async function getRouteFromOSRM(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResponse | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
    );

    return {
      distance: Math.round(route.distance / 100) / 10,
      duration: Math.round(route.duration / 60),
      geometry,
      source: 'osrm',
    };
  } catch (error) {
    console.error('OSRM fetch error:', error);
    return null;
  }
}

// Calculate air distance for estimation fallback
function calculateAirDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (toLat - fromLat) * Math.PI / 180;
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing from or to parameters' },
      { status: 400 }
    );
  }

  const [fromLat, fromLng] = from.split(',').map(Number);
  const [toLat, toLng] = to.split(',').map(Number);

  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  // Try OpenRouteService first (most accurate for Europe)
  let result = await getRouteFromORS(fromLat, fromLng, toLat, toLng);

  // Fallback to OSRM
  if (!result) {
    result = await getRouteFromOSRM(fromLat, fromLng, toLat, toLng);
  }

  // Final fallback: estimate based on air distance
  if (!result) {
    const airDistance = calculateAirDistance(fromLat, fromLng, toLat, toLng);
    // Multiply by 1.4 for road distance estimate (roads are not straight)
    const estimatedRoadDistance = Math.round(airDistance * 1.4 * 10) / 10;

    result = {
      distance: estimatedRoadDistance,
      duration: Math.round(estimatedRoadDistance * 1.5), // ~40 km/h average
      geometry: [[fromLat, fromLng], [toLat, toLng]], // straight line
      source: 'estimate',
    };
  }

  return NextResponse.json(result);
}
