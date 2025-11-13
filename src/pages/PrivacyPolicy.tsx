import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
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
          Ochrana súkromia
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <p className="text-lg text-foreground/90 leading-relaxed">
            Posledná aktualizácia: {new Date().toLocaleDateString('sk-SK')}
          </p>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              1. Úvod
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vážime si Vašu dôveru a záleží nám na ochrane Vášho súkromia. Tento dokument opisuje,
              aké informácie zhromažďujeme pri používaní našej webovej stránky Taxi NearMe, ako ich
              používame a aké máte práva v súvislosti s ich spracovaním.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Naša služba funguje ako informatívny portál pre vyhľadávanie taxislužieb na Slovensku.
              Nezabezpečujeme priamo taxislužby, ale poskytujeme Vám prehľad a kontaktné informácie
              na dostupné prepravné služby vo vašom meste.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              2. Správca osobných údajov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Správcom Vašich osobných údajov je prevádzkovateľ služby Taxi NearMe. V prípade
              akýchkoľvek otázok týkajúcich sa spracovania Vašich osobných údajov nás môžete
              kontaktovať prostredníctvom kontaktného formulára na našej webovej stránke.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              3. Aké údaje zhromažďujeme
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Pri prezeraní našej webovej stránky môžeme zhromažďovať nasledujúce kategórie údajov:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                <strong>Technické údaje:</strong> IP adresa, typ prehliadača, operačný systém,
                čas návštevy a navštívené podstránky
              </li>
              <li className="leading-relaxed">
                <strong>Vyhľadávacie dotazy:</strong> Mestá a služby, ktoré vyhľadávate na našom portáli
              </li>
              <li className="leading-relaxed">
                <strong>Súbory cookies:</strong> Informácie uložené vo Vašom prehliadači pre zlepšenie
                používateľskej skúsenosti
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Nezhromažďujeme citlivé osobné údaje ako sú údaje o zdravotnom stave, náboženstve,
              politických názoroch alebo údaje o trestných činoch.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              4. Účel spracovania údajov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vaše údaje spracovávame na nasledujúce účely:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                Poskytovanie a zlepšovanie našich služieb vyhľadávania taxislužieb
              </li>
              <li className="leading-relaxed">
                Analýza návštevnosti a správania návštevníkov za účelom optimalizácie používateľskej skúsenosti
              </li>
              <li className="leading-relaxed">
                Zabezpečenie bezpečnosti a ochrany našej webovej stránky
              </li>
              <li className="leading-relaxed">
                Plnenie zákonných povinností
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              5. Právny základ spracovania
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vaše osobné údaje spracovávame na základe:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                <strong>Oprávneného zájmu</strong> – prevádzkovanie a zlepšovanie našej webovej stránky
              </li>
              <li className="leading-relaxed">
                <strong>Vášho súhlasu</strong> – pri používaní analytických cookies
              </li>
              <li className="leading-relaxed">
                <strong>Zákonnej povinnosti</strong> – pri plnení právnych požiadaviek
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              6. Zdieľanie údajov s tretími stranami
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vaše osobné údaje nezverejňujeme, nepredávame ani inak nesprístupňujeme tretím stranám
              bez Vášho výslovného súhlasu, s výnimkou nasledujúcich prípadov:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                <strong>Poskytovatelia služieb:</strong> Analytické nástroje (napr. Google Analytics)
                pre sledovanie návštevnosti webu
              </li>
              <li className="leading-relaxed">
                <strong>Právne požiadavky:</strong> Ak to vyžaduje zákon alebo oprávnený orgán
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Všetci naši partneri sú zaviazaní dodržiavať prísne normy ochrany osobných údajov
              v súlade s nariadením GDPR.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              7. Doba uchovávania údajov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vaše osobné údaje uchováme len po dobu nevyhnutnú na splnenie účelov, na ktoré boli
              zhromaždené:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                Technické údaje a analytické informácie: maximálne 26 mesiacov
              </li>
              <li className="leading-relaxed">
                Údaje potrebné na splnenie zákonných povinností: po dobu stanovenú príslušnými právnymi predpismi
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              8. Vaše práva
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Podľa nariadenia GDPR máte nasledujúce práva:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                <strong>Právo na prístup:</strong> Máte právo získať informácie o tom, aké Vaše osobné
                údaje spracovávame
              </li>
              <li className="leading-relaxed">
                <strong>Právo na opravu:</strong> Môžete požiadať o opravu nesprávnych alebo neúplných údajov
              </li>
              <li className="leading-relaxed">
                <strong>Právo na vymazanie:</strong> Za určitých okolností môžete požiadať o vymazanie
                Vašich osobných údajov
              </li>
              <li className="leading-relaxed">
                <strong>Právo na obmedzenie spracovania:</strong> Môžete požiadať o obmedzenie spracovania
                Vašich údajov
              </li>
              <li className="leading-relaxed">
                <strong>Právo na prenosnosť:</strong> Máte právo získať Vaše údaje v štruktúrovanom,
                bežne používanom formáte
              </li>
              <li className="leading-relaxed">
                <strong>Právo namietať:</strong> Môžete namietať proti spracovaniu Vašich údajov
              </li>
              <li className="leading-relaxed">
                <strong>Právo odvolať súhlas:</strong> Ak spracovanie prebíha na základe súhlasu,
                môžete ho kedykoľvek odvolať
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Pre uplatnenie Vašich práv nás prosím kontaktujte. Máte tiež právo podať sťažnosť
              na Úrad na ochranu osobných údajov Slovenskej republiky.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              9. Cookies
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Naša webová stránka používa súbory cookies, ktoré zlepšujú Vašu používateľskú skúsenosť.
              Cookies sú malé textové súbory uložené vo Vašom zariadení. Používame:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                <strong>Nevyhnutné cookies:</strong> Potrebné pre správne fungovanie webu
              </li>
              <li className="leading-relaxed">
                <strong>Analytické cookies:</strong> Pomáhajú nám pochopiť, ako návštevníci využívajú našu stránku
              </li>
              <li className="leading-relaxed">
                <strong>Funkčné cookies:</strong> Umožňujú pokročilé funkcie a personalizáciu
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Používanie cookies môžete upraviť v nastaveniach Vášho prehliadača. Upozorňujeme však,
              že deaktivácia cookies môže obmedziť funkčnosť našej webovej stránky.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              10. Bezpečnosť údajov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Dbáme na bezpečnosť Vašich osobných údajov a prijímame primerané technické a organizačné
              opatrenia na ich ochranu pred neoprávneným prístupom, stratou, zneužitím alebo zmenou.
              Naše bezpečnostné opatrenia zahŕňajú šifrovanie dát, bezpečné servery a pravidelné
              bezpečnostné audity.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              11. Odkazy na iné webové stránky
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Naša webová stránka môže obsahovať odkazy na webové stránky tretích strán (napr. webové
              stránky jednotlivých taxislužieb). Nie sme zodpovední za postupy ochrany súkromia týchto
              externých stránok. Odporúčame Vám prečítať si podmienky ochrany súkromia každej webovej
              stránky, ktorú navštívite.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              12. Zmeny v zásadách ochrany súkromia
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vyhradzujeme si právo kedykoľvek aktualizovať tieto zásady ochrany súkromia. O významných
              zmenách Vás budeme informovať prostredníctvom oznámenia na našej webovej stránke.
              Odporúčame Vám pravidelne kontrolovať túto stránku, aby ste boli informovaní o tom,
              ako chránime Vaše údaje.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              13. Kontakt
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Ak máte akékoľvek otázky ohľadom týchto zásad ochrany súkromia alebo spracovania Vašich
              osobných údajov, neváhajte nás kontaktovať. Sme tu, aby sme Vám pomohli a odpovede na
              Vaše otázky.
            </p>
          </section>

          <div className="mt-12 p-6 bg-card rounded-lg border-2 border-foreground/10">
            <p className="text-foreground/80 leading-relaxed">
              <strong>Ďakujeme za Vašu dôveru.</strong> Záleží nám na Vašom súkromí a zaväzujeme sa
              chrániť Vaše osobné údaje v súlade s najvyššími normami bezpečnosti a v plnom súlade
              so slovenskou a európskou legislatívou.
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
          <div className="text-center text-sm text-foreground/80">
            © 2024 Taxi NearMe. Všetky práva vyhradené.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
