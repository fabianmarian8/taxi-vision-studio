/**
 * District Page - Shows all municipalities in a district
 * URL structure: /taxi/[regionSlug]/[districtSlug]
 * Example: /taxi/banskobystricky-kraj/zvolen
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { getRegionBySlug } from '@/data/cities';
import {
  getDistrictBySlugAndRegion,
  getMunicipalitiesByDistrict,
  getAllDistricts,
  getDistrictsByRegion,
} from '@/data/districts';
import { SEO_CONSTANTS } from '@/lib/seo-constants';

// ISR: Revalidate once per week
export const revalidate = 604800;

// Generate static params for all districts at build time
export function generateStaticParams() {
  const allDistricts = getAllDistricts();
  return allDistricts.map((district) => ({
    regionSlug: district.regionSlug,
    districtSlug: district.slug,
  }));
}

// Enable dynamic params for ISR
export const dynamicParams = true;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionSlug: string; districtSlug: string }>;
}): Promise<Metadata> {
  const { regionSlug, districtSlug } = await params;
  const regionName = getRegionBySlug(regionSlug);
  const district = getDistrictBySlugAndRegion(districtSlug, regionSlug);

  if (!regionName || !district) {
    return {
      title: 'Okres nenájdený',
      description: 'Stránka okresu nebola nájdená',
    };
  }

  const municipalities = getMunicipalitiesByDistrict(district.name);
  const siteName = 'Taxi NearMe';
  const baseUrl = 'https://www.taxinearme.sk';
  const currentUrl = `${baseUrl}/taxi/${regionSlug}/${districtSlug}`;

  const description = `Taxi v okrese ${district.name}, ${regionName}. Prehľad ${municipalities.length} obcí s taxislužbami v okolí. Nájdite spoľahlivé taxi rýchlo a jednoducho.`;

  return {
    title: `Taxi Okres ${district.name} - ${regionName} | ${siteName}`,
    description,
    keywords: [
      `taxi okres ${district.name}`,
      `taxislužby okres ${district.name}`,
      `taxi ${district.name}`,
      `taxi ${regionName}`,
      'objednať taxi',
    ],
    openGraph: {
      title: `Taxi v Okrese ${district.name}`,
      description,
      type: 'website',
      locale: 'sk_SK',
      url: currentUrl,
      siteName,
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `Taxi v Okrese ${district.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONSTANTS.twitterSite,
      title: `Taxi v Okrese ${district.name}`,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        sk: currentUrl,
        'x-default': currentUrl,
      },
    },
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ regionSlug: string; districtSlug: string }>;
}) {
  const { regionSlug, districtSlug } = await params;
  const regionName = getRegionBySlug(regionSlug);
  const district = getDistrictBySlugAndRegion(districtSlug, regionSlug);

  // 404 if region or district not found
  if (!regionName || !district) {
    notFound();
  }

  const municipalities = getMunicipalitiesByDistrict(district.name);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs
        items={[
          { label: regionName, href: `/kraj/${regionSlug}` },
          { label: `Okres ${district.name}` },
        ]}
      />

      {/* Hero Section */}
      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8 relative bg-white">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12">
            <div className="absolute inset-0 hero-3d-bg" />

            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-6 drop-shadow-lg text-foreground">
                Taxi v Okrese {district.name}
              </h1>
              <p className="text-base md:text-xl font-semibold px-4 text-foreground/90">
                {regionName} • {municipalities.length} obcí
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Municipalities List Section */}
      <section className="py-8 md:py-12 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              Všetky obce v okrese {district.name}
            </h2>
            <p className="text-base md:text-lg text-foreground/80 font-semibold">
              Vyberte si obec a nájdite taxislužby v okolí
            </p>
          </div>

          {municipalities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {municipalities.map((municipality) => (
                <Link
                  key={municipality.slug}
                  href={`/taxi/${regionSlug}/${districtSlug}/${municipality.slug}`}
                  className="block group"
                >
                  <Card className="perspective-1000 h-full transition-all hover:shadow-lg">
                    <div className="card-3d shadow-3d-sm hover:shadow-3d-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary-yellow transition-colors">
                            {municipality.name}
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <p className="text-base md:text-xl text-foreground/70 font-bold px-4">
                V tomto okrese zatiaľ nemáme žiadne obce.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Footer */}
      <footer className="border-t-4 border-foreground py-8 md:py-12 px-4 md:px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <Link
                href="/ochrana-sukromia"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Ochrana súkromia
              </Link>
              <Link
                href="/podmienky-pouzivania"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Podmienky používania
              </Link>
              <Link
                href="/"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
