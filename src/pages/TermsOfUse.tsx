import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { reopenCookieSettings } from "@/components/cookie-banner/cookieManager";

const TermsOfUse = () => {
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
          Podmienky používania webovej stránky TaxiNearMe.sk
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <p className="text-lg text-foreground/90 leading-relaxed">
            Dátum účinnosti: 14. 11. 2025
          </p>

          {/* 1. Prevádzkovateľ */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              1. Prevádzkovateľ
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Prevádzkovateľom webovej stránky{" "}
              <a href="https://www.taxinearme.sk" className="underline">
                www.taxinearme.sk
              </a>{" "}
              je:
            </p>
            <div className="bg-card p-6 rounded-lg border-2 border-foreground/10">
              <p className="text-foreground/80 leading-relaxed">
                <strong>Marián Fabian</strong>
                <br />
                IČO: 47 340 860
                <br />
                DIČ: 1086305902
                <br />
                Sídlo: Gorkého 769/8, 962 31 Sliač, Slovenská republika
                <br />
                Email:{" "}
                <a href="mailto:info@taxinearme.sk" className="underline">
                  info@taxinearme.sk
                </a>
              </p>
            </div>
            <p className="text-foreground/80 leading-relaxed">
              Používaním webu vyjadrujete súhlas s týmito podmienkami.
            </p>
          </section>

          {/* 2. Charakter a účel služby */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              2. Charakter a účel služby
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              TaxiNearMe.sk je online platforma, ktorá:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                zobrazuje informácie o taxislužbách na Slovensku
              </li>
              <li className="leading-relaxed">
                umožňuje používateľom vyhľadávať taxi služby podľa mesta alebo lokality
              </li>
              <li className="leading-relaxed">
                poskytuje kontaktné údaje taxi firiem (napr. web, telefón)
              </li>
            </ul>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 mt-4">
              <p className="text-foreground font-semibold mb-2">
                ⚠️ Dôležité upozornenie:
              </p>
              <p className="text-foreground/80 leading-relaxed">
                Prevádzkovateľ <strong>nie je poskytovateľom taxislužby</strong>. Nevykonáva prepravu
                osôb, nezodpovedá za kvalitu, cenu ani priebeh prepravy, ani za konanie jednotlivých
                taxi firiem. Zmluvný vzťah vzniká vždy priamo medzi zákazníkom a konkrétnou taxi
                spoločnosťou.
              </p>
            </div>
          </section>

          {/* 3. Zodpovednosť za obsah */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              3. Zodpovednosť za obsah
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Informácie o taxi firmách:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                môžu pochádzať z verejne dostupných zdrojov alebo z podkladov poskytnutých samotnými firmami
              </li>
              <li className="leading-relaxed">
                môžu sa časom meniť; hoci sa snažíme o aktuálnosť, nezaručujeme úplnú správnosť
                a úplnosť údajov
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Prevádzkovateľ nenesie zodpovednosť za:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                škody vzniknuté v dôsledku použitia informácií z webu
              </li>
              <li className="leading-relaxed">
                konanie tretích strán (taxi spoločností, iných poskytovateľov služieb)
              </li>
              <li className="leading-relaxed">
                nedostupnosť alebo obmedzenú funkčnosť webu z technických dôvodov
              </li>
            </ul>
          </section>

          {/* 4. Povinnosti používateľa */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              4. Povinnosti používateľa
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Používateľ sa zaväzuje:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                používať web v súlade s právnymi predpismi a týmito podmienkami
              </li>
              <li className="leading-relaxed">
                nezasahovať do technického fungovania webu
              </li>
              <li className="leading-relaxed">
                nevyužívať web na šírenie škodlivého obsahu, spam, útoky alebo nezákonné aktivity
              </li>
              <li className="leading-relaxed">
                neposkytovať vedome nepravdivé alebo zavádzajúce informácie prostredníctvom
                kontaktného formulára
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Prevádzkovateľ je oprávnený zablokovať prístup používateľom, ktorí porušujú tieto
              podmienky alebo ohrozujú bezpečnosť webu.
            </p>
          </section>

          {/* 5. Kontaktný formulár a úprava údajov o taxi firmách */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              5. Kontaktný formulár a úprava údajov o taxi firmách
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Web obsahuje kontaktný formulár určený najmä na:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                doplnenie alebo opravu údajov o taxi firmách
              </li>
              <li className="leading-relaxed">
                nahlásenie neaktuálnych alebo nesprávnych údajov
              </li>
              <li className="leading-relaxed">
                základnú komunikáciu s prevádzkovateľom
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Prevádzkovateľ nie je povinný vykonať každú navrhovanú zmenu; má právo ju odmietnuť
              alebo overiť.
            </p>
          </section>

          {/* 6. Duševné vlastníctvo */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              6. Duševné vlastníctvo
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Grafické prvky, logo, texty, štruktúra a dizajn webu TaxiNearMe.sk sú chránené
              autorským právom. Kopírovanie, šírenie alebo iné použitie obsahu bez súhlasu
              prevádzkovateľa je zakázané, s výnimkou prípadu, keď ide o citácie v súlade so zákonom.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Údaje o taxi firmách môžu byť čiastočne odvodené z verejných zdrojov, ich spracovanie
              a usporiadanie na webe však predstavuje databázu chránenú právnymi predpismi.
            </p>
          </section>

          {/* 7. Reklama a monetizácia */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              7. Reklama a monetizácia
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Na webe sa môžu zobrazovať:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                automatizované reklamy tretích strán (napr. Google AdSense)
              </li>
              <li className="leading-relaxed">
                prípadne vlastné reklamné plochy alebo zvýraznené zápisy taxi firiem (ak budú zavedené)
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Zobrazenie reklamy nepredstavuje odporúčanie alebo záruku kvality propagovaného subjektu.
            </p>
          </section>

          {/* 8. Odkazy na externé weby */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              8. Odkazy na externé weby
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Web obsahuje odkazy na stránky tretích strán (napr. weby taxi firiem). Za obsah týchto
              stránok, ich dostupnosť ani bezpečnosť prevádzkovateľ nezodpovedá.
            </p>
          </section>

          {/* 9. Zmeny webu a podmienok */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              9. Zmeny webu a podmienok
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Prevádzkovateľ môže kedykoľvek:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                zmeniť alebo doplniť obsah webu
              </li>
              <li className="leading-relaxed">
                upraviť alebo ukončiť poskytovanie niektorých funkcií
              </li>
              <li className="leading-relaxed">
                zmeniť tieto podmienky používania
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Aktuálna verzia podmienok je vždy zverejnená na tejto stránke. Pokračovaním v používaní
              webu po zmene podmienok vyjadrujete súhlas s ich novým znením.
            </p>
          </section>

          {/* 10. Rozhodné právo a riešenie sporov */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              10. Rozhodné právo a riešenie sporov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Tieto podmienky sa riadia právnym poriadkom Slovenskej republiky. Prípadné spory budú
              riešené pred príslušnými súdmi Slovenskej republiky.
            </p>
          </section>

          <div className="mt-12 p-6 bg-card rounded-lg border-2 border-foreground/10">
            <p className="text-foreground/80 leading-relaxed">
              <strong>Ďakujeme, že používate TaxiNearMe.sk.</strong> Týmto potvrdením súhlasu s našimi
              Podmienkami používania nám pomáhate vytvárať bezpečnú a spoľahlivú platformu pre všetkých
              užívateľov. Naším cieľom je poskytnúť vám užitočné informácie a pomôcť vám nájsť
              spoľahlivú taxislužbu vo vašom meste.
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
              <span>|</span>
              <button
                onClick={reopenCookieSettings}
                className="hover:underline cursor-pointer"
              >
                Nastavenia cookies
              </button>
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

export default TermsOfUse;
