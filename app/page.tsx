/**
 * Homepage - Next.js App Router
 *
 * DOČASNÉ RIEŠENIE: Tento súbor je placeholder pre migráciu.
 * V ďalšom kroku sem prenesieme obsah z src/pages/Index.tsx
 *
 * TODO: Migruj obsah z src/pages/Index.tsx sem
 * - Odstráň SEOHead komponent (nahradený metadata exportom)
 * - Zachovaj všetky ostatné komponenty (Header, SearchPanel, RegionCard, ...)
 */

import type { Metadata } from 'next';

// Metadata pre homepage (dočasné - rozšírime pri plnej migrácii)
export const metadata: Metadata = {
  title: 'Taxi NearMe - Nájdite Taxi v Každom Meste na Slovensku',
  description:
    'Nájdite spoľahlivé taxislužby v každom meste na Slovensku. Bratislava, Košice, Prešov, Žilina a ďalších 8 miest. Rýchlo, jednoducho a vždy nablízku.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-6xl font-black text-center mb-8">
          Taxi NearMe
        </h1>
        <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto">
          Next.js migrácia prebieha...
          <br />
          <span className="text-sm mt-4 block">
            (Plný obsah z src/pages/Index.tsx bude migrovaný v ďalšom kroku)
          </span>
        </p>
      </div>
    </div>
  );
}
