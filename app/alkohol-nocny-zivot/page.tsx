/** Migrované z: src/vite-pages/AlkoholNocnyZivotPage.tsx */

import { Metadata } from "next";
import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { SEOBreadcrumbs } from "@/components/SEOBreadcrumbs";
import { ShareButton } from "@/components/ShareButton";

export const metadata: Metadata = {
  title: 'Alkohol, nočný život a taxík | TaxiNearMe.sk',
  description: 'Hranica medzi službou a záchrannou misiou. Kedy môže vodič odmietnuť jazdu a ako sa správať v noci.',
  keywords: ['taxi bezpečnosť', 'alkohol taxi', 'nočný život', 'opitý zákazník', 'taxislužby', 'správanie v taxi'],
  openGraph: {
    title: 'Alkohol, nočný život a taxík',
    description: 'Hranica medzi službou a záchrannou misiou. Kedy môže vodič odmietnuť jazdu a ako sa správať v noci.',
    url: 'https://www.taxinearme.sk/alkohol-nocny-zivot',
    type: 'article',
    images: [{
      url: 'https://www.taxinearme.sk/taxi-nearme-logo.png',
      width: 1200,
      height: 630,
      alt: 'Alkohol, nočný život a taxík'
    }],
    publishedTime: '2025-01-15',
    modifiedTime: '2025-01-15'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alkohol, nočný život a taxík',
    description: 'Hranica medzi službou a záchrannou misiou. Kedy môže vodič odmietnuť jazdu a ako sa správať v noci.',
    images: ['https://www.taxinearme.sk/taxi-nearme-logo.png']
  },
  alternates: {
    canonical: 'https://www.taxinearme.sk/alkohol-nocny-zivot'
  }
};

export default function AlkoholNocnyZivotPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SEOBreadcrumbs items={[
        { label: 'Alkohol a nočný život' }
      ]} />

      <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-8 relative hero-3d-bg overflow-hidden">
        <GeometricLines variant="hero" count={12} />

        <div className="container mx-auto max-w-4xl relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Späť na hlavnú stránku
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Bezpečnosť
            </span>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Calendar className="h-4 w-4" />
              15. január 2025
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
            Alkohol, nočný život a taxík
          </h1>

          <p className="text-xl text-foreground/80 mb-6">
            Hranica medzi službou a záchrannou misiou. Kedy môže vodič odmietnuť jazdu a ako sa správať v noci.
          </p>

          <ShareButton
            title="Alkohol, nočný život a taxík"
          />
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 md:px-8 bg-white">
        <div className="container mx-auto max-w-4xl">
          <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800">

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
              <p className="text-lg font-semibold text-gray-900">
                Keď hodiny ukážu polnoc a z klubov a barov sa valí unavený a často podnapitý dav, taxikári vstupujú do svojej najrizikovejšej pracovnej zmeny.
              </p>
            </div>

            <p className="text-lg leading-relaxed">
              Odvoz opitých zákazníkov je súčasť práce, ale kde končí služba a začína osobné riziko? Vodič taxi nie je sanitka ani psychológ. Predsa sa často nachádza v situáciách, ktoré vyžadujú rozhodnutie: Vziať problémového zákazníka, alebo radšej odmietnuť?
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
              <Shield className="h-8 w-8 inline mr-2 text-primary" />
              Čísla, ktoré hovoria jasnou rečou
            </h2>

            <div className="bg-gray-900 text-white p-8 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-6">Globálne štatistiky</h3>

              <p className="mb-4">
                Práca taxikára patrí medzi najnebezpečnejšie povolania. V USA sú vodiči taxi 30-60× viac ohrození násilím a vraždou než priemer pracujúcich.
              </p>

              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-red-900/50 p-4 rounded-lg">
                  <p className="text-3xl font-bold mb-2">82%</p>
                  <p className="text-sm">fatálnych útokov sa stáva v noci</p>
                </div>
                <div className="bg-red-900/50 p-4 rounded-lg">
                  <p className="text-3xl font-bold mb-2">94%</p>
                  <p className="text-sm">útokov pochádza zvnútra vozidla</p>
                </div>
                <div className="bg-red-900/50 p-4 rounded-lg">
                  <p className="text-3xl font-bold mb-2">80%</p>
                  <p className="text-sm">útokov prichádza zo sedadla priamo za vodičom</p>
                </div>
                <div className="bg-red-900/50 p-4 rounded-lg">
                  <p className="text-3xl font-bold mb-2">66%</p>
                  <p className="text-sm">útočníkov je mladších ako 20 rokov</p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">Právny rámec: Kedy môže vodič odmietnuť jazdu?</h2>

            <div className="bg-blue-50 p-8 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-4">Slovenský kontext</h3>
              <p>
                Na Slovensku platí pre vodičov úplná nulová tolerancia alkoholu (0,0% BAC), pričom profesionálni vodiči vrátane taxikárov musia dodržiavať tento limit.
              </p>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">Kedy je odmietnutie jazdy LEGITÍMNE</h3>

            <div className="space-y-6 my-8">
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-bold text-lg mb-3">1. Bezpečnostné dôvody</h4>
                <ul className="space-y-1">
                  <li>• Násilné správanie</li>
                  <li>• Obscénne gestá</li>
                  <li>• Hlasné nadávky</li>
                  <li>• Vyhrážky</li>
                  <li>• Viditeľné opitie s agresívnym správaním</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-bold text-lg mb-3">2. Neznáma destinácia</h4>
                <p>Vodič má právo poznať presnú adresu cieľa. Neurčité odpovede ako "Niekde v centre" alebo "Poviem cestou" sú dôvodom na odmietnutie.</p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-bold text-lg mb-3">3. Platobná schopnosť</h4>
                <p>Vodič môže požadovať zálohu alebo časť sumy vopred, ak existuje podozrenie, že pasažier nebude schopný zaplatiť.</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">Praktické scenáre: Kedy povedať NIE</h2>

            <div className="space-y-8 my-8">
              <div className="border-l-4 border-yellow-400 pl-6">
                <h3 className="text-xl font-bold mb-3">Scenár 1: Viditeľne opitý pasažier</h3>

                <p className="font-semibold mb-2">Signály:</p>
                <ul className="space-y-1 mb-4">
                  <li>• Nezrozumiteľná reč</li>
                  <li>• Neistá chôdza</li>
                  <li>• Hlasnosť</li>
                  <li>• Agresívne správanie</li>
                </ul>

                <p className="font-semibold mb-2">Správny postup:</p>
                <ol className="space-y-1">
                  <li>1. Komunikuj jasne a pokojne</li>
                  <li>2. Upozorni, že nie je v stave bezpečnej prepravy</li>
                  <li>3. Ponúkni alternatívu (počkať, zavolať niekoho)</li>
                  <li>4. Ak odmietne – odmietni jazdu</li>
                </ol>
              </div>

              <div className="border-l-4 border-orange-400 pl-6">
                <h3 className="text-xl font-bold mb-3">Scenár 2: Skupina mladých opitých pasažierov</h3>

                <p className="bg-red-100 p-3 rounded mb-4">
                  <strong>Riziko:</strong> 80% útokov prichádza zo sedadla priamo za vodičom.
                </p>

                <p className="font-semibold mb-2">Správny postup:</p>
                <ol className="space-y-1">
                  <li>1. Požiadaj pasažierov, aby nesedeli priamo za tebou</li>
                  <li>2. Ideálne ich posadi naproti, kde ich vidíš</li>
                  <li>3. Maj nachystané hygienické vrecká</li>
                  <li>4. Informuj dispečing o cieli a zmene trasy</li>
                  <li>5. Pri agresívnom správaní zastav a vypusť pasažierov</li>
                </ol>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">Bezpečnostné tipy pre vodičov</h2>

            <div className="bg-blue-50 p-8 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-6">Pred jazdou</h3>

              <p className="mb-4">
                <strong>Nadviazanie očného kontaktu je kľúčové.</strong> Ukáž pasažierovi: "Vidím ťa, ty vidíš mňa, dokážem ťa identifikovať."
              </p>

              <p className="font-semibold mb-3">Kontrolný zoznam:</p>
              <ul className="space-y-2">
                <li>✓ Nadviazanie očného kontaktu</li>
                <li>✓ Posúdenie stavu pasažiera (opitosť, agresivita)</li>
                <li>✓ Potvrdenie presnej adresy</li>
                <li>✓ Informovanie dispečingu</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">Záver: Tvoja bezpečnosť má prednosť</h2>

            <div className="bg-gray-900 text-white p-8 rounded-lg my-8">
              <p className="text-xl font-bold mb-4">Červená čiara</p>
              <p className="text-lg">
                Tvoja bezpečnosť má VŽDY prednosť pred povinnosťou starostlivosti.
              </p>
            </div>

          </article>

          {/* FAQ Section */}
          <ArticleFAQ
            articleSlug="alkohol-nocny-zivot"
            articleTitle="Často kladené otázky o nočnom živote a taxi"
          />

          <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <h3 className="text-2xl font-bold mb-4 text-center">Chcete vidieť komplexný sprievodca taxislužbami?</h3>
            <p className="text-center text-gray-700 mb-6">
              Prečítajte si všetko, čo potrebujete vedieť o taxi na Slovensku v roku 2025.
            </p>
            <div className="flex justify-center">
              <Link href="/komplexny-sprievodca-taxi">
                <Button size="lg" className="gap-2">
                  Zobraziť sprievodcu
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
