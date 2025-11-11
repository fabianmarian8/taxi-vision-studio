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
}

// Načítanie dát z JSON súboru
export const slovakCities: CityData[] = citiesDataJson.cities as CityData[];

export const getCityBySlug = (slug: string): CityData | undefined => {
  return slovakCities.find(city => city.slug === slug);
};
