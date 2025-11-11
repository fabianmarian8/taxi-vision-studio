import { slovakCities } from "@/data/cities";

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

// Find the nearest city from the database based on user's coordinates
export const findNearestCity = async (
  userLatitude: number,
  userLongitude: number,
  detectedRegion?: string
): Promise<string | null> => {
  // Filter cities that have GPS coordinates
  let citiesToCheck = slovakCities.filter(
    (city) => city.latitude !== undefined && city.longitude !== undefined
  );

  if (citiesToCheck.length === 0) {
    console.error("No cities with GPS coordinates found in database");
    return null;
  }

  // If we have a detected region, filter cities by that region first
  if (detectedRegion) {
    const mappedRegion = regionMapping[detectedRegion] || detectedRegion;
    const citiesInRegion = citiesToCheck.filter(
      (city) => city.region === mappedRegion
    );

    // Only use region filtering if we found cities in that region
    if (citiesInRegion.length > 0) {
      citiesToCheck = citiesInRegion;
    }
  }

  // Calculate distances for all cities (this is now fast since we have coordinates in the database)
  const citiesWithDistance = citiesToCheck.map((city) => {
    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      city.latitude!,
      city.longitude!
    );

    return {
      name: city.name,
      distance,
    };
  });

  // Sort by distance and return the nearest city
  citiesWithDistance.sort((a, b) => a.distance - b.distance);

  return citiesWithDistance[0]?.name || null;
};
