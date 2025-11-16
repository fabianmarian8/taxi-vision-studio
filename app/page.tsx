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
 * - Client Component kvôli Lucide ikonám v articles
 */

'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Header } from '@/components/Header';
import { SearchPanel } from '@/components/SearchPanel';
import { RegionCard } from '@/components/RegionCard';
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { ArticleBanner } from '@/components/ArticleBanner';
import { getRegionsData } from '@/data/cities';
import { articles } from '@/data/articles';
import taxiLogo from '@/assets/taxi-nearme-logo.png';

// Note: Metadata je definovaná v app/layout.tsx (Server Component)
// Client Components nemôžu exportovať metadata

export default function HomePage() {
  const regions = getRegionsData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with 3D Effects */}
      <section className="pt-4 pb-12 md:pt-8 md:pb-24 lg:pb-32 px-4 md:px-8 relative hero-3d-bg">
        <GeometricLines variant="hero" count={10} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-2 md:space-y-3">
            {/* Taxi Logo */}
            <div className="mb-0">
              <img
                src={taxiLogo.src}
                alt="Taxi NearMe Logo"
                className="h-20 md:h-32 lg:h-40 xl:h-48 w-auto mx-auto drop-shadow-lg"
              />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-foreground drop-shadow-lg">
              Taxi NearMe - Nájdite taxi v každom meste
            </h1>

            <p className="text-base md:text-xl lg:text-2xl text-foreground/90 max-w-2xl mx-auto font-bold px-4">
              Kompletný katalóg taxislužieb na Slovensku. Nájdite spoľahlivé taxi kdekoľvek ste - rýchlo, jednoducho a vždy nablízku.
            </p>

            <div className="pt-4 md:pt-6">
              <SearchPanel />

              {/* Article Banner */}
              <div className="mt-6 md:mt-8">
                <ArticleBanner articles={articles} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regions Grid with 3D Cards */}
      <section id="cities" className="py-12 md:py-20 lg:py-24 px-4 md:px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
              Taxislužby na Slovensku
            </h2>
            <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
              Vyberte si kraj a nájdite spoľahlivé taxi vo vašom meste
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
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
      <section className="py-12 md:py-20 lg:py-24 px-4 md:px-8 relative">
        <GeometricLines variant="section" count={8} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
              Dostupné všade
            </h2>
            <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
              Napíšte nám ak tu chýba Vaša lokalita
            </p>
          </div>

          <div className="perspective-1000">
            <div className="relative bg-card rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 shadow-3d-lg card-3d min-h-[300px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-foreground rounded-full animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 text-center px-4">
                <MapPin
                  className="h-16 md:h-20 lg:h-24 w-16 md:w-20 lg:w-24 text-foreground mx-auto mb-4 md:mb-6"
                  strokeWidth={2.5}
                />
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-3 md:mb-4 text-foreground">
                  Databáza taxislužieb z celého Slovenska
                </h3>
                <p className="text-foreground/70 text-sm md:text-base lg:text-lg font-medium">
                  Pridajte sa k tisíckam užívateľov, ktorí jednoducho nachádzajú taxíky
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                href="/kontakt"
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
