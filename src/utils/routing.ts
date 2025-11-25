/**
 * OSRM Routing Service
 * Uses Open Source Routing Machine for real road distances and routes
 * Public demo server: router.project-osrm.org
 */

export interface RouteResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  geometry: [number, number][]; // Array of [lat, lng] coordinates for the route
}

/**
 * Get driving route between two points using OSRM
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
    // OSRM expects coordinates as lng,lat (not lat,lng!)
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('OSRM API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('OSRM returned no routes:', data.code);
      return null;
    }

    const route = data.routes[0];

    // Convert GeoJSON coordinates [lng, lat] to [lat, lng] for Leaflet
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
    );

    return {
      distance: Math.round(route.distance / 100) / 10, // Convert meters to km, 1 decimal
      duration: Math.round(route.duration / 60), // Convert seconds to minutes
      geometry,
    };
  } catch (error) {
    console.error('Failed to fetch route from OSRM:', error);
    return null;
  }
}

/**
 * Estimate taxi price based on road distance
 * @param distanceKm Distance in kilometers (road distance)
 * @returns Estimated price range {min, max}
 */
export function estimateRoadTaxiPrice(distanceKm: number): { min: number; max: number } {
  // Base fare + per km rate
  const baseFare = 2; // €2 nástupné
  const pricePerKm = 1.0; // €1 per km

  const basePrice = baseFare + distanceKm * pricePerKm;

  // Add ±15% variance for min/max (different taxi companies)
  const min = Math.ceil(basePrice * 0.85);
  const max = Math.ceil(basePrice * 1.15);

  return { min, max };
}
