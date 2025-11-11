import citiesDataJson from './cities.json';

export interface TaxiService {
  name: string;
  website?: string;
  phone?: string;
}

export interface CityData {
  name: string;
  slug: string;
  region: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  taxiServices: TaxiService[];
  latitude?: number;
  longitude?: number;
}

// Načítanie dát z JSON súboru
export const slovakCities: CityData[] = citiesDataJson.cities as CityData[];

export const getCityBySlug = (slug: string): CityData | undefined => {
  return slovakCities.find(city => city.slug === slug);
};

// Získanie jedinečného zoznamu krajov
export const getUniqueRegions = (): string[] => {
  const regions = slovakCities.map(city => city.region);
  return Array.from(new Set(regions)).sort();
};

// Funkcia na vytvorenie slug z názvu kraja
export const createRegionSlug = (regionName: string): string => {
  return regionName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Odstránenie diakritiky
    .replace(/\s+/g, '-'); // Nahradenie medzier pomlčkami
};

// Získanie miest v danom kraji
export const getCitiesByRegion = (regionName: string): CityData[] => {
  return slovakCities.filter(city => city.region === regionName).sort((a, b) =>
    a.name.localeCompare(b.name, 'sk')
  );
};

// Získanie kraja podľa slug
export const getRegionBySlug = (slug: string): string | undefined => {
  const regions = getUniqueRegions();
  return regions.find(region => createRegionSlug(region) === slug);
};

// Export regiónu s dátami
export interface RegionData {
  name: string;
  slug: string;
  citiesCount: number;
}

// Získanie všetkých regiónov s dátami
export const getRegionsData = (): RegionData[] => {
  const regions = getUniqueRegions();
  return regions.map(region => ({
    name: region,
    slug: createRegionSlug(region),
    citiesCount: getCitiesByRegion(region).length
  }));
};
