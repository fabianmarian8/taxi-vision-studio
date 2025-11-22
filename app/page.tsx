/**
 * Homepage - Next.js App Router
 *
 * Migrované z: src/vite-pages/Index.tsx
 *
 * Zmeny oproti Vite verzii:
 * - SEOHead komponent → metadata export (Next.js Metadata API)
 * - Link z react-router-dom → next/link
 * - taxiLogo import upravený pre Next.js static assets
 * - Všetky komponenty ostali rovnaké (Header, SearchPanel, RegionCard, ...)
 * - Server Component s vnoreným Client Components pre optimálne SEO
 */

import Link from 'next/link';
import Image from 'next/image';
import { MapPinIcon } from '@/components/icons/MapPinIcon';
import { Header } from '@/components/Header';
import { SearchPanel } from '@/components/SearchPanel';
import { RegionCard } from '@/components/RegionCard';
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { ArticleBanner } from '@/components/ArticleBanner';
import { getRegionsData } from '@/data/cities';
import taxiLogo from '@/assets/taxi-nearme-logo.png';

// Note: Globálna metadata je definovaná v app/layout.tsx
// HomePage je Server Component, ktorý obsahuje vnorené Client Components (Header, SearchPanel, ArticleBanner)

export default function HomePage() {
  const regions = getRegionsData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with 3D Effects */}
      <section className="pt-4 pb-6 md:pt-8 md:pb-8 px-4 md:px-8 relative hero-3d-bg">
        <GeometricLines variant="hero" count={10} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-2 md:space-y-3">
            {/* Taxi Logo */}
            <div className="mb-0">
              <Image
                src={taxiLogo}
                alt="Taxi NearMe Logo"
                className="h-20 md:h-32 lg:h-40 xl:h-48 w-auto mx-auto drop-shadow-lg"
                width={192}
                height={192}
                priority
              />
            </div>

            <h1 className="text-sm md:text-xl lg:text-2xl xl:text-3xl font-black tracking-tight text-foreground drop-shadow-lg">
              Nájdite taxi v každom meste
            </h1>

            <p className="text-xs md:text-sm lg:text-base text-foreground/90 max-w-2xl mx-auto font-bold px-4">
              Kompletný katalóg taxislužieb na Slovensku. Nájdite spoľahlivé taxi kdekoľvek ste - rýchlo, jednoducho a vždy nablízku.
            </p>
          </div>
        </div>
      </section>

      {/* Black line separator */}
      <div className="border-b-4 border-foreground"></div>

      {/* White background wrapper for everything below the line */}
      <div className="bg-white">
        {/* Search and Articles Section */}
        <section className="pt-6 pb-12 md:pt-8 md:pb-16 px-4 md:px-8 relative">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center">
              <SearchPanel />

              {/* Article Banner */}
              <div className="mt-6 md:mt-8">
                <ArticleBanner />
              </div>
            </div>
          </div>
        </section>
        {/* Regions Grid with 3D Cards */}
        <section id="cities" className="py-7 md:py-12 lg:py-14 px-2 md:px-5 relative">
          <GeometricLines variant="subtle" count={6} />

          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-5 md:mb-7 lg:mb-10">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 text-foreground drop-shadow-md">
                Taxislužby na Slovensku
              </h2>
              <p className="text-xs md:text-base text-foreground/90 font-bold px-2">
                Vyberte si kraj a nájdite spoľahlivé taxi vo vašom meste
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-5">
              {regions.map((region) => (
                <RegionCard
                  key={region.slug}
                  name={region.name}
                  slug={region.slug}
                  citiesCount={region.citiesCount}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Map Section with 3D Effect */}
        <section className="py-7 md:py-12 lg:py-14 px-2 md:px-5 relative">
          <GeometricLines variant="section" count={8} />

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-5 md:mb-7 lg:mb-10">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 text-foreground drop-shadow-md">
                Dostupné všade
              </h2>
              <p className="text-xs md:text-sm text-foreground/90 font-bold px-2">
                Napíšte nám ak tu chýba Vaša lokalita
              </p>
            </div>

            <div className="perspective-1000">
              <div className="relative bg-card rounded-xl md:rounded-2xl p-5 md:p-7 lg:p-10 shadow-3d-lg card-3d min-h-[180px] md:min-h-[240px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-foreground rounded-full animate-pulse"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 text-center px-2">
                  <MapPinIcon
                    className="h-10 md:h-12 lg:h-14 w-10 md:w-12 lg:w-14 text-foreground mx-auto mb-2 md:mb-4"
                    strokeWidth={2.5}
                  />
                  <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-2 md:mb-2 text-foreground">
                    Databáza taxislužieb z celého Slovenska
                  </h3>
                  <p className="text-foreground/70 text-xs md:text-sm lg:text-base font-medium">
                    Pridajte sa k tisíckam užívateľov, ktorí jednoducho nachádzajú taxíky
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer with 3D Border */}
        <footer className="border-t-4 border-foreground py-5 md:py-7 px-2 md:px-5 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
              <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
                © 2024 Taxi NearMe. Všetky práva vyhradené.
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:gap-5">
                <Link
                  href="/ochrana-sukromia"
                  className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
                  title="Ochrana súkromia a GDPR"
                >
                  Ochrana súkromia
                </Link>
                <Link
                  href="/podmienky-pouzivania"
                  className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
                  title="Podmienky používania služby"
                >
                  Podmienky používania
                </Link>
                <Link
                  href="/kontakt"
                  className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
                  title="Kontaktný formulár"
                >
                  Kontakt
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
