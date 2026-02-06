export interface RouteApiResponse {
  distance: number;
  duration: number;
  geometry: [number, number][];
  source: 'openrouteservice' | 'osrm' | 'estimate';
}

/**
 * Fetch real road geometry between two points from /api/route.
 * Returns null on failure (abort, network error, bad data).
 */
export async function fetchRouteGeometry(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  signal?: AbortSignal,
): Promise<RouteApiResponse | null> {
  try {
    const params = new URLSearchParams({
      from: `${fromLat},${fromLng}`,
      to: `${toLat},${toLng}`,
    });

    const response = await fetch(`/api/route?${params.toString()}`, {
      signal,
    });

    if (!response.ok) return null;
    const data = (await response.json()) as RouteApiResponse;
    if (!Array.isArray(data.geometry) || data.geometry.length < 2) return null;
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    console.error('fetchRouteGeometry error:', error);
    return null;
  }
}
