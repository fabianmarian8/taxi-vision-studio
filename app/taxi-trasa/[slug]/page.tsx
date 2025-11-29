/**
 * Dynamická stránka pre taxi trasy medzi mestami
 *
 * URL: /taxi-trasa/[slug]
 * Príklad: /taxi-trasa/bratislava-zilina
 *
 * Obsahuje:
 * - Vzdialenosť a čas cesty
 * - Orientačnú cenu (1€/km)
 * - Interaktívnu mapu
 * - Taxi služby z oboch miest
 * - FAQ sekciu
 * - Schema.org markup
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, Car, ArrowLeft, Phone, HelpCircle, Euro, Navigation, Route } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { FooterLegal } from '@/components/FooterLegal';
import { CityRouteMapWrapper } from '@/components/CityRouteMapWrapper';
import cityRoutesData from '../../../src/data/city-routes.json';
import citiesData from '../../../src/data/cities.json';

interface CityRouteData {
  from: {
    name: string;
    slug: string;
    lat: number;
    lng: number;
  };
  to: {
    name: string;
    slug: string;
    lat: number;
    lng: number;
  };
  slug: string;
  distance_km: number;
  duration_min: number;
}

interface RoutePageProps {
  params: Promise<{ slug: string }>;
}

// Získanie trasy podľa slug
const getRouteBySlug = (slug: string): CityRouteData | undefined => {
  return (cityRoutesData.routes as CityRouteData[]).find(route => route.slug === slug);
};

// Získanie kanonického slug (abecedne zoradený)
const getCanonicalSlug = (slug: string): string => {
  const parts = slug.split('-');
  // Nájdi všetky možné rozdelenia na dve mestá
  for (let i = 1; i < parts.length; i++) {
    const city1 = parts.slice(0, i).join('-');
    const city2 = parts.slice(i).join('-');

    // Skontroluj či existuje v dátach
    const direct = cityRoutesData.routes.find(
      (r: CityRouteData) => r.slug === `${city1}-${city2}` || r.slug === `${city2}-${city1}`
    );
    if (direct) {
      return direct.slug;
    }
  }
  return slug;
};

// Získanie taxi služieb pre mesto
const getTaxiServicesForCity = (citySlug: string) => {
  const city = citiesData.cities.find(c => c.slug === citySlug);
  return city?.taxiServices?.slice(0, 5) || []; // Max 5 služieb
};

// Získanie podobných trás (trasy z/do rovnakých miest)
const getRelatedRoutes = (currentSlug: string, fromSlug: string, toSlug: string, limit: number = 6) => {
  const routes = cityRoutesData.routes as CityRouteData[];
  const related: CityRouteData[] = [];

  // Nájdi trasy obsahujúce jedno z miest
  for (const route of routes) {
    if (route.slug === currentSlug) continue;

    // Trasy z/do zdrojového mesta
    if (route.from.slug === fromSlug || route.to.slug === fromSlug ||
        route.from.slug === toSlug || route.to.slug === toSlug) {
      related.push(route);
    }

    if (related.length >= limit) break;
  }

  return related;
};

// Výpočet ceny
const calculatePrice = (distanceKm: number) => {
  const basePrice = 2.5; // Nástupné
  const pricePerKm = 1.0; // €/km
  const minPrice = Math.round(basePrice + distanceKm * 0.85);
  const maxPrice = Math.round(basePrice + distanceKm * 1.15);
  return { minPrice, maxPrice };
};

// Formátovanie času
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hod`;
  return `${hours} hod ${mins} min`;
};

export async function generateStaticParams() {
  return (cityRoutesData.routes as CityRouteData[]).map((route) => ({
    slug: route.slug,
  }));
}

export async function generateMetadata({ params }: RoutePageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = getCanonicalSlug(slug);
  const route = getRouteBySlug(canonicalSlug);

  if (!route) {
    return {
      title: 'Trasa nenájdená | TaxiNearMe.sk',
    };
  }

  const { minPrice, maxPrice } = calculatePrice(route.distance_km);
  const title = `Taxi ${route.from.name} - ${route.to.name} | Cena od ${minPrice}€ | TaxiNearMe.sk`;
  const description = `Taxi z ${route.from.name} do ${route.to.name}: ${route.distance_km} km, ${formatDuration(route.duration_min)}. Orientačná cena ${minPrice}-${maxPrice}€. Nájdite spoľahlivé taxi služby.`;

  // Názvy miest bez diakritiky pre keywords
  const fromNameNormalized = route.from.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const toNameNormalized = route.to.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  return {
    title,
    description,
    keywords: [
      // Hlavné kľúčové frázy - odpoveď od oponent
      `${route.from.name.toLowerCase()} ${route.to.name.toLowerCase()} taxi`,
      `${route.to.name.toLowerCase()} ${route.from.name.toLowerCase()} taxi`,
      `taxi ${route.from.name} ${route.to.name}`,
      `taxi ${route.to.name} ${route.from.name}`,
      // Bez diakritiky
      `${fromNameNormalized} ${toNameNormalized} taxi`,
      `taxi ${fromNameNormalized} ${toNameNormalized}`,
      // Ďalšie varianty
      `preprava ${route.from.name} ${route.to.name}`,
      `odvoz ${route.from.name} ${route.to.name}`,
      `taxi cena ${route.from.name}`,
      `taxi služby ${route.from.name}`,
      'taxi slovensko',
      'taxi cena za km',
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'sk_SK',
      siteName: 'TaxiNearMe.sk',
      url: `https://www.taxinearme.sk/taxi-trasa/${canonicalSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://www.taxinearme.sk/taxi-trasa/${canonicalSlug}`,
    },
    other: {
      // Geo tagy pre lokálne SEO
      'geo.region': 'SK',
      'geo.placename': `${route.from.name}, ${route.to.name}`,
      'geo.position': `${route.from.lat};${route.from.lng}`,
      'ICBM': `${route.from.lat}, ${route.from.lng}`,
      // Ďalšie meta tagy
      'revisit-after': '7 days',
      'author': 'TaxiNearMe.sk',
    },
  };
}

export default async function CityRoutePage({ params }: RoutePageProps) {
  const { slug } = await params;
  const canonicalSlug = getCanonicalSlug(slug);

  // Redirect na kanonický URL ak sa líši
  if (slug !== canonicalSlug) {
    redirect(`/taxi-trasa/${canonicalSlug}`);
  }

  const route = getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  const { minPrice, maxPrice } = calculatePrice(route.distance_km);
  const fromTaxis = getTaxiServicesForCity(route.from.slug);
  const toTaxis = getTaxiServicesForCity(route.to.slug);
  const relatedRoutes = getRelatedRoutes(slug, route.from.slug, route.to.slug, 6);

  // BreadcrumbList Schema - KRITICKÉ pre SEO
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Domov',
        item: 'https://www.taxinearme.sk',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Taxi trasy',
        item: 'https://www.taxinearme.sk/taxi-trasa',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${route.from.name} - ${route.to.name}`,
        item: `https://www.taxinearme.sk/taxi-trasa/${slug}`,
      },
    ],
  };

  // TaxiService Schema - správny typ pre taxi služby
  const taxiServiceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    name: `Taxi ${route.from.name} - ${route.to.name}`,
    description: `Taxi preprava z ${route.from.name} do ${route.to.name}. Vzdialenosť ${route.distance_km} km, čas cesty ${formatDuration(route.duration_min)}.`,
    provider: {
      '@type': 'Organization',
      name: 'TaxiNearMe.sk',
      url: 'https://www.taxinearme.sk',
    },
    areaServed: [
      {
        '@type': 'City',
        name: route.from.name,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: route.from.lat,
          longitude: route.from.lng,
        },
      },
      {
        '@type': 'City',
        name: route.to.name,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: route.to.lat,
          longitude: route.to.lng,
        },
      },
    ],
    priceRange: `${minPrice}€ - ${maxPrice}€`,
    offers: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: minPrice,
        priceCurrency: 'EUR',
        minPrice: minPrice,
        maxPrice: maxPrice,
      },
    },
  };

  // FAQ data
  const faqItems = [
    {
      question: `Koľko stojí taxi z ${route.from.name} do ${route.to.name}?`,
      answer: `Orientačná cena taxi z ${route.from.name} do ${route.to.name} je ${minPrice}-${maxPrice}€. Konečná cena závisí od konkrétnej taxi služby, typu vozidla a času jazdy.`,
    },
    {
      question: `Ako dlho trvá cesta taxíkom z ${route.from.name} do ${route.to.name}?`,
      answer: `Cesta taxíkom z ${route.from.name} do ${route.to.name} trvá približne ${formatDuration(route.duration_min)}. Skutočný čas závisí od dopravnej situácie.`,
    },
    {
      question: `Aká je vzdialenosť medzi ${route.from.name} a ${route.to.name}?`,
      answer: `Vzdialenosť medzi ${route.from.name} a ${route.to.name} je približne ${route.distance_km} km po ceste.`,
    },
    {
      question: `Kde nájdem taxi v ${route.from.name}?`,
      answer: `Na stránke TaxiNearMe.sk nájdete zoznam overených taxi služieb v ${route.from.name} s kontaktnými údajmi a hodnoteniami.`,
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(taxiServiceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <Header />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-yellow/20 via-white to-white py-12 md:py-16">
          <div className="container mx-auto max-w-4xl px-4 md:px-8">
            <Link
              href="/taxi-trasa"
              className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Späť na taxi trasy
            </Link>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-6">
              Taxi {route.from.name} - {route.to.name}
            </h1>

            <p className="text-lg text-foreground/70 mb-8">
              Hľadáte spoľahlivú taxi prepravu z {route.from.name} do {route.to.name}?
              Nižšie nájdete všetky potrebné informácie vrátane vzdialenosti, času cesty a orientačnej ceny.
            </p>

            {/* Route Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 bg-white/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-yellow/20">
                    <MapPin className="h-5 w-5 text-primary-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Vzdialenosť</p>
                    <p className="font-bold text-foreground">{route.distance_km} km</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-yellow/20">
                    <Clock className="h-5 w-5 text-primary-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Čas cesty</p>
                    <p className="font-bold text-foreground">{formatDuration(route.duration_min)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Euro className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Cena od</p>
                    <p className="font-bold text-green-600">{minPrice} - {maxPrice}€</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-yellow/20">
                    <Car className="h-5 w-5 text-primary-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Trasa</p>
                    <p className="font-bold text-foreground text-xs">{route.from.name} → {route.to.name}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Hero CTA - rýchly prístup k taxi službám */}
            {(fromTaxis.length > 0 || toTaxis.length > 0) && (
              <div className="flex flex-wrap gap-3">
                {fromTaxis[0]?.phone && (
                  <a
                    href={`tel:${fromTaxis[0].phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                  >
                    <Phone className="h-5 w-5" />
                    Zavolať taxi {route.from.name}
                  </a>
                )}
                <Link
                  href="#taxi-sluzby"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-yellow text-foreground font-bold rounded-lg hover:bg-primary-yellow/90 transition-colors shadow-lg"
                >
                  <Car className="h-5 w-5" />
                  Zobraziť všetky taxi
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Map Section */}
        <section className="py-8 md:py-12 px-4 md:px-8">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Navigation className="h-6 w-6 text-primary-yellow" />
              Mapa trasy
            </h2>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <CityRouteMapWrapper
                fromLat={route.from.lat}
                fromLng={route.from.lng}
                fromName={route.from.name}
                toLat={route.to.lat}
                toLng={route.to.lng}
                toName={route.to.name}
              />
            </div>
          </div>
        </section>

        {/* Taxi Services Section - hneď pod mapou */}
        <section id="taxi-sluzby" className="py-8 md:py-12 px-4 md:px-8 bg-foreground/5 scroll-mt-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Car className="h-6 w-6 text-primary-yellow" />
              Taxi služby pre túto trasu
            </h2>

            {/* From City Taxis */}
            {fromTaxis.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Taxi služby v {route.from.name}
                </h3>
                <div className="grid gap-3">
                  {fromTaxis.map((taxi, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{taxi.name}</h4>
                          {taxi.phone && (
                            <p className="text-sm text-foreground/70">{taxi.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {taxi.phone && (
                            <a
                              href={`tel:${taxi.phone.replace(/\s/g, '')}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Phone className="h-4 w-4" />
                              Zavolať
                            </a>
                          )}
                          <Link
                            href={`/taxi/${route.from.slug}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-yellow text-foreground font-semibold rounded-lg hover:bg-primary-yellow/90 transition-colors text-sm"
                          >
                            Detail
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Link
                  href={`/taxi/${route.from.slug}`}
                  className="inline-block mt-4 text-primary-yellow font-semibold hover:underline"
                >
                  Zobraziť všetky taxi služby v {route.from.name} →
                </Link>
              </div>
            )}

            {/* To City Taxis */}
            {toTaxis.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Taxi služby v {route.to.name}
                </h3>
                <div className="grid gap-3">
                  {toTaxis.map((taxi, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{taxi.name}</h4>
                          {taxi.phone && (
                            <p className="text-sm text-foreground/70">{taxi.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {taxi.phone && (
                            <a
                              href={`tel:${taxi.phone.replace(/\s/g, '')}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Phone className="h-4 w-4" />
                              Zavolať
                            </a>
                          )}
                          <Link
                            href={`/taxi/${route.to.slug}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-yellow text-foreground font-semibold rounded-lg hover:bg-primary-yellow/90 transition-colors text-sm"
                          >
                            Detail
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Link
                  href={`/taxi/${route.to.slug}`}
                  className="inline-block mt-4 text-primary-yellow font-semibold hover:underline"
                >
                  Zobraziť všetky taxi služby v {route.to.name} →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Content Section - popisné texty */}
        <section className="py-8 md:py-12 px-4 md:px-8">
          <div className="container mx-auto max-w-4xl">
            <article className="prose prose-lg max-w-none">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Taxi preprava {route.from.name} - {route.to.name}
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-6">
                Plánujete cestu z {route.from.name} do {route.to.name}? Taxi je jednou z najpohodlnejších
                možností prepravy na tejto trase. S dĺžkou {route.distance_km} km a časom cesty
                približne {formatDuration(route.duration_min)} je taxi ideálnou voľbou pre tých,
                ktorí preferujú komfort a flexibilitu.
              </p>

              <h3 className="text-lg font-bold text-foreground mb-3">
                Prečo zvoliť taxi na trase {route.from.name} - {route.to.name}?
              </h3>
              <ul className="list-disc list-inside text-foreground/80 space-y-2 mb-6">
                <li>Vyzdvihnutie priamo na vašej adrese v {route.from.name}</li>
                <li>Dovoz až k cieľu v {route.to.name}</li>
                <li>Bez prestupovania a čakania na spoje</li>
                <li>Možnosť prepravy batožiny bez obmedzení</li>
                <li>Flexibilný čas odchodu podľa vašich potrieb</li>
              </ul>

              <h3 className="text-lg font-bold text-foreground mb-3">
                Tipy pre objednanie taxi
              </h3>
              <p className="text-foreground/80 leading-relaxed mb-6">
                Pri objednávaní taxi na dlhšiu trasu odporúčame objednať si vozidlo s dostatočným
                predstihom, najmä v ranných a večerných špičkách. Uveďte presnú adresu vyzdvihnutia
                a cieľa, počet cestujúcich a množstvo batožiny. Väčšina taxi služieb ponúka aj
                možnosť platby kartou priamo vo vozidle.
              </p>
            </article>
          </div>
        </section>

        {/* Related Routes Section - Interlinking pre SEO */}
        {relatedRoutes.length > 0 && (
          <section className="py-8 md:py-12 px-4 md:px-8">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Route className="h-6 w-6 text-primary-yellow" />
                Podobné trasy
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedRoutes.map((relatedRoute) => {
                  const { minPrice: relMinPrice } = calculatePrice(relatedRoute.distance_km);
                  return (
                    <Link
                      key={relatedRoute.slug}
                      href={`/taxi-trasa/${relatedRoute.slug}`}
                      className="group"
                    >
                      <Card className="p-4 hover:shadow-md transition-all hover:border-primary-yellow/50">
                        <h3 className="font-bold text-foreground group-hover:text-primary-yellow transition-colors mb-2">
                          {relatedRoute.from.name} → {relatedRoute.to.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-foreground/60">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {relatedRoute.distance_km} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(relatedRoute.duration_min)}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold mt-2">
                          od {relMinPrice}€
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-foreground/5">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-primary-yellow" />
              Časté otázky
            </h2>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-bold text-foreground mb-3">{item.question}</h3>
                  <p className="text-foreground/70">{item.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 md:py-12 px-4 md:px-8 bg-primary-yellow/10">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              Potrebujete opačnú trasu?
            </h2>
            <p className="text-foreground/70 mb-6">
              Hľadáte taxi z {route.to.name} do {route.from.name}? Vzdialenosť a čas sú rovnaké.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/taxi/${route.from.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-yellow text-foreground font-bold rounded-lg hover:bg-primary-yellow/90 transition-colors"
              >
                <Phone className="h-5 w-5" />
                Taxi {route.from.name}
              </Link>
              <Link
                href={`/taxi/${route.to.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-white font-bold rounded-lg hover:bg-foreground/90 transition-colors"
              >
                <Phone className="h-5 w-5" />
                Taxi {route.to.name}
              </Link>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 px-4 md:px-8 bg-foreground/5">
          <div className="container mx-auto max-w-4xl">
            <p className="text-sm text-foreground/50 text-center">
              Uvedené ceny sú orientačné a môžu sa líšiť v závislosti od konkrétnej taxi služby,
              typu vozidla, času jazdy a aktuálnej dopravnej situácie. Pre presnú cenu kontaktujte
              priamo vybranú taxi službu.
            </p>
          </div>
        </section>

        {/* Footer */}
        <FooterLegal />
      </div>
    </>
  );
}
