/**
 * Region Page - Next.js App Router Dynamic Route
 *
 * Migrované z: src/vite-pages/RegionPage.tsx
 *
 * Zmeny oproti Vite verzii:
 * - useParams → params prop
 * - Navigate → notFound()
 * - SEOHead → generateMetadata
 * - Link z react-router → next/link
 * - useEffect na scroll odstránený (template.tsx)
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { SlovakCityCard } from '@/components/SlovakCityCard';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { getRegionBySlug, getCitiesByRegion, getRegionsData } from '@/data/cities';
import { getDistrictsByRegion } from '@/data/districts';
import { SEO_CONSTANTS } from '@/lib/seo-constants';

// Generate static params for all regions at build time
export function generateStaticParams() {
  const regions = getRegionsData();
  return regions.map((region) => ({
    regionSlug: region.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionSlug: string }>;
}): Promise<Metadata> {
  const { regionSlug } = await params;
  const regionName = getRegionBySlug(regionSlug);

  if (!regionName) {
    return {
      title: 'Kraj nenájdený',
      description: 'Stránka kraja nebola nájdená',
    };
  }

  const cities = getCitiesByRegion(regionName);
  const siteName = 'Taxi NearMe';
  const baseUrl = 'https://www.taxinearme.sk';
  const currentUrl = `${baseUrl}/kraj/${regionSlug}`;
  // Skrátený popis pre SEO (max 160 znakov)
  const description = `Taxislužby v ${regionName}. Prehľad ${cities.length} miest s taxi službami. Nájdite spoľahlivé taxi rýchlo a jednoducho.`;

  return {
    title: `Taxislužby v Kraji ${regionName} | ${siteName}`,
    description,
    keywords: [
      `taxi ${regionName}`,
      `taxislužby ${regionName}`,
      `taxi služby ${regionName}`,
      `objednať taxi ${regionName}`,
    ],
    openGraph: {
      title: `Taxislužby v Kraji ${regionName}`,
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
          alt: `Taxislužby v Kraji ${regionName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONSTANTS.twitterSite,
      title: `Taxislužby v Kraji ${regionName}`,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        'sk': currentUrl,
        'x-default': currentUrl,
      },
    },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ regionSlug: string }> }) {
  const { regionSlug } = await params;
  const regionName = getRegionBySlug(regionSlug);
  const districts = regionName ? getDistrictsByRegion(regionName) : [];
  const cities = regionName ? getCitiesByRegion(regionName) : [];

  // 404 handling - Next.js way
  if (!regionName) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs items={[{ label: regionName }]} />

      {/* Region Header Section */}
      <section className="pt-4 md:pt-6 py-8 md:py-12 lg:py-16 px-4 md:px-8 relative">
        <GeometricLines variant="hero" count={8} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
              Taxislužby v kraji {regionName}
            </h1>
            <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
              Vyberte si okres a prehliadajte obce s taxislužbami
            </p>
          </div>
        </div>
      </section>

      {/* Districts Grid Section */}
      <section className="py-8 md:py-12 px-4 md:px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-7xl relative z-10">
          {/* Districts Section */}
          {districts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-black mb-6 text-foreground">
                Okresy v kraji {regionName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {districts.map((district) => (
                  <Link
                    key={district.slug}
                    href={`/taxi/${regionSlug}/${district.slug}`}
                    className="block group"
                  >
                    <Card className="perspective-1000 h-full transition-all hover:shadow-lg">
                      <div className="card-3d shadow-3d-sm hover:shadow-3d-md">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-5 w-5 text-success flex-shrink-0" />
                                <h3 className="font-bold text-base md:text-lg text-foreground group-hover:text-primary-yellow transition-colors">
                                  Okres {district.name}
                                </h3>
                              </div>
                              <p className="text-sm text-foreground/70">
                                {district.municipalitiesCount} obcí
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cities Section - Main cities with taxi services */}
          {cities.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-6 text-foreground">
                Hlavné mestá s taxislužbami
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {cities.map((city) => (
                  <SlovakCityCard
                    key={city.slug}
                    name={city.name}
                    region={city.region}
                    slug={city.slug}
                  />
                ))}
              </div>
            </div>
          )}

          {districts.length === 0 && cities.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-base md:text-xl text-foreground/70 font-bold px-4">
                V tomto kraji zatiaľ nemáme žiadne údaje.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Footer with 3D Border */}
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
