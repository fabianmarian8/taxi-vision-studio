/**
 * City Page - Next.js App Router Dynamic Route
 *
 * Migrované z: src/vite-pages/CityPage.tsx
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
import { CityFAQ } from '@/components/CityFAQ';
import { CityContent } from '@/components/CityContent';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { MapPin, Phone, Globe } from 'lucide-react';
import { getCityBySlug, createRegionSlug } from '@/data/cities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { truncateUrl } from '@/utils/urlUtils';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return {
      title: 'Mesto nenájdené',
      description: 'Stránka mesta nebola nájdená',
    };
  }

  const siteName = 'Taxi NearMe';
  const baseUrl = 'https://taxinearme.sk';
  const currentUrl = `${baseUrl}/taxi/${citySlug}`;

  // Vytvoriť zoznam taxislužieb pre description
  const taxiServicesList = city.taxiServices
    .slice(0, 3)
    .map((service) => service.name)
    .join(', ');

  const description =
    city.metaDescription ||
    `Taxi služby v meste ${city.name} - Kompletný zoznam taxislužieb, kontakty a recenzie. ${taxiServicesList ? `Taxislužby: ${taxiServicesList}.` : ''} Nájdite spoľahlivé taxi v ${city.name}.`;

  return {
    title: `Taxi ${city.name} - Taxislužby a Kontakty | ${siteName}`,
    description,
    keywords: city.keywords || [
      `taxi ${city.name}`,
      `taxislužby ${city.name}`,
      `taxi ${city.region}`,
      'objednať taxi',
      'taxi online',
    ],
    openGraph: {
      title: `Taxi ${city.name} - Spoľahlivé taxislužby`,
      description,
      type: 'website',
      locale: 'sk_SK',
      url: currentUrl,
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Taxi ${city.name} - Spoľahlivé taxislužby`,
      description,
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

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);

  // 404 handling - Next.js way
  if (!city) {
    notFound();
  }

  const regionSlug = createRegionSlug(city.region);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name },
        ]}
      />

      {/* Taxi Services Section */}
      <section className="pt-4 md:pt-6 py-12 md:py-20 lg:py-24 px-4 md:px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
              Taxislužby v meste {city.name}
            </h2>
            <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
              Kompletný zoznam dostupných taxislužieb
            </p>
          </div>

          {city.taxiServices.length > 0 ? (
            <div className="grid gap-2">
              {[...city.taxiServices]
                .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
                .map((service, index) => {
                  // Generate slug for the taxi service
                  const serviceSlug = service.name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

                  return (
                    <Card key={index} className="perspective-1000">
                      <Link href={`/taxi/${citySlug}/${serviceSlug}`} title={`${service.name} - Detailné informácie a kontakt`}>
                        <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all cursor-pointer">
                          <CardHeader className="pb-1 pt-2.5 md:pt-3 px-3 md:px-4">
                            <CardTitle className="text-sm md:text-base font-bold flex items-center gap-1.5 md:gap-2">
                              <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-foreground flex-shrink-0" />
                              {service.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 pb-2.5 md:pb-3 px-3 md:px-4">
                            <div className="flex flex-col gap-0.5 md:gap-1 text-[11px] md:text-xs">
                              {service.phone && (
                                <div className="flex items-center gap-1 md:gap-1.5 text-foreground font-medium">
                                  <Phone className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                                  {service.phone}
                                </div>
                              )}
                              {service.website && (
                                <div className="flex items-center gap-1 md:gap-1.5 text-foreground font-medium">
                                  <Globe className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                                  <span>{truncateUrl(service.website)}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card className="perspective-1000">
              <div className="card-3d shadow-3d-lg">
                <CardContent className="py-8 md:py-12 px-4">
                  <div className="text-center space-y-3 md:space-y-4">
                    <MapPin className="h-12 w-12 md:h-16 md:w-16 text-foreground/50 mx-auto" />
                    <h3 className="text-xl md:text-2xl font-black text-foreground">
                      Zoznam taxislužieb sa pripravuje
                    </h3>
                    <p className="text-sm md:text-base text-foreground/70 font-bold px-4">
                      Čoskoro tu nájdete kompletný prehľad všetkých taxislužieb v meste {city.name}
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* City Content Section */}
      <CityContent citySlug={city.slug} cityName={city.name} />

      {/* FAQ Section */}
      <CityFAQ cityName={city.name} citySlug={city.slug} />

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
