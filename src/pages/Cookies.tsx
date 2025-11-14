import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-4xl px-8 py-24">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-8 text-foreground">
          Zásady používania súborov cookies – TaxiNearMe.sk
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <p className="text-lg text-foreground/90 leading-relaxed">
            Dátum účinnosti: 14. 11. 2025
          </p>

          {/* 1. Čo sú cookies */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              1. Čo sú cookies
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Cookies sú malé textové súbory, ktoré sa ukladajú do vášho zariadenia (počítač, tablet, telefón)
              pri návšteve webových stránok. Umožňujú stránke rozpoznať vaše zariadenie, zapamätať si vaše
              voľby a zlepšovať fungovanie a služby webu.
            </p>
          </section>

          {/* 2. Kto cookies používa */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              2. Kto cookies používa
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Správcom cookies na webovej stránke{" "}
              <a href="https://www.taxinearme.sk" className="underline">
                www.taxinearme.sk
              </a>{" "}
              je:
            </p>
            <div className="bg-card p-6 rounded-lg border-2 border-foreground/10">
              <p className="text-foreground/80 leading-relaxed">
                <strong>Marián Fabian</strong>, IČO: 47 340 860
                <br />
                Sídlo: Gorkého 769/8, 962 31 Sliač
                <br />
                Email:{" "}
                <a href="mailto:info@taxinearme.sk" className="underline">
                  info@taxinearme.sk
                </a>
              </p>
            </div>
            <p className="text-foreground/80 leading-relaxed">
              Okrem nás používajú cookies aj tretie strany (najmä Google a Microsoft) na analytické
              a reklamné účely.
            </p>
          </section>

          {/* 3. Aké typy cookies používame */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              3. Aké typy cookies používame
            </h2>

            <div className="space-y-4">
              <div className="bg-card p-5 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-foreground mb-2">a) Nevyhnutné cookies</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground/80 text-sm">
                  <li>zabezpečujú základné fungovanie webu</li>
                  <li>bez nich stránka nemusí správne fungovať</li>
                  <li>ukladajú sa aj bez vášho súhlasu</li>
                </ul>
              </div>

              <div className="bg-card p-5 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-foreground mb-2">b) Preferenčné cookies</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground/80 text-sm">
                  <li>zapamätanie si jazyka alebo určitých nastavení používateľa</li>
                </ul>
              </div>

              <div className="bg-card p-5 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-bold text-foreground mb-2">c) Štatistické (analytické) cookies</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground/80 text-sm">
                  <li>slúžia na meranie návštevnosti a analýzu správania používateľov</li>
                  <li>nástroje: Google Analytics, Microsoft Clarity</li>
                  <li className="font-semibold">spracúvajú sa len na základe vášho súhlasu</li>
                </ul>
              </div>

              <div className="bg-card p-5 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-bold text-foreground mb-2">d) Marketingové cookies</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground/80 text-sm">
                  <li>používajú sa na zobrazovanie relevantnej reklamy (napr. Google AdSense)</li>
                  <li>môžu kombinovať informácie z viacerých webov</li>
                  <li className="font-semibold">spracúvajú sa len na základe vášho súhlasu</li>
                </ul>
              </div>
            </div>

            <p className="text-foreground/70 text-sm italic mt-4">
              Konkrétne názvy a doby platnosti cookies sa môžu meniť podľa nastavení jednotlivých služieb.
            </p>
          </section>

          {/* 4. Ako udeľujete a odvolávate súhlas */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              4. Ako udeľujete a odvolávate súhlas
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Pri prvej návšteve webu sa zobrazí cookie lišta, v ktorej si môžete vybrať:
            </p>
            <div className="bg-card p-6 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-foreground">„Prijať všetko"</p>
                  <p className="text-foreground/70 text-sm">
                    súhlasíte so všetkými voliteľnými cookies
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <p className="font-bold text-foreground">„Prispôsobiť"</p>
                  <p className="text-foreground/70 text-sm">
                    vyberiete si kategórie, s ktorými súhlasíte
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-bold text-foreground">„Odmietnuť všetko"</p>
                  <p className="text-foreground/70 text-sm">
                    zamietnete všetky voliteľné cookies (zostanú len nevyhnutné)
                  </p>
                </div>
              </div>
            </div>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Svoj súhlas môžete kedykoľvek zmeniť alebo odvolať cez odkaz{" "}
              <strong>„Nastavenia cookies"</strong> (nachádza sa v pätičke webu alebo v cookie lište).
            </p>
          </section>

          {/* 5. Nastavenia prehliadača */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              5. Nastavenia prehliadača
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Cookies môžete blokovať alebo vymazať aj priamo vo svojom prehliadači. V takom prípade
              však niektoré časti webu nemusia fungovať správne. Postup nájdete v nastaveniach
              prehliadača (Chrome, Firefox, Safari a pod.).
            </p>
          </section>

          {/* 6. Cookies tretích strán a prenos údajov */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              6. Cookies tretích strán a prenos údajov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Cookies spojené s nástrojmi Google a Microsoft môžu viesť k prenosu údajov do tretích
              krajín (najmä USA). Tieto služby používajú vlastné zásady ochrany osobných údajov,
              ktoré odporúčame preštudovať na ich webových stránkach.
            </p>
          </section>

          {/* 7. Zmeny zásad cookies */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              7. Zmeny zásad cookies
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Tieto zásady môžu byť aktualizované. Aktuálna verzia je vždy dostupná na tejto stránke.
            </p>
          </section>

          <div className="mt-12 p-6 bg-card rounded-lg border-2 border-foreground/10">
            <p className="text-foreground/80 leading-relaxed">
              Viac informácií o spracúvaní osobných údajov nájdete v našich{" "}
              <Link to="/ochrana-sukromia" className="font-bold underline hover:text-foreground/70">
                Zásadách ochrany osobných údajov
              </Link>
              .
            </p>
          </div>
        </div>

        <Link to="/">
          <Button className="mt-12" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-foreground py-12 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6 text-center">
            <p className="text-foreground/80 text-sm mb-4">
              Prevádzkovateľ: Marián Fabian, IČO: 47 340 860, Gorkého 769/8, 962 31 Sliač
              <br />
              Email:{" "}
              <a href="mailto:info@taxinearme.sk" className="underline">
                info@taxinearme.sk
              </a>
            </p>
            <nav className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/ochrana-sukromia" className="hover:underline">
                Ochrana súkromia
              </Link>
              <span>|</span>
              <Link to="/cookies" className="hover:underline">
                Cookies
              </Link>
              <span>|</span>
              <Link to="/podmienky-pouzivania" className="hover:underline">
                Podmienky používania
              </Link>
              <span>|</span>
              <Link to="/kontakt" className="hover:underline">
                Kontakt
              </Link>
            </nav>
          </div>
          <div className="text-center text-sm text-foreground/80">
            © 2024 Taxi NearMe. Všetky práva vyhradené.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Cookies;
