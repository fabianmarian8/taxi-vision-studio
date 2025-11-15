import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Calendar, Star, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const HodnotenieVodicovPage = () => {
  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Ako funguje hodnotenie vodičov v taxi aplikáciách',
        url: window.location.href
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link skopírovaný do schránky');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-8 relative hero-3d-bg overflow-hidden">
        <GeometricLines variant="hero" count={12} />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Späť na hlavnú stránku
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              <Star className="h-4 w-4 inline mr-1" />
              Hodnotenie
            </span>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Calendar className="h-4 w-4" />
              15. január 2025
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
            Ako funguje hodnotenie vodičov v taxi aplikáciách
          </h1>
          
          <p className="text-xl text-foreground/80 mb-6">
            Prečo môžeš jedným klikom zničiť niekomu prácu. 4★ nie je dobré hodnotenie - je to penalizácia.
          </p>

          <Button
            onClick={handleShare}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Zdieľať článok
          </Button>
        </div>
      </section>

      {/* Article Content with WHITE BACKGROUND */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-white">
        <div className="container mx-auto max-w-4xl">
          <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800">
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                <AlertTriangle className="h-5 w-5 inline mr-2 text-yellow-600" />
                Poviem to bez obalu:
              </p>
              <p className="text-gray-800">
                Hviezdičky v taxi aplikácii nie sú hra. Jedno tvoje kliknutie môže znamenať, že konkrétny vodič dostane menej jázd, príde o stovky eur mesačne, alebo ho systém úplne odstaví.
              </p>
            </div>

            <p className="text-lg leading-relaxed">
              Vodič taxi nie je sanitka ani psychológ. Predsa sa často nachádza v situáciách, ktoré vyžadujú rozhodnutie: Vziať problémového zákazníka, alebo radšej odmietnuť?
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">1. 4★ nie je "dobré hodnotenie". Je to penalizácia.</h2>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <p className="font-semibold text-gray-900">Bežná veta zákazníka:</p>
              <p className="italic text-gray-700">"Nič extra, tak 4★."</p>
              <p className="mt-3 text-gray-800">
                <strong>Realita:</strong> Platformy tlačia vodičov k priemeru 4,8★. Každý pokles o desatinku znamená: menej priorizovaných jázd, menej príjmu, viac stresu.
              </p>
            </div>

            <p>
              Pre vodiča rozdiel medzi 4,7★ a 4,9★ = či ho systém bude púšťať dopredu alebo ho hodí na dno.
            </p>

            <p className="font-semibold text-lg">
              Ak bola jazda <strong>bezpečná, normálna, auto čisté, vodič korektný</strong> → 4★ je trest, nie hodnotenie.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">2. Väčšina nízkych hodnotení trestá niečo, za čo vodič nemôže</h2>

            <p>Ľudia dávajú zlé hodnotenia za veci mimo kontroly vodiča:</p>

            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold mb-2">❌ Zápcha</p>
                <p className="text-sm text-gray-700">Vodič neovláda semafory ani nehody na ceste</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold mb-2">❌ Cena</p>
                <p className="text-sm text-gray-700">Tarifu nastavuje systém, nie vodič</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold mb-2">❌ Počasie</p>
                <p className="text-sm text-gray-700">Vodič neriadi dážď ani sneh</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold mb-2">❌ Uzávierky</p>
                <p className="text-sm text-gray-700">Vodič neplánuje cestné práce</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">Typické scenáre:</h3>

            <div className="space-y-4 my-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">"Drahé, dám 3★"</p>
                <p className="text-sm text-gray-700">→ Tarifu nastavuje systém, nie vodič</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">"Meškal, dám 2★"</p>
                <p className="text-sm text-gray-700">→ Stál v zápche, neovláda semafory</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">"Nič extra, tak 4★"</p>
                <p className="text-sm text-gray-700">→ Sme v taxi, nie v divadle. Bezpečne, včas, v tichu = perfektná jazda</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-semibold">"Pohádali sme sa, dám mu 1★"</p>
                <p className="text-sm text-gray-700">→ Vodič odmietol porušiť pravidlá / riskovať</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">3. Najšpinavšia časť: krivé obvinenia a blokácie bez dôkazov</h2>

            <p>Téma o ktorej sa veľmi nehovorí, ale v systéme existuje:</p>

            <ul className="space-y-2 my-6">
              <li>Obvinenia z "nevhodného správania"</li>
              <li>Obťažovanie</li>
              <li>Pocit "cítila som sa nepríjemne"</li>
            </ul>

            <div className="bg-gray-900 text-white p-6 rounded-lg my-8">
              <h3 className="text-xl font-bold mb-4">Ako to funguje:</h3>
              <ol className="space-y-3">
                <li><strong>1.</strong> Zákazník napíše: "Vodič sa správal nevhodne / obťažoval ma / cítila som sa ohrozená"</li>
                <li><strong>2.</strong> Systém: okamžite zablokuje vodiča, odstaví mu príjem, neraz bez reálneho preverenia faktov</li>
                <li><strong>3.</strong> Vodič: nemá priestor sa brániť, nevie čo presne sa mu kladie za vinu, je "odpálený"</li>
              </ol>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">4. Ako by mal vyzerať férový systém hodnotenia</h2>

            <div className="bg-green-50 p-8 rounded-lg my-8">
              <h3 className="text-2xl font-bold mb-6">Tri veci:</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg mb-2">1. Nefungovať na princípe: zákazník má vždy pravdu</h4>
                  <p>Extrémne hodnotenie (1★ + ťažký komentár) by malo ísť pod lupu</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">2. Pozerať sa na dáta, nie len na emóciu</h4>
                  <p>Hľadať vzorce, nie jednorazové výbuchy</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">3. Dovoliť vodičovi sa brániť</h4>
                  <p>Vodič má mať možnosť reagovať a poskytnúť svoju verziu</p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">5. Návod pre zákazníkov: ako hodnotiť férovo</h2>

            <div className="bg-red-50 p-6 rounded-lg my-6">
              <h3 className="text-xl font-bold mb-4">✓ Hodnoť vodiča za to, čo ovplyvní:</h3>
              <ul className="space-y-2">
                <li>• Jazdil agresívne, riskoval</li>
                <li>• Bol arogantný, hrubý, nerešpektoval ťa</li>
                <li>• Auto bolo špinavé, odporný zápach</li>
                <li>• Vedome ťa ťahal zbytočne dlhšou trasou</li>
                <li>• Ignoroval dohodu, správal sa vyslovene neprofesionálne</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg my-6">
              <h3 className="text-xl font-bold mb-4">✗ Toto NIE JE dôvod na 1-3★:</h3>
              <ul className="space-y-2">
                <li>• Cena (vypočítala aplikácia)</li>
                <li>• Zápchy, nehody, uzávierky</li>
                <li>• Tvoje vlastné nervy, zlý deň, opitosť</li>
                <li>• To, že vodič odmietol: jazdiť 80 v meste, porušiť dopravné predpisy, zastaviť na zákaze, urobiť z auta diskotéku o 3:00 ráno</li>
              </ul>
            </div>

            <p className="text-xl font-bold text-center my-8 p-6 bg-gray-100 rounded-lg">
              Jednoduché pravidlo: "Hodnotím vodiča len za to, čo reálne držal v rukách."
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">6. Záver: Hviezdičky sú zbraň</h2>

            <p className="text-lg">
              Nechceme od teba, aby si bol "dobráčik" a rozdával 5★ stále. Chceme iba: <strong>férové hodnotenie za to, čo vodič reálne ovplyvnil.</strong>
            </p>

            <div className="bg-yellow-50 p-6 rounded-lg my-8">
              <p className="font-semibold text-lg mb-3">Dôsledok nespravodlivého hodnotenia:</p>
              <ul className="space-y-2">
                <li>• Dobrí vodiči časom odídu (unavení z toho, že žijú pod gilotínou hviezdičiek)</li>
                <li>• Zostanú tí, ktorí to berú len ako dočasnú robotu, bez vzťahu k práci</li>
                <li>• Ty ako zákazník skončíš v službe, kde: vodiči nemajú motiváciu, systém je napnutý, kvalita ide dole</li>
              </ul>
            </div>

            <p className="text-xl font-bold text-center my-8">
              Rozmýšľaj, kam mieris.
            </p>

          </article>

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <h3 className="text-2xl font-bold mb-4 text-center">Chcete vidieť komplexný sprievodca taxislužbami?</h3>
            <p className="text-center text-gray-700 mb-6">
              Prečítajte si všetko, čo potrebujete vedieť o taxi na Slovensku v roku 2025.
            </p>
            <div className="flex justify-center">
              <Link to="/komplexny-sprievodca-taxi">
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
};

export default HodnotenieVodicovPage;
