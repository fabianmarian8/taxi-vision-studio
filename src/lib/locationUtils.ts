import { slovakCities } from "@/data/cities";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CityWithDistance {
  name: string;
  slug: string;
  distance: number;
}

// Haversine formula to calculate distance between two GPS coordinates
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

// Cache for city coordinates to avoid repeated API calls
const coordinatesCache: Record<string, Coordinates> = {};

// Get coordinates for a city using Nominatim API
export const getCityCoordinates = async (
  cityName: string
): Promise<Coordinates | null> => {
  // Check cache first
  if (coordinatesCache[cityName]) {
    return coordinatesCache[cityName];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName + ", Slovakia"
      )}&limit=1&accept-language=sk`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const coords: Coordinates = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };

      // Cache the result
      coordinatesCache[cityName] = coords;

      return coords;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching coordinates for ${cityName}:`, error);
    return null;
  }
};

// Map OSM region/state names to our Slovak region names
const regionMapping: Record<string, string> = {
  "Bratislavský kraj": "Bratislavský kraj",
  "Trnavský kraj": "Trnavský kraj",
  "Trenčiansky kraj": "Trenčiansky kraj",
  "Nitriansky kraj": "Nitriansky kraj",
  "Žilinský kraj": "Žilinský kraj",
  "Banskobystrický kraj": "Banskobystrický kraj",
  "Prešovský kraj": "Prešovský kraj",
  "Košický kraj": "Košický kraj",
};

// Find the nearest city from the database based on user's coordinates and detected region
export const findNearestCity = async (
  userLatitude: number,
  userLongitude: number,
  detectedRegion?: string
): Promise<string | null> => {
  let citiesToCheck = slovakCities;

  // If we have a detected region, filter cities by that region first
  if (detectedRegion) {
    const mappedRegion = regionMapping[detectedRegion] || detectedRegion;
    const citiesInRegion = slovakCities.filter(
      (city) => city.region === mappedRegion
    );

    if (citiesInRegion.length > 0) {
      citiesToCheck = citiesInRegion;
    }
  }

  const citiesWithDistance: CityWithDistance[] = [];

  // Process cities in smaller batches to respect API rate limits
  const batchSize = 3;

  for (let i = 0; i < citiesToCheck.length; i += batchSize) {
    const batch = citiesToCheck.slice(i, i + batchSize);

    const batchPromises = batch.map(async (city, index) => {
      // Add delay between requests (200ms per request)
      await new Promise((resolve) => setTimeout(resolve, index * 300));

      const coords = await getCityCoordinates(city.name);

      if (coords) {
        const distance = calculateDistance(
          userLatitude,
          userLongitude,
          coords.latitude,
          coords.longitude
        );

        return {
          name: city.name,
          slug: city.slug,
          distance,
        };
      }

      return null;
    });

    const results = await Promise.all(batchPromises);
    citiesWithDistance.push(
      ...results.filter((r): r is CityWithDistance => r !== null)
    );

    // Add delay between batches
    if (i + batchSize < citiesToCheck.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Sort by distance and return the nearest city
  if (citiesWithDistance.length > 0) {
    citiesWithDistance.sort((a, b) => a.distance - b.distance);
    return citiesWithDistance[0].name;
  }

  return null;
};
