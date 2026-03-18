'use client';

/** Migrované z: src/vite-pages/PriceComparisonPage.tsx */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { PriceCalculator } from "@/components/PriceCalculator";
import { PriceRankings } from "@/components/PriceRankings";
import { PriceInsights } from "@/components/PriceInsights";
import { PriceCharts } from "@/components/PriceCharts";
import { SlovakiaMap } from "@/components/SlovakiaMap";
import { CityLinksSection } from "@/components/CityLinksSection";
import { Button } from "@/components/ui/button";
import { Download, Share2, FileText } from "lucide-react";
import { toast } from "sonner";
import { ArticleAuthor } from "@/components/ArticleAuthor";
import { NextWebBanner } from "@/components/NextWebBanner";

// Helper funkcia na formátovanie dátumu - konzistentná medzi SSR/CSR
// Používame rovnaký formát ako v ArticleBanner
const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const months = [
    'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
    'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'
  ];
  return `${day}. ${months[month - 1]} ${year}`;
};

interface PriceData {
  meta: {
    title: string;
    description: string;
    lastUpdated: string;
    citiesCount: number;
    averagePricePerKm: number;
  };
  cities: Array<{
    id: string;
    name: string;
    slug: string;
    region: string;
    latitude: number;
    longitude: number;
    prices: {
      nastupne: number;
      cenaZaKm: number;
      cakanie: number;
      odhad5km: number;
    };
    notes: string;
    ranking: {
      nastupne: number;
      cenaZaKm: number;
      celkovo: number;
    };
  }>;
  rankings: {
    najlacnejsieNastupne: Array<{ mesto: string; cena: number }>;
    najdrahsieNastupne: Array<{ mesto: string; cena: number }>;
    najlacnejsieZaKm: Array<{ mesto: string; cena: number }>;
    najdrahsieZaKm: Array<{ mesto: string; cena: number }>;
    najlacnejsie5km: Array<{ mesto: string; cena: number }>;
    najdrahsie5km: Array<{ mesto: string; cena: number }>;
  };
  insights: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  methodology: {
    description: string;
    sources: string[];
    note: string;
  };
}

export function PriceComparisonContent() {
  const router = useRouter();
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    // Load price data
    fetch('/data/taxi-prices-2025.json')
      .then(res => res.json())
      .then(data => {
        setPriceData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading price data:', err);
        toast.error('Nepodarilo sa načítať dáta o cenách');
        setLoading(false);
      });
  }, []);

  const handleDownloadCSV = () => {
    window.open('/data/taxi-prices-2025.csv', '_blank');
    toast.success('CSV súbor sa sťahuje');
  };

  const handleDownloadJSON = () => {
    window.open('/data/taxi-prices-2025.json', '_blank');
    toast.success('JSON súbor sa sťahuje');
  };

  const handleShare = async () => {
    // Bezpečný prístup k window.location len v event handleri
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: 'Index cien taxislužieb na Slovensku 2025',
      text: 'Porovnanie cien taxi v slovenských mestách. Kde je najlacnejšie?',
      url: currentUrl
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Úspešne zdieľané');
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(currentUrl);
      toast.success('Link skopírovaný do schránky');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Načítavam dáta...</p>
        </div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60">Nepodarilo sa načítať dáta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <NextWebBanner />

      {/* Hero Section */}
      <section className="pt-8 pb-12 md:pt-12 md:pb-16 px-4 md:px-8 relative hero-3d-bg">
        <GeometricLines variant="hero" count={10} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-4">
            <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-2">
              📊 Prieskum 2024/2025
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground">
              Index cien taxislužieb<br />na Slovensku 2025
            </h1>

            <p className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto font-medium">
              Komplexné porovnanie cien taxi v {priceData.meta.citiesCount} najväčších slovenských mestách.
              Zistite, kde je najlacnejšie a najdrahšie cestovať taxíkom.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button
                onClick={handleDownloadCSV}
                variant="default"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Stiahnuť CSV
              </Button>
              <Button
                onClick={handleDownloadJSON}
                variant="outline"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Stiahnuť JSON
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Zdieľať
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3 text-sm text-foreground/60">
              <span>Posledná aktualizácia: {formatDate(priceData.meta.lastUpdated)}</span>
              <span className="hidden sm:block">•</span>
              <ArticleAuthor variant="inline" />
            </div>
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative">
        <div className="container mx-auto max-w-7xl">
          <PriceInsights insights={priceData.insights} />
        </div>
      </section>

      {/* Interactive Map */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative">
        <GeometricLines variant="section" count={8} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">
              Mapa cien na Slovensku
            </h2>
            <p className="text-lg text-foreground/80">
              Kliknite na mesto pre zobrazenie detailov
            </p>
          </div>

          <SlovakiaMap
            cities={priceData.cities}
            selectedCity={selectedCity}
            onCitySelect={setSelectedCity}
          />
        </div>
      </section>

      {/* Price Calculator */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">
              Kalkulačka cien
            </h2>
            <p className="text-lg text-foreground/80">
              Vypočítajte si odhadovanú cenu jazdy vo vašom meste
            </p>
          </div>

          <PriceCalculator cities={priceData.cities} />
        </div>
      </section>

      {/* Rankings */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">
              Rebríčky miest
            </h2>
            <p className="text-lg text-foreground/80">
              Najlacnejšie a najdrahšie mestá podľa rôznych kritérií
            </p>
          </div>

          <PriceRankings rankings={priceData.rankings} />
        </div>
      </section>

      {/* Charts */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative bg-card/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">
              Grafické porovnanie
            </h2>
            <p className="text-lg text-foreground/80">
              Vizualizácia cenových rozdielov medzi mestami
            </p>
          </div>

          <PriceCharts cities={priceData.cities} />
        </div>
      </section>

      {/* Methodology */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-black mb-6 text-foreground">
              Metodológia prieskumu
            </h2>

            <p className="text-foreground/80 mb-6 leading-relaxed">
              {priceData.methodology.description}
            </p>

            <h3 className="text-xl font-bold mb-4 text-foreground">Zdroje dát:</h3>
            <ul className="list-disc list-inside space-y-2 mb-6 text-foreground/80">
              {priceData.methodology.sources.map((source, index) => (
                <li key={index}>{source}</li>
              ))}
            </ul>

            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
              <p className="text-sm text-foreground/80">
                <strong>Poznámka:</strong> {priceData.methodology.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* City Links Section */}
      <CityLinksSection />

      {/* Autor článku */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="border-t border-foreground/10 pt-8">
            <h3 className="text-lg font-bold text-foreground mb-4">O autorovi</h3>
            <ArticleAuthor variant="card" showBio />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative hero-3d-bg">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground">
            Hľadáte taxi vo vašom meste?
          </h2>
          <p className="text-lg text-foreground/80 mb-8">
            Nájdite spoľahlivé taxislužby s telefónnymi číslami a webovými stránkami
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/')}
            className="text-lg px-8 py-6"
          >
            Vyhľadať taxislužby
          </Button>
        </div>
      </section>

    </div>
  );
}
