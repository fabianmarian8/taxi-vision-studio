/**
 * NearbyMunicipalities - Zobrazuje ďalšie obce v okrese
 *
 * Zlepšuje interné prelinkovanie pre SEO
 */

import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Municipality } from '@/data/municipalities';
import { District } from '@/data/districts';
import { getCityBySlug } from '@/data/cities';

interface NearbyMunicipalitiesProps {
  currentMunicipality: Municipality;
  allMunicipalities: Municipality[];
  district: District;
  regionSlug: string;
  limit?: number;
}

export function NearbyMunicipalities({
  currentMunicipality,
  allMunicipalities,
  district,
  regionSlug,
  limit = 12,
}: NearbyMunicipalitiesProps) {
  // Filter out current municipality and get nearby ones
  const otherMunicipalities = allMunicipalities
    .filter((m) => m.slug !== currentMunicipality.slug)
    .slice(0, limit);

  if (otherMunicipalities.length === 0) {
    return null;
  }

  // Helper to check if municipality has taxi services
  const hasTaxiServices = (mun: Municipality): boolean => {
    const city = getCityBySlug(mun.slug);
    return !!(city && city.taxiServices.length > 0);
  };

  // Helper to get correct URL
  const getMunicipalityUrl = (mun: Municipality): string => {
    const cityWithTaxi = getCityBySlug(mun.slug);
    if (cityWithTaxi && cityWithTaxi.taxiServices.length > 0) {
      return `/taxi/${cityWithTaxi.slug}`;
    }
    return `/taxi/${regionSlug}/${district.slug}/${mun.slug}`;
  };

  return (
    <section className="py-8 px-4 md:px-8 bg-white border-t border-gray-100">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Ďalšie obce v okrese {district.name}
          </h2>
          <Link
            href={`/taxi/${regionSlug}/${district.slug}`}
            className="text-sm font-medium text-primary-yellow hover:underline flex items-center gap-1"
          >
            Všetky obce
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {otherMunicipalities.map((mun) => {
            const hasTaxi = hasTaxiServices(mun);
            return (
              <Link
                key={mun.slug}
                href={getMunicipalityUrl(mun)}
                className={`group flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  hasTaxi
                    ? 'bg-yellow-50 hover:bg-yellow-100 ring-1 ring-yellow-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <MapPin
                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                    hasTaxi ? 'text-yellow-600' : 'text-foreground/40 group-hover:text-foreground/60'
                  }`}
                />
                <span className="text-sm font-medium text-foreground truncate">
                  {mun.name}
                </span>
                {hasTaxi && (
                  <span className="text-[9px] bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded font-bold ml-auto flex-shrink-0">
                    TAXI
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-foreground/60 text-center">
          Okres {district.name} má celkovo {district.municipalitiesCount} obcí a miest
        </p>
      </div>
    </section>
  );
}
