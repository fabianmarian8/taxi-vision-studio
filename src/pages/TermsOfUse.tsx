import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
          Podmienky používania
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <p className="text-lg text-foreground/90 leading-relaxed">
            Posledná aktualizácia: {new Date().toLocaleDateString('sk-SK')}
          </p>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              1. Všeobecné ustanovenia
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vitajte na stránke Taxi NearMe. Tieto Podmienky používania (ďalej len "Podmienky")
              upravujú prístup a používanie našej webovej stránky a služieb. Používaním našej
              webovej stránky vyjadrujete súhlas s týmito Podmienkami.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Ak nesúhlasíte s ktorýmkoľvek ustanovením týchto Podmienok, prosím, nepoužívajte
              našu webovú stránku.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              2. Popis služby
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Taxi NearMe je informatívny portál, ktorý poskytuje prehľad a kontaktné informácie
              na taxislužby pôsobiace na Slovensku. Naša platforma slúži ako agregátor informácií
              a vyhľadávací nástroj pre užívateľov, ktorí hľadajú spoľahlivé prepravné služby.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              <strong>Dôležité upozornenie:</strong> Nie sme prevádzkovateľom taxislužieb ani
              dopravcom. Nezabezpečujeme priamu prepravu osôb ani rezerváciu jázd. Poskytujeme
              výhradne informácie o taxislužbách a kontaktné údaje na jednotlivé prepravné spoločnosti.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              3. Práva a povinnosti užívateľa
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Ako užívateľ našej webovej stránky máte právo:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                Voľne prehliadať a vyhľadávať informácie o taxislužbách na našej stránke
              </li>
              <li className="leading-relaxed">
                Kontaktovať zobrazené taxislužby prostredníctvom poskytnutých kontaktných údajov
              </li>
              <li className="leading-relaxed">
                Používať naše vyhľadávacie nástroje na nájdenie vhodnej služby vo vašom meste
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              Zároveň sa zaväzujete:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                Používať našu stránku len na zákonné účely a v súlade s týmito Podmienkami
              </li>
              <li className="leading-relaxed">
                Nenarušovať funkčnosť našej webovej stránky ani bezpečnosť našich systémov
              </li>
              <li className="leading-relaxed">
                Nepokúšať sa o neoprávnený prístup k akejkoľvek časti našej infraštruktúry
              </li>
              <li className="leading-relaxed">
                Nezneužívať kontaktné informácie taxislužieb na spamovanie alebo obťažovanie
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              4. Duševné vlastníctvo
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Všetok obsah na tejto webovej stránke, vrátane textov, grafiky, loga, obrázkov,
              dizajnu a softvéru, je chránený autorskými právami a inými právami duševného
              vlastníctva, ktoré patria Taxi NearMe alebo našim licenčným partnerom.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Nie je dovolené kopírovať, reprodukovať, distribuovať alebo inak používať akýkoľvek
              obsah našej stránky bez nášho písomného súhlasu, okrem prípadov povolených zákonom
              alebo týmito Podmienkami.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              5. Presnosť informácií
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vynakladáme maximálne úsilie na zabezpečenie presnosti a aktuálnosti informácií
              o taxislužbách zobrazených na našej stránke. Informácie pravidelne aktualizujeme
              a overujeme.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Napriek tomu nemôžeme zaručiť úplnú presnosť všetkých údajov, pretože informácie
              o službách (ako sú ceny, dostupnosť, kontaktné údaje) sa môžu meniť bez predchádzajúceho
              upozornenia. Pred využitím služby odporúčame overiť si aktuálne informácie priamo
              u vybranej taxislužby.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              6. Obmedzenie zodpovednosti
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              <strong>Dôležité upozornenie:</strong> Taxi NearMe poskytuje výhradne informatívnu
              platformu. Nie sme zmluvnou stranou medzi vami a konkrétnou taxislužbou.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Nezodpovedáme za:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                Kvalitu, bezpečnosť alebo spoľahlivosť služieb poskytovaných jednotlivými
                prepravnými spoločnosťami
              </li>
              <li className="leading-relaxed">
                Akékoľvek spory, straty, škody alebo zranenia vzniknuté v súvislosti s využívaním
                služieb zobrazených taxislužieb
              </li>
              <li className="leading-relaxed">
                Nesprávne alebo zastarané informácie o cenách, dostupnosti či kontaktných údajoch
              </li>
              <li className="leading-relaxed">
                Technické problémy, prerušenie služby alebo nedostupnosť našej webovej stránky
              </li>
              <li className="leading-relaxed">
                Škody spôsobené vírusmi alebo iným škodlivým softvérom, ktorý by mohol infikovať
                vaše zariadenie pri používaní našej stránky
              </li>
            </ul>
            <p className="text-foreground/80 leading-relaxed mt-4">
              V najširšom rozsahu povolenom zákonom neposkytujeme žiadne záruky, výslovné ani
              implicitné, týkajúce sa našej webovej stránky a služieb.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              7. Odkazy na tretie strany
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Naša webová stránka môže obsahovať odkazy na webové stránky a služby tretích strán,
              ktoré nie sú pod našou kontrolou. Tieto odkazy poskytujeme len pre vaše pohodlie
              a neznamená to, že schvaľujeme obsah týchto externých stránok.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Nie sme zodpovední za obsah, politiky ochrany súkromia ani postupy akýchkoľvek
              webových stránok alebo služieb tretích strán. Odporúčame vám, aby ste si prečítali
              podmienky použitia a zásady ochrany súkromia každej webovej stránky, ktorú navštívite.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              8. Dostupnosť služby
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Snažíme sa zabezpečiť nepretržitú dostupnosť našej webovej stránky. Vyhradzujeme
              si však právo dočasne alebo trvalo prerušiť alebo obmedziť prístup k stránke alebo
              jej častiam bez predchádzajúceho upozornenia z dôvodu údržby, aktualizácií, technických
              problémov alebo iných okolností mimo našu kontrolu.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              9. Ochrana osobných údajov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Spracovanie vašich osobných údajov sa riadi našimi Zásadami ochrany súkromia, ktoré
              tvorí neoddeliteľnú súčasť týchto Podmienok. Používaním našej webovej stránky
              súhlasíte so spracovaním vašich údajov v súlade s týmito zásadami.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Odporúčame vám pozorne si prečítať naše{" "}
              <Link to="/ochrana-sukromia" className="text-foreground font-bold underline hover:text-foreground/70">
                Zásady ochrany súkromia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              10. Zmeny v podmienkach
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vyhradzujeme si právo kedykoľvek upraviť alebo zmeniť tieto Podmienky. O významných
              zmenách vás budeme informovať prostredníctvom oznámenia na našej webovej stránke
              alebo iným vhodným způsobom.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Dátum poslednej aktualizácie je vždy uvedený na začiatku tohto dokumentu. Vaše
              pokračujúce používanie našej webovej stránky po zverejnení zmien znamená, že
              akceptujete upravené Podmienky.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              11. Ukončenie prístupu
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Vyhradzujeme si právo kedykoľvek a z akéhokoľvek dôvodu obmedziť, pozastaviť alebo
              ukončiť váš prístup k našej webovej stránke bez predchádzajúceho upozornenia,
              najmä v prípade porušenia týchto Podmienok.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              12. Rozhodné právo a riešenie sporov
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Tieto Podmienky sa riadia a vykladajú v súlade s právnym poriadkom Slovenskej
              republiky. Akékoľvek spory vyplývajúce z týchto Podmienok alebo súvisiace s našou
              webovou stránkou budú riešené príslušnými súdmi Slovenskej republiky.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              V prípade, že niektoré ustanovenie týchto Podmienok bude považované za neplatné
              alebo nevykonateľné, zostávajúce ustanovenia zostanú v plnej platnosti a účinnosti.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              13. Kontakt
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Ak máte akékoľvek otázky týkajúce sa týchto Podmienok používania, neváhajte nás
              kontaktovať prostredníctvom kontaktného formulára dostupného na našej webovej stránke.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              Radi vám poskytneme ďalšie informácie a zodpovieme vaše otázky.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground mt-12 mb-4">
              14. Odporúčania pre bezpečné používanie taxislužieb
            </h2>
            <p className="text-foreground/80 leading-relaxed">
              Hoci nezodpovedáme za služby poskytované jednotlivými taxislužbami, záleží nám
              na vašej bezpečnosti. Odporúčame:
            </p>
            <ul className="list-disc pl-8 space-y-2 text-foreground/80">
              <li className="leading-relaxed">
                Overte si, že vozidlo a vodič majú príslušné licencie a označenie
              </li>
              <li className="leading-relaxed">
                Pred nástupom do vozidla si zapíšte evidenčné číslo vozidla
              </li>
              <li className="leading-relaxed">
                Dohodnite si cenu alebo spôsob výpočtu pred začiatkom jazdy
              </li>
              <li className="leading-relaxed">
                V prípade problémov kontaktujte priamo prevádzkovateľa taxislužby alebo príslušné úrady
              </li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-card rounded-lg border-2 border-foreground/10">
            <p className="text-foreground/80 leading-relaxed">
              <strong>Ďakujeme, že používate Taxi NearMe.</strong> Týmto potvrdením súhlasu
              s našimi Podmienkami používania nám pomáhate vytvárať bezpečnú a spoľahlivú platformu
              pre všetkých užívateľov. Naším cieľom je poskytnúť vám užitočné informácie a pomôcť
              vám nájsť spoľahlivú taxislužbu vo vašom meste.
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

export default TermsOfUse;
