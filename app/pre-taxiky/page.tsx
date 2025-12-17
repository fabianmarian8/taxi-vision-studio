import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { GeometricLines } from '@/components/GeometricLines';
import {
  Crown,
  Star,
  TrendingUp,
  Eye,
  Award,
  Image as ImageIcon,
  FileText,
  Search,
  Phone,
  Globe,
  CheckCircle2,
  ArrowRight,
  Users,
  MapPin,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO_CONSTANTS } from '@/lib/seo-constants';

export const metadata: Metadata = {
  title: 'Pre taxislužby - PREMIUM a PARTNER program | Taxi NearMe',
  description:
    'Zvýšte viditeľnosť vašej taxislužby na najväčšom slovenskom portáli. PREMIUM zvýraznenie a PARTNER program pre profesionálne taxislužby.',
  keywords: [
    'taxi reklama',
    'propagácia taxislužby',
    'taxi marketing',
    'taxislužba online',
    'taxi portál slovensko',
  ],
  openGraph: {
    title: 'Pre taxislužby - PREMIUM a PARTNER program | Taxi NearMe',
    description: 'Zvýšte viditeľnosť vašej taxislužby na najväčšom slovenskom portáli.',
    type: 'website',
    locale: 'sk_SK',
    url: 'https://www.taxinearme.sk/pre-taxiky',
    siteName: 'TaxiNearMe.sk',
    images: [{ url: SEO_CONSTANTS.defaultImage, width: SEO_CONSTANTS.defaultImageWidth, height: SEO_CONSTANTS.defaultImageHeight }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SEO_CONSTANTS.twitterSite,
    title: 'Pre taxislužby - PREMIUM a PARTNER program | Taxi NearMe',
    description: 'Zvýšte viditeľnosť vašej taxislužby na najväčšom slovenskom portáli.',
    images: [SEO_CONSTANTS.defaultImage],
  },
  alternates: {
    canonical: 'https://www.taxinearme.sk/pre-taxiky',
  },
};

function Footer() {
  return (
    <footer className="border-t border-foreground/30 py-8 md:py-12 px-4 md:px-8 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
            © 2025 Taxi NearMe. Všetky práva vyhradené.
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link
              href="/ochrana-sukromia"
              className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Ochrana súkromia
            </Link>
            <Link
              href="/podmienky-pouzivania"
              className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Podmienky používania
            </Link>
            <Link
              href="/obchodne-podmienky"
              className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Obchodné podmienky
            </Link>
            <Link
              href="/"
              className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PreTaxikyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="text-[85%]">
      {/* Hero Section */}
      <section className="pt-8 md:pt-12 pb-12 md:pb-16 px-4 md:px-8 relative overflow-hidden">
        <GeometricLines variant="hero" count={8} />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-yellow-400/5" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6">
              Získajte viac zákazníkov
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                s TaxiNearMe
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto mb-8">
              Najväčší slovenský portál taxislužieb s <strong>tisíckami návštevníkov mesačne</strong>.
              Buďte tam, kde vás zákazníci hľadajú.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-purple-600">2 897+</div>
                <div className="text-sm text-foreground/60 font-medium">Miest a obcí</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-purple-600">1000+</div>
                <div className="text-sm text-foreground/60 font-medium">Taxislužieb</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-purple-600">100k+</div>
                <div className="text-sm text-foreground/60 font-medium">Zobrazení mesačne</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-5 md:py-7 px-4 md:px-8 bg-gradient-to-b from-white to-foreground/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Vyberte si balíček podľa vašich potrieb
            </h2>
            <p className="text-lg text-foreground/70">
              Transparentné ceny, žiadne skryté poplatky
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* PREMIUM Package */}
            <Card className="relative overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white hover:border-yellow-500 transition-colors">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                OBĽÚBENÉ
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-foreground">PREMIUM</CardTitle>
                    <p className="text-sm text-foreground/60">Zvýraznenie v zozname</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-foreground/40 line-through">5,99€</span>
                    <span className="text-4xl font-black text-foreground">3,99€</span>
                    <span className="text-foreground/60 font-medium"> / mesiac</span>
                  </div>
                  <p className="text-xs text-yellow-600 font-medium mt-1">Pre prvých 100 taxislužieb</p>
                  <p className="text-sm text-foreground/70 font-semibold mt-2">
                    Stačí vám získať <strong className="text-foreground">JEDNÉHO zákazníka</strong> mesačne a investícia sa vám vráti.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Pozícia na vrchu</strong> - vaša taxislužba sa zobrazí pred nezvýraznenými
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Zlaté zvýraznenie</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Badge "Overená taxislužba"</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Väčšie telefónne číslo</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Vlastné logo</strong> - zobrazenie vášho firemného loga v zozname
                    </span>
                  </li>
                </ul>

                <a
                  href="https://buy.stripe.com/8x26oH7CK8SU5G94NX7Re00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-foreground font-bold px-6 py-3 rounded-lg transition-all"
                >
                  Mám záujem o PREMIUM
                  <ArrowRight className="h-5 w-5" />
                </a>
              </CardContent>
            </Card>

            {/* PARTNER Package */}
            <Card
              id="partner"
              className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400 transition-colors"
            >
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                NAJLEPŠIA HODNOTA
              </div>
              {/* Ukážka Partner stránky */}
              <Link
                href="/taxi/zvolen/fast-taxi-zvolen"
                className="absolute top-10 right-3 inline-flex items-center gap-2 text-sm text-white font-bold transition-all bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Eye className="h-4 w-4" />
                Pozri ukážku
                <ArrowRight className="h-4 w-4" />
              </Link>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-foreground">PARTNER</CardTitle>
                    <p className="text-sm text-foreground/60">Vlastná stránka + všetko z PREMIUM</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-foreground/40 line-through">12,99€</span>
                    <span className="text-4xl font-black text-foreground">8,99€</span>
                    <span className="text-foreground/60 font-medium"> / mesiac</span>
                  </div>
                  <p className="text-xs text-purple-600 font-medium mt-1">Pre prvých 100 taxislužieb</p>
                  <p className="text-sm text-foreground/70 font-semibold mt-2">
                    Za cenu <strong className="text-foreground">dvoch káv</strong> vám ponúkame vlastnú personalizovanú stránku.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Všetko z PREMIUM</strong> - zvýraznenie, pozícia na vrchu, badge
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Vlastná brandovaná stránka</strong> - profesionálna prezentácia vašej
                      taxislužby
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Galéria fotografií</strong> - ukážte vaše vozidlá a tím
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Rozšírený popis služieb</strong> - cenník, služby, história firmy
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Recenzie zákazníkov</strong> - zobrazenie recenzií z Google Máp
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Partner portál</strong> - upravujte si obsah stránky kedykoľvek sami
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      <strong>Prioritná podpora</strong> - priamy chat s administrátorom
                    </span>
                  </li>
                </ul>

                <a
                  href="https://buy.stripe.com/7sYeVd0ai9WYc4x94d7Re01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
                >
                  Mám záujem o PARTNER
                  <ArrowRight className="h-5 w-5" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why TaxiNearMe Section */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Prečo TaxiNearMe?
            </h2>
            <p className="text-lg text-foreground/70">
              Sme najväčšia platforma pre taxislužby na Slovensku
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="perspective-1000">
              <div className="card-3d h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Celoslovenské pokrytie</h3>
                  <p className="text-foreground/70">
                    Pokrývame všetkých 2 897 miest a obcí na Slovensku. Zákazníci vás nájdu
                    kdekoľvek.
                  </p>
                </CardContent>
              </div>
            </Card>

            <Card className="perspective-1000">
              <div className="card-3d h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">SEO optimalizácia</h3>
                  <p className="text-foreground/70">
                    Prepracovaná SEO stratégia znamená, že sa zobrazujeme na prvých miestach Google
                    pre "taxi [mesto]".
                  </p>
                </CardContent>
              </div>
            </Card>

            <Card className="perspective-1000">
              <div className="card-3d h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Cielená návštevnosť</h3>
                  <p className="text-foreground/70">
                    Návštevníci nášho portálu aktívne hľadajú taxi. Žiadna zbytočná reklama -
                    priamy kontakt.
                  </p>
                </CardContent>
              </div>
            </Card>

            <Card className="perspective-1000">
              <div className="card-3d h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Rýchly štart</h3>
                  <p className="text-foreground/70">
                    PREMIUM aktivácia do 24 hodín. PARTNER do 48 hodín od dodania podkladov. Žiadne zložité nastavovanie - my sa o všetko postaráme.
                  </p>
                </CardContent>
              </div>
            </Card>

            <Card className="perspective-1000">
              <div className="card-3d h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Osobný prístup</h3>
                  <p className="text-foreground/70">
                    Mladý tím s osobným prístupom, ktorému záleží na vašom úspechu.
                  </p>
                </CardContent>
              </div>
            </Card>

            <Card className="perspective-1000">
              <div className="card-3d h-full">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Dôveryhodnosť</h3>
                  <p className="text-foreground/70">
                    Moderná platforma buduje dôveru. Zákazníci preferujú overené taxislužby.
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="container mx-auto max-w-4xl text-center">
          <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-8">
            Pripravení získať viac zákazníkov?
          </h2>
          <a
            href="mailto:info@taxinearme.sk"
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-8 py-4 rounded-lg transition-colors text-lg"
          >
            <Globe className="h-5 w-5" />
            info@taxinearme.sk
          </a>
        </div>
      </section>
      </div>

      <Footer />
    </div>
  );
}
