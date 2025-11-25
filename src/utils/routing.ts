/**
 * Routing Service Client
 * Calls /api/route endpoint which uses OpenRouteService (accurate) or OSRM (fallback)
 */

export interface RouteResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  geometry: [number, number][]; // Array of [lat, lng] coordinates for the route
  source?: 'openrouteservice' | 'osrm' | 'estimate';
}

/**
 * Get driving route between two points
 * Uses server-side API that tries OpenRouteService first, then OSRM, then estimate
 *
 * @param fromLat Starting latitude
 * @param fromLng Starting longitude
 * @param toLat Destination latitude
 * @param toLng Destination longitude
 * @returns Route with distance, duration, and geometry
 */
export async function getRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteResult | null> {
  try {
    const response = await fetch(
      `/api/route?from=${fromLat},${fromLng}&to=${toLat},${toLng}`
    );

    if (!response.ok) {
      console.error('Route API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      distance: data.distance,
      duration: data.duration,
      geometry: data.geometry,
      source: data.source,
    };
  } catch (error) {
    console.error('Failed to fetch route:', error);
    return null;
  }
}

/**
 * Estimate taxi price based on road distance
 * @param distanceKm Distance in kilometers (road distance)
 * @returns Estimated price range {min, max}
 */
export function estimateRoadTaxiPrice(distanceKm: number): { min: number; max: number } {
  // Base fare + per km rate (Slovak taxi average)
  const baseFare = 2; // €2 nástupné
  const pricePerKm = 1.0; // €1 per km

  const basePrice = baseFare + distanceKm * pricePerKm;

  // Add ±15% variance for min/max (different taxi companies)
  const min = Math.ceil(basePrice * 0.85);
  const max = Math.ceil(basePrice * 1.15);

  return { min, max };
}
