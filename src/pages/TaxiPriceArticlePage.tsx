import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const TaxiPriceArticlePage = () => {
  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Porovnanie cien taxislužieb v slovenských mestách',
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
              📊 Analýza
            </span>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Calendar className="h-4 w-4" />
              15. január 2025
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
            Porovnanie cien taxislužieb v slovenských mestách (2024/2025)
          </h1>

          <p className="text-xl text-foreground/80 mb-6">
            Taxislužby na Slovensku ponúkajú široké spektrum cien v závislosti od regiónu. 
            Preskúmali sme cenníky viac než 30 miestnych taxislužieb a odhalili výrazné rozdiely.
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

      {/* Article Content */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="container mx-auto max-w-3xl">
          <article className="prose prose-lg max-w-none">
            <p className="lead">
              V roku 2024 a 2025 sme preskúmali cenníky viac než 30 miestnych taxislužieb na Slovensku - 
              od metropoly až po menšie mestá. Zamerali sme sa na klasické taxislužby a ich oficiálne tarify 
              (nástupné, cena za kilometer, čakacie sadzby), <strong>úplne vynechávajúc platformy ako Bolt či Uber</strong> 
              podľa zadania.
            </p>

            <p>
              Získané údaje odhaľujú výrazné rozdiely: <strong>nástupné sadzby sa pohybujú od symbolických 0,5 € 
              v menších mestách až po 3-3,5 € vo veľkých mestách</strong>, podobne sa líši aj tarifa za kilometer. 
              V článku prinášame detailný prehľad týchto rozdielov, doplnený grafmi a odhadmi reálnych cien jázd. 
              (Všetky ceny sú aktuálne k roku 2024-2025 a uvádzame ich v € s DPH.)
            </p>

            <h2>Nástupné sadzby: najvyššie v Bratislave, najnižšie v menších mestách</h2>

            <h3>Porovnanie nástupných sadzieb taxislužieb</h3>

            <p>
              <strong>Nástupné (fixný poplatok na začiatku jazdy)</strong> sa v rámci Slovenska značne líši. 
              V Bratislave sa pohybuje typicky okolo <strong>3 €</strong> - mnohé tamojšie taxislužby si účtujú 
              nástupné <strong>3,00 €</strong>, pričom niektoré aj <strong>3,50 €</strong> (čo je najvyššie spomedzi veľkých miest).
            </p>

            <p>
              Naopak v <strong>menších mestách</strong> býva nástupné poplatok symbolický:
            </p>

            <ul>
              <li>Napríklad taxislužba v <strong>Ružomberku</strong> má nástupné len <strong>1,00 €</strong></li>
              <li>V <strong>Martine</strong> dokážu iba <strong>0,50 €</strong></li>
              <li>Ešte lacnejšie je to v niektorých regiónoch <strong>Popradu</strong>, kde základná sadzba začína už od <strong>0,60 €</strong></li>
            </ul>

            <p>
              <strong>Košice</strong>, ako druhé najväčšie mesto, sú v tomto smere prekvapivo lacné - viacere košické 
              taxislužby majú nástupné <strong>1,00 - 1,50 €</strong>, čo je výrazne menej než v Bratislave. 
              <strong>Prešov</strong> sa pohybuje približne okolo <strong>2,00 €</strong>, <strong>Žilina</strong> okolo 
              <strong>3,50 €</strong> a <strong>Nitra</strong> od <strong>2,50 €</strong>.
            </p>

            <p>
              Rozptyl je teda veľký - kým v hlavnom meste platíme za nasadnutie do vozidla takmer dvojnásobok oproti 
              väčšine krajských miest, v malých mestách je nástupné zanedbateľnou položkou.
            </p>

            <h2>Cena za kilometer: vyššia v hlavnom meste, inde často okolo 1 €/km</h2>

            <h3>Porovnanie tarifnej ceny za kilometer</h3>

            <p>
              <strong>Tarifná sadzba za kilometer</strong> (čiže koľko zaplatíme za prejdenú vzdialenosť) býva druhou 
              podstatnou zložkou ceny. <strong>Bratislava</strong> má aj v tomto smere najvyššie ceny - štandardne okolo 
              <strong>1,50 € za km</strong> v rámci mesta. Naproti tomu v <strong>menších mestách</strong> sa bežne pohybuje 
              <strong>0,70 - 1,00 € za km</strong>, častokrát aj menej. Napríklad:
            </p>

            <ul>
              <li>Taxislužba v <strong>Poprade</strong> má dennú sadzbu <strong>0,79 €/km</strong> (nočnú <strong>0,83 €</strong>)</li>
              <li>V <strong>Ružomberku</strong> je tarifa <strong>1,00 €/km v meste</strong> (a ešte nižších 0,80 € mimo mesta)</li>
              <li><strong>Košice</strong> ponúkajú kilometrovú sadzbu už od <strong>1,00 €/km</strong> po cca <strong>1,40 €</strong> u iných spoločností - stále menej než bratislavský priemer</li>
              <li>V <strong>Prešove</strong> sa cena za km pohybuje okolo <strong>1 €</strong> a podobne v <strong>Nitre</strong> okolo <strong>1 €</strong></li>
              <li><strong>Žilina</strong> má priemerne okolo <strong>0,80 € za km</strong> v meste, hoci niektoré žilinské taxislužby uvádzajú aj vyššie sadzby</li>
            </ul>

            <p>
              Vo <strong>väčšine krajských miest</strong> (Trenčín, Trnava, Banská Bystrica a pod.) sa tarifné ceny pohybujú 
              v rozmedzí <strong>0,90 - 1,20 € za km</strong> v závislosti od dennej doby a konkrétnej spoločnosti.
            </p>

            <h2>Fixné ceny a moderné trendy</h2>

            <p>
              Zaujímavým fenoménom je, že približne <strong>40 % taxí firiem na Slovensku používa v mestách fixné ceny</strong> - 
              teda stanovujú vopred paušálnu sumu za jazdu v rámci mesta namiesto účtovania podľa kilometrov. Príkladom je 
              <strong>Trnava</strong>, kde jedna taxislužba ponúka fixnú cenu <strong>3,50 € na ľubovoľnú jazdu v rámci mesta</strong> 
              (bez ohľadu na vzdialenosť A-B v meste za 3,5 €).
            </p>

            <p>
              Takéto paušály môžu byť pre zákazníka výhodné najmä pri dlhších trasách v meste. Väčšina firiem však stále používa 
              tradičný model - účtovanie podľa prejdených kilometrov, <strong>prípadne kombinovaný model</strong> (napríklad odlišné 
              ceny cez deň a v noci, vyššia tarifa na sviatky či pri jazde mimo mesto).
            </p>

            <p>
              <strong>Moderným trendom je teda flexibilná cenotvorba</strong> - niektoré taxislužby zvýhodňujú telefonické objednávky, 
              vernostné programy pre stálych klientov či kartičku alebo majú lacnejšie denné tarify a drahšie nočné či sviatočné. 
              <strong>V priemere však možno povedať, že kilometrová sadzba na Slovensku bola v roku 2024 okolo 0,91 €/km</strong>, 
              hoci v praxi sú medzi mestami veľké rozdiely.
            </p>

            <h2>Čakacia sadzba: poplatky za státie v premávke</h2>

            <p>
              <strong>Súčasťou cenníkov taxislužieb je aj tzv. čakacie (stojné) - poplatok za čas, keď taxík stojí alebo pomaly 
              posúva v zápche.</strong> Aj ten sa líši podľa regiónu. Zvyčajne sa uvádza ako cena za hodinu čakania (resp. za minútu). 
              <strong>Vo veľkých mestách je čakacia sadzba vyššia</strong> - napríklad v Bratislave okolo <strong>0,50 € za minútu</strong>, 
              čiže <strong>30 € za hodinu státia</strong>. V <strong>menších mestách</strong> je stojné výrazne lacnejšie, častokrát okolo 
              <strong>10-15 € za hodinu</strong>.
            </p>

            <h2>Odhad ceny typických jázd: mestská trasa vs. letisko</h2>

            <h3>Odhad ceny 5 km jazdy (s 2 min čakaním)</h3>

            <p>
              <strong>Aké sú reálne náklady na typickú jazdu taxíkom v jednotlivých mestách?</strong> Na ilustráciu sme vypočítali 
              orientačné ceny pre model mestskú jazdu: vzdialenosť <strong>5 km</strong> (čo zodpovedá približne priemernej dlžke taxi 
              jazdy - tá bola v roku 2024 okolo 5,8 km) a krátke zdržanie cca <strong>2 minúty</strong> na semaforoch.
            </p>

            <p>
              Výsledky ukazujú - v <strong>Bratislave</strong> stojí taxi-jazda približne <strong>11-12 €</strong>, kým v 
              <strong>menších mestách</strong> (Martin, Poprad) len okolo <strong>5-6 €</strong>. V krajských mestách ako 
              <strong>Košice, Prešov, Trenčín či Nitra</strong> vychádza 5 km trasa v rozmedzí <strong>7 až 8 €</strong>, 
              pod vplyvom konkrétnej tarifnej politiky.
            </p>

            <p>
              Rozdiely sú značné: za rovnakú vzdialenosť zaplatí zákazník v Bratislave takmer <strong>dvojnásobok</strong> toho 
              čo napríklad v Poprade. Treba však dodať, že ide o zjednodušený výpočet - <strong>nezohľadňuje napríklad zvýšené 
              sadzby v noci alebo zľavy pri objednávke cez dispečing</strong>. V praxi môžu ceny kolísať, no porovnanie pekne 
              ilustruje, že <strong>cestovanie taxíkom je výrazne drahšie v hlavnom meste než inde na Slovensku</strong>.
            </p>

            <h3>Jazda na letisko</h3>

            <p>
              Ďalším typickým príkladom je <strong>jazda z centra miest na letisko</strong> (ak také mesto má). V <strong>Bratislave</strong> 
              je letisko M. R. Štefánika pomerne blízko centru (cca 10 km), taxi z centra na letisko vyjde okolo <strong>15-20 €</strong> 
              podľa tarífy. Niektoré bratislavské firmy ponúkajú aj fixné ceny - napríklad letiskový transfer z centra za <strong>od 20 €</strong>, 
              čo je skôr horná hranica.
            </p>

            <p>
              <strong>V Košiciach</strong> je letisko asi 8 km; miestne taxislužby si často účtujú letiskový príplatok <strong>2-3 €</strong>, 
              alebo stanoviá <strong>minimálne jazdné na letisko okolo 10-15 €</strong>. Reálne sa teda cesta <strong>Košice centrum - letisko</strong> 
              dá zvládnuť približne za <strong>10 €</strong> (pri lacnejšej službe 8 €, pri drahšej okolo 12 €).
            </p>

            <p>
              Iné mestá ako <strong>Poprad</strong> (s menším letiskom) mávajú na letisko často paušál (napr. z mesta do Poprad-Tatry okolo 7-8 €), 
              v <strong>Bratislave</strong> sa zase často využívajú taxi na vzdialenejšie letiská <strong>Schwechat či Budapešť</strong>, kde sú 
              pevné ceny v stovkách eur podľa vzdialenosti.
            </p>

            <p>
              Celkovo platí, že <strong>taxislužby prispôsobujú ponuku dopytu - na letiskové trasy majú buď špeciálne príplatky alebo výhodné 
              balíčky</strong>, podľa toho, či ide o frekventovanú trasu.
            </p>

            <h2>Záver: Na cene záleží, informovanosť je kľúčová</h2>

            <p>
              <strong>Z nášho prieskumu vyplýva, že ceny taxislužieb v slovenských mestách sa výrazne líšia, no zároveň poskytujú zákazníkom 
              možnosť voľby podľa preferencií.</strong> Kto hľadá čo najnižšiu cenu, nájde ju skôr v menších mestách alebo u ekonomických 
              taxislužieb; naopak za vyšší komfort či rýchlosť si v metropole priplatíte.
            </p>

            <p>
              Dôležité je <strong>sledovať aktuálne ponuky a akcie</strong>, ktoré môžu výrazne ovplyvniť náklady na cestovanie - 
              <strong>informovaný cestujúci vie optimalizovať svoje výdavky a ušetriť čas aj peniaze</strong>. Napríklad v niektorých 
              mestách existujú zľavy pre študentov či vernostné programy pre stálych klientov. Tiež platí, že <strong>objednať si taxi 
              cez dispečing alebo aplikáciu môže byť lacnejšie než chytiť ho na ulici</strong>, najmä v mestách kde funguje viac systémov taríf.
            </p>

            <p>
              Na záver možno skonštatovať, že <strong>slovenský trh taxislužieb prešiel v ostatných rokoch modernizáciou a cenovou 
              diverzifikáciou.</strong> Kto jazdí často, určite ocení komfortnú taxislužbu s dobrým hodnotením; kto tlačí ceny nadol, 
              nemá by automaticky preferovať najlacnejšiu. Odporúčame vopred sa oboznámiť s cenníkom lokálnej taxislužby alebo sa opýtať 
              na odhad ceny ešte pred nástupením.
            </p>

            <p>
              Tento hlbkový prehľad ukázal, že <strong>ceny nástupného sa na Slovensku v roku 2025 pohybujú od 0,5 € až 3,5 € a kilometrové 
              zhruba od 0,8 € do 1,5 €</strong>, no konkrétna výsledná suma za jazdu závisí od viacerých faktorov. <strong>Byť informovaný 
              sa vyplatí</strong> - doslova. Ako zákazníci máme na výber a môžeme si zvoliť taxi službu, ktorá najlepšie vyhovuje našim 
              potrebám a rozpočtu.
            </p>

            <hr />

            <h3>Zdroje</h3>

            <p className="text-sm text-foreground/70">
              Údaje v článku boli čerpané z oficiálnych cenníkov vybraných taxislužieb (Bratislava, Košice, Prešov, Žilina, Nitra, 
              B. Bystrica, Trnava, Trenčín, Martin, Poprad a ďalších) aktualizovaných v rokoch 2024-2025, ako aj zo štatistického 
              prehľadu odvetvia taxislužieb za rok 2024. Všetky grafy a porovnania sú zostavené z týchto dát. Tento článok vznikol 
              s cieľom poskytnúť nezávislé porovnanie pre čitateľov - <strong>ceny sa môžu časom meniť</strong>, preto vždy odporúčame 
              overiť si aktuálne tarífy u konkrétnej taxislužby pred cestou.
            </p>

            <p className="text-sm text-foreground/70 mt-4">
              <strong>Poznámka:</strong> Všetky uvedené ceny sú orientačné a môžu sa líšiť v závislosti od konkrétnej taxislužby, 
              dennej doby, dňa v týždni a ďalších faktorov. Pred objednaním odporúčame overiť aktuálne ceny priamo u vybranej služby.
            </p>
          </article>

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-card rounded-xl shadow-3d-lg text-center">
            <h3 className="text-2xl font-bold mb-4">Chcete vidieť interaktívne porovnanie?</h3>
            <p className="text-foreground/70 mb-6">
              Pozrite si náš kompletný prieskum s mapou, grafmi a kalkulačkou cien.
            </p>
            <Link to="/prieskum-cien-taxisluzieb-slovensko-2025">
              <Button size="lg" className="gap-2">
                Zobraziť prieskum
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TaxiPriceArticlePage;
