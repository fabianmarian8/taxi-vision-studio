export interface FAQItem {
  question: string;
  answer: string;
}

export const articleFAQs: Record<string, FAQItem[]> = {
  'porovnanie-cien-taxi-2024-2025': [
    {
      question: 'Aké sú priemerné ceny taxi na Slovensku?',
      answer: 'Nástupné sadzby sa pohybujú od 0,5€ do 3,5€, kilometrové tarify od 0,8€ do 1,5€. Najdrahšie sú taxi v Bratislave a Košiciach, najlacnejšie v menších mestách.'
    },
    {
      question: 'Prečo sú ceny taxi v Bratislave vyššie ako v iných mestách?',
      answer: 'Vyššie ceny v Bratislave sú spôsobené vyššími prevádzkovými nákladmi (nájmy, pohonné hmoty, mzdy), hustejšou dopravou a väčším dopytom. Navyše, bratislavské taxi služby často ponúkajú vyšší štandard vozidiel.'
    },
    {
      question: 'Ako zistiť cenu jazdy pred objednaním taxi?',
      answer: 'Väčšina moderných taxi aplikácií (Bolt, Uber, Hopin) zobrazuje odhadovanú cenu pred potvrdením objednávky. Pri klasických taxislužbách si môžete cenu vyžiadať telefonicky u dispečingu.'
    },
    {
      question: 'Sú ceny taxi regulované štátom?',
      answer: 'Na Slovensku nie sú ceny taxi centrálne regulované. Každá taxislužba si stanovuje vlastný cenník, ktorý musí byť viditeľne umiestnený vo vozidle. Existujú len odporúčané maximálne sadzby v niektorých mestách.'
    },
    {
      question: 'Kedy sú taxi drahšie - cez deň alebo v noci?',
      answer: 'Mnoho taxislužieb má vyššie sadzby v nočných hodinách (zvyčajne 22:00-06:00) a počas víkendov. Nočný príplatok môže byť 20-50% vyšší oproti denným cenám.'
    },
    {
      question: 'Je výhodnejšie používať taxi aplikácie alebo klasické taxislužby?',
      answer: 'Aplikácie ako Bolt a Uber majú často nižšie ceny vďaka väčšej konkurencii a efektívnejšiemu systému. Klasické taxislužby môžu byť výhodnejšie pre pravidelných zákazníkov alebo pri špecifických požiadavkách (napr. väčšie vozidlo, prepravatovarov).'
    }
  ],

  'hodnotenie-vodicov': [
    {
      question: 'Prečo je hodnotenie 4★ považované za zlé?',
      answer: 'V systémoch ako Uber a Bolt je priemerné hodnotenie vodičov okolo 4,8-4,9★. Hodnotenie 4★ znamená, že vodič je pod priemerom a môže čeliť sankciám alebo deaktiváciičtu. Pre aplikácie je "dobrý" vodič ten s hodnotením aspoň 4,7★.'
    },
    {
      question: 'Môže ma vodič ohodnotiť ako zákazníka?',
      answer: 'Áno, väčšina taxi aplikácií umožňuje obojsmernéhodnotenie. Vodiči môžu hodnotiť zákazníkov, čo ovplyvňuje pravdepodobnosť, že ich iní vodiči príjmu. Zákazníci s nízkym hodnotením môžu mať problém získať jazdu.'
    },
    {
      question: 'Čo sa stane vodičovi s nízkym hodnotením?',
      answer: 'Vodiči s hodnotením pod určitou hranicou (zvyčajne 4,5-4,6★) dostávajú varovania. Pri opakovanom nízkom hodnotení môže dôjsť k dočasnej pozastaveniu účtu alebo úplnej deaktivácii. Vodiči taktiež dostávajú menej objednávok.'
    },
    {
      question: 'Ako by som mal hodnotiť jazdu, ak bola v poriadku?',
      answer: 'Ak bola jazda bez problémov - vodič jazdil bezpečne, bol slušný, auto bolo čisté - vždy dajte 5★. Rezervujte nižšie hodnotenie len pre skutočné problémy (nebezpečná jazda, neslušnosť, nečistota). Hodnotenie 4★ nie je kompliment, ale kritika.'
    },
    {
      question: 'Môžem zmeniť hodnotenie po odoslaní?',
      answer: 'Väčšina aplikácií neumožňuje zmenu hodnotenia po jeho odoslaní. Preto je dôležité hodnotiť zodpovedne. V niektorých prípadoch môžete kontaktovať zákaznícku podporu, ale zmena nie je zaručená.'
    },
    {
      question: 'Ovplyvňuje moje hodnotenie len vodiča alebo aj taxislužbu?',
      answer: 'Hodnotenie ovplyvňuje primárne konkrétneho vodiča. Pri klasických taxislužbách sa hodnotenie vzťahuje na celú spoločnosť. Pri rideshare aplikáciách (Uber, Bolt) má každý vodič individuálne hodnotenie.'
    }
  ],

  'alkohol-nocny-zivot': [
    {
      question: 'Môže vodič odmietnuť opitého zákazníka?',
      answer: 'Áno, vodič má právo odmietnuť prepravu zákazníka, ak sa obáva o svoju bezpečnosť, čistotu vozidla alebo ak zákazník vykazuje agresívne správanie. Ľahká opitosť nie je dôvod na odmietnutie, ale zvracanie, agresivita alebo neschopnosť komunikácie sú oprávnené dôvody.'
    },
    {
      question: 'Čo sa stane, ak sa mi urobí zle vo vozidle?',
      answer: 'Ak dôjde k znečisteniu vozidla (zvracanie), vodiči zvyčajne účtujú poplatok za čistenie (50-200€ podľa rozsahu). Pri taxi aplikáciách ide poplatok automaticky z vašej karty. Ak cítite nevoľnosť, okamžite vodičovi oznámte, aby mohol zastaviť.'
    },
    {
      question: 'Sú taxi v noci drahšie?',
      answer: 'Áno, väčšina taxislužieb má vyššie sadzby v nočných hodinách (zvyčajne 22:00-06:00). Nočný príplatok môže byť 20-50% vyšší. Rideshare aplikácie používajú "surge pricing" - ceny rastú pri vysokom dopyte (víkendové noci, sviatky).'
    },
    {
      question: 'Musím vodičovi dať sprepitné po nočnej jazde?',
      answer: 'Sprepitné nie je povinné, ale je oceňované, najmä ak vodič preukázal trpezlivosť, pomoc alebo profesionalitu. Po nočnej jazde s opitými zákazníkmi je sprepitné 10-15% bežným štandardom. V aplikáciách môžete dať sprepitné elektronicky.'
    },
    {
      question: 'Môžem si vziať do taxi alkohol na piť počas jazdy?',
      answer: 'Nie, konzumácia alkoholu počas jazdy je vo väčšine taxi zakázaná. Vodič má právo túto jazdu ukončiť. Preprava uzavretých fliaš alkoholu (napr. z večierku) je zvyčajne povolená.'
    },
    {
      question: 'Čo robiť, ak vodič odmietne jazdu kvôli mojmu stavu?',
      answer: 'Ak vodič odmietne jazdu, máte právo objednať si iné taxi. Snažte sa byť slušní a rešpektujte rozhodnutie vodiča - ich bezpečnosť a vlastníctvo vozidla sú oprávnené dôvody. V aplikáciách môžete skúsiť inú službu. Agresivita situáciu len zhorší.'
    }
  ],

  'komplexny-sprievodca-taxi': [
    {
      question: 'Ako si vybrať spoľahlivú taxislužbu?',
      answer: 'Vyberte službu s dobrými recenziami, viditeľným cenníkom a oficiálnym označením. Uprednostnite overené spoločnosti s dlhodobou históriou alebo známe aplikácie (Uber, Bolt, Hopin). Vyhýbajte sa neoznačeným vozidlám a vodičom bez legitimácie.'
    },
    {
      question: 'Aké sú moje práva ako zákazník taxi?',
      answer: 'Máte právo na bezpečnú prepravu, jasnú cenu stanovenú vopred, účtenku, viditeľný cenník vo vozidle a voľbu trasy. Vodič musí mať viditeľnú identifikáciu. Môžete odmietnuť jazdu, ak nesúhlasíte s podmienkami.'
    },
    {
      question: 'Čo robiť v prípade problému s vodičom?',
      answer: 'Zdokumentujte problém (číslo vozidla, meno vodiča, čas), kontaktujte zákaznícku podporu taxislužby a nahláste incident. V aplikáciách použite funkciu nahlásenia problému. Pri vážnych incidentoch (nebezpečná jazda, obťažovanie) kontaktujte políciu.'
    },
    {
      question: 'Môžem platiť taxi kartou?',
      answer: 'Väčšina moderných taxislužieb a všetky rideshare aplikácie akceptujú platbu kartou. Pri klasických taxíkoch si formu platby overte pri objednávaní. Aplikácie zvyčajne vyžadujú uloženú kartu a platba prebieha automaticky.'
    },
    {
      question: 'Je bezpečné používať taxi aplikácie?',
      answer: 'Áno, taxi aplikácie sú všeobecne bezpečné. Ponúkajú sledovanie jazdy v reálnom čase, zdieľanie polohy, hodnotenie vodičov a záznam všetkých jázd. Vodiči sú overení a identifikovaní. Vždy si overte, že nastupujete do správneho vozidla (značka, ŠPZ, meno vodiča).'
    },
    {
      question: 'Môžem taxi objednať vopred?',
      answer: 'Áno, väčšina taxislužieb umožňuje rezerváciu vopred. Klasické služby ponúkajú telefonickú rezerváciu, aplikácie majú funkciu "naplánovaná jazda". Ideálne pre cesty na letisko, dôležité stretnutia alebo skoré ranné hodiny.'
    }
  ],

  'komunikacia-taxikar-zakaznik': [
    {
      question: 'Musím sa rozprávať s vodičom počas jazdy?',
      answer: 'Nie, komunikácia nie je povinná. Mnohí vodiči rešpektujú, že zákazníci chcú mať pokoj. Ak chcete ticho, môžete zdvorilo naznačiť (slúchadlá, práca na telefóne). Dobrý vodič vycíti vašu náladu.'
    },
    {
      question: 'Môžem vodičovi povedať, ako má jazdiť?',
      answer: 'Môžete navrhnúť preferovanú trasu, ak poznáte lepšiu cestu. Kritika štýlu jazdy je vhodná len pri nebezpečnom správaní. Vodič je profesionál - zbytočné komentovanie rýchlosti alebo manévrov je neslušné, pokiaľ nejazdi nebezpečne.'
    },
    {
      question: 'Môžem požiadať vodiča o prestávku?',
      answer: 'Áno, pri dlhších jazdách môžete požiadať o krátku prestávku (toaleta, nákup). Upozornite vodiča vopred. Taxameter beží aj počas prestávky. Pri aplikáciách to môže ovplyvniť finálnu cenu.'
    },
    {
      question: 'Čo robiť, ak vodič používa telefón počas jazdy?',
      answer: 'Ak vodič telefonuje bez hands-free alebo píše správy, máte právo ho upozorniť. Je to nielen neslušné, ale aj nebezpečné a protizákonné. Ak odmietne prestať, môžete jazdu ukončiť a nahlásiť incident.'
    },
    {
      question: 'Môžem meniť trasu počas jazdy?',
      answer: 'Áno, môžete požiadať o zmenu cieľa alebo pridanie zastávky. Upozornite vodiča vopred, ideálne pred začiatkom jazdy. Pri aplikáciách zmena cieľa upraví cenu. Častézmeny môžu vodiča frustrova ť, komunikujte jasne.'
    },
    {
      question: 'Musím dať vodičovi sprepitné?',
      answer: 'Sprepitné nie je povinné, ale je oceňované pri kvalitnej službe. Bežný štandard je 10-15% z ceny jazdy, pri výnimočnej pomoci (ťažká batožina, dlhé čakanie) viac. V aplikáciách môžete dať sprepitné elektronicky.'
    }
  ],

  'elektrifikacia-taxi': [
    {
      question: 'Sú elektrické taxíky lacnejšie než bežné taxi?',
      answer: 'Nie nevyhnutne pre zákazníka. Elektrické vozidlá majú nižšie prevádzkové náklady (elektrina vs. benzín, menej údržby), ale vysoké nákupné ceny. Niektoré služby ponúkajú nižšie ceny na propagáciu ekologickej dopravy, ale nie je to pravidlom.'
    },
    {
      question: 'Koľko elektrických taxi je na Slovensku?',
      answer: 'Počet rastie, ale stále tvorí menšinu. V Bratislave a Košiciach je viac elektrotaxíkov vďaka Bolt Green a iniciatívam miest. Presné čísla nie sú verejné, odhady hovoria o 5-10% elektrických vozidiel v taxi flotile.'
    },
    {
      question: 'Majú elektrické taxi dostatočný dojazd?',
      answer: 'Moderné elektrické vozidlá (Tesla Model 3, VW ID.4, Hyundai Kona Electric) majú dojazd 300-500 km, čo je viac než dostačujúce pre mestskú taxislužbu. Vodiči nabíjajú počas prestávok, problémom nie je dojazd, ale dostupnosť rýchlych nabíjačiek.'
    },
    {
      question: 'Prečo nie je viac elektrických taxi?',
      answer: 'Vysoká nákupná cena vozidiel (30 000-50 000€), nedostatočná nabíjacia infraštruktúra a obava z dojazdu sú hlavné prekážky. Mnohí vodiči pracujú s prenajatými vozidlami, kde elektrické opcie sú limitované.'
    },
    {
      question: 'Sú elektrické taxi ekologickejšie?',
      answer: 'Áno, elektrické vozidlá nemajú lokálne emisie a sú tichšie. Ekologická stopa závisí od zdroja elektriny - na Slovensku s vyso kým podielom jadrovej a vodnej energie sú emisie významne nižšie než u spaľovacích motorov.'
    },
    {
      question: 'Bude budúcnosť taxi plne elektrická?',
      answer: 'Áno, trend smeruje k elektromobilite. EÚ plánuje zákaz predaja nových spaľovacích vozidiel do 2035. Mestá podporujú elektrické taxi dotáciami a zvýhodneným prístupom. Do 10-15 rokov budú elektrické taxi dominovať.'
    }
  ],

  'psychologia-zakaznikov': [
    {
      question: 'Prečo niektorí zákazníci mlčia a iní sú veľmi hovorní?',
      answer: 'Je to kombinácia osobnosti, nálady a situácie. Introverti preferujú ticho, extroverti radi komunikujú. Ranné jazdy = menej reči, večer po akcii = viac. Ako vodič, rešpektujte signály zákazníka.'
    },
    {
      question: 'Ako vodič spozná, že zákazník chce mať pokoj?',
      answer: 'Signály: slúchadlá, práca na telefóne/notebooku, kniha, krátke odpovede, pohľad z okna. Dobrý vodič po úvodnom pozdravu vycíti náladu. Ak zákazník nechce rozhovor, rešpektujte to.'
    },
    {
      question: 'Prečo niektorí zákazníci ignorujú vodiča?',
      answer: 'Nie je to vždy neslušnosť. Môžu byť zaneprázdnení (pracovný hovor), unavení, stresovaní alebo jednoducho preferujú ticho. Kultúrne rozdiely tiež hrajú rolu. Nebrať to osobne.'
    },
    {
      question: 'Sú biznismeníčinší než ostatní zákazníci?',
      answer: 'Nie nevyhnutne. Biznis zákazníci často riešia pracovné veci počas jazdy (hovory, maily), preto potrebujú sústrediť sa. To neznamená aroganciu, ale prioritizáciu času. Očakávajú profesionalitu a efektivitu.'
    },
    {
      question: 'Prečo niektorí zákazníci kritizujú jazdu vodiča?',
      answer: 'Dôvody: stres, potreba kontroly, zlé skúsenosti z minulosti, alebo skutočne nebezpečná jazda. Ako vodič, kľudne vypočujte kritiku. Ak je oprávnená, upravte jazdu. Ak nie, vysvetlite profesionálne.'
    },
    {
      question: 'Ako vodič môže zlepšiť zákaznícku skúsenosť?',
      answer: 'Čisté auto, príjemná vôňa, tichá hudba (alebo na požiadanie), ponuka nabíjačky telefónu, fľaša vody, rešpektovanie súkromia. Prispôsobte sa zákazníkovi - niektorí chcú konverzáciu, iní ticho. Profesionalita = flexibilita.'
    }
  ],

  'taxi-navigacia': [
    {
      question: 'Je lepšia navigácia alebo lokálna znalosť vodiča?',
      answer: 'Ideálna je kombinácia oboch. Navigácia poskytuje real-time info o doprave, lokálna znalosť zahŕňa skratky, objazdy a špecifiká mesta. Skúsený vodič vie, kedy ignorovať navigáciu a použiť lepšiu trasu.'
    },
    {
      question: 'Prečo Waze niekedy navrhuje horšie trasy než Google Maps?',
      answer: 'Waze sa sústreďuje na reálny čas a community hlásenia, Google Maps má lepšie historické dáta. Waze môže posielať na komplikované objazdy, Google volí stabilnejšie trasy. Záleží na situácii - v zápchach vyhrá Waze, pri predvídateľných trasách Google.'
    },
    {
      question: 'Môžem vodičovi povedať, aby použil inú trasu?',
      answer: 'Áno, ak poznáte lepšiu cestu, zdvorilo to navrhnitež Dobrý vodič vysvetlí svoju voľbu (aktuálna doprava, skúsenosť) alebo použije vašu trasu. Konečné rozhodnutie je na vodičovi - je zodpovedný za bezpečnosť.'
    },
    {
      question: 'Prečo niektorí vodiči nedôverujú navigácii?',
      answer: 'Zlé skúsenosti: navigácia zaviedla na zlú cestu, neaktuálne mapy, technické problémy. Skúsení vodiči vedia, že navigácia nie je neomylná, najmä v menších mestách s nedostatočným mapovaním. Preto kombinujú navigáciu so znalosťami.'
    },
    {
      question: 'Čo robiť, ak sa vodič stratí napriek navigácii?',
      answer: 'Pomôžte vodičovi - použite vlastnú navigáciu, zavolajte na cieľové miesto pre inštrukcie. Kritika nepomôže. Chyba sa môže stať komukoľvek (zlá adresa, nedostupná ulica). Riešte konštruktívne, nie konfrontačne.'
    },
    {
      question: 'Akú navigáciu používajú profesionálni vodiči?',
      answer: 'Google Maps a Waze sú najčastejšie. Google je spoľahlivejší pre presné adresy, Waze lepší pre vyhýbanie sa doprave. Vodiči často prepínajú medzi oboma podľa situácie. Niektorí používajú Sygic alebo Here Maps.'
    }
  ],

  'co-musi-zniest-vodic': [
    {
      question: 'Aké sú najčastejšie problémy vodičov taxi?',
      answer: 'Dlhé pracovné hodiny (10-12h denne), nízke výdel ky po odpočítaní nákladov, stres z dopravy, nezodpovední zákazníci, neustále sedenie, neisté príjmy. Aplikácie pridávajú tlak na hodnotenie a provízie.'
    },
    {
      question: 'Koľko reálne zarobí vodič taxi?',
      answer: 'Po odpočítaní nákladov (PHM, údržba, poistenie, provízie aplikácií) čistý zisk je 5-10€/hod. Pri 10-hodinovej zmene je to 50-100€/deň, teda 1000-2000€/mesiac. Vyššie zárobky vyžadujú viac hodín alebo špičkové obdobia.'
    },
    {
      question: 'Prečo sú vodiči niekedy neprístupní alebo nervózni?',
      answer: 'Stres z neustálej jazdy, finančné starosti, nedostatok spánku, opakované negatívne skúsenosti so zákazníkmi. Predstavte si 10 hodín v zápchach s tlakom zarobiť. Nie je to ospravedlnenie, ale vysvetlenie.'
    },
    {
      question: 'Môžu vodiči odmietnuť jazdu?',
      answer: 'Áno, pri oprávnených dôvodoch: bezpečnosť, podozrenie z podvodu, agresívne správanie, znečistenie vozidla. V aplikáciách časté odmietanie znižuje hodnotenie vodiča, preto to robia len v krajných prípadoch.'
    },
    {
      question: 'Ako dlho vydrží vodič taxi v profesii?',
      answer: 'Priemer je 3-5 rokov. Fyzická a psychická náročnosť, nízke výdel ky a neistota vedú k vysokej fluktuácii. Dlhodobí vodiči sú buď majitelia vlastnej licencie/firmy alebo tí, čo našli stabilnú klientelu.'
    },
    {
      question: 'Čo môžem urobiť, aby som vodičovi uľahčil prácu?',
      answer: 'Buďte presní s adresou, pripravení na nástup, zdvorili, ne rušte zbytočne, zaplaťte promptne, dajte spravodlivé hodnotenie. Ak vodič pomohol s batožinou alebo bol výnimočne slušný, sprepitné je ocenené.'
    }
  ],

  'temna-strana-bolt-uber': [
    {
      question: 'Prečo vodiči Bolt/Uber zarábajú menej?',
      answer: 'Platformy si berú 20-30% províziu z každej jazdy. Navyše, ceny sú často nižšie než u klasických taxíkov kvôli konkurencii. Po odpočítaní PHM, údržby a poistenia čistý zisk vodičov je 5-8€/hod, čo je blízko minimálnej mzdy.'
    },
    {
      question: 'Je pravda, že Bolt/Uber manipulujú s cenami?',
      answer: '"Surge pricing" (zvýšené ceny pri vysokom dopyte) je legálne, ale netransparentné. Ceny môžu byť 2-3x vyššie počas špičiek. Zákazníci platia viac, ale vodiči z toho veľa nevidia - väčšinu zisku berie platforma.'
    },
    {
      question: 'Prečo klesá kvalita služieb Bolt/Uber?',
      answer: 'Tlak na ceny vedie k tomu, že vodiči šetria na údržbe, staršie autá, menej času na čistenie. Viacerí vodiči pracuje na viacerých platformách súčasne, čo znižuje pozornosť. Zúfalstvo z nízkych zárobkov ovplyvňuje prístup.'
    },
    {
      question: 'Sú klasické taxislužby lepšie než Bolt/Uber?',
      answer: 'Záleží. Klasické taxi majú často vyšší štandard (profesionálni vodiči, lepšie autá, jasný cenník), ale sú drahšie. Bolt/Uber sú lacnejší a pohodlnejší (aplikácia, platba kartou), ale kvalita je variabilná.'
    },
    {
      question: 'Prečo Bolt/Uber deaktivujú vodičov bez vysvetlenia?',
      answer: 'Automatizované systémy hodnotenia a sťažností môžu viesť k deaktivácii bez ľudského posúdenia. Nízke hodnotenie, časté zrušenia, sťažnosti zákazníkov = deaktivácia. Odvolanie je možné, ale zriedka úspešné. Vodiči sú nahraditeľní.'
    },
    {
      question: 'Aká je budúcnosť Bolt/Uber na Slovensku?',
      answer: 'Dominancia bude pokračovať vďaka pohodliu a nízkym cenám. Ale rastúca nespokojnosť vodičov môže viesť k regulácii (minimálne ceny, sociálne zabezpečenie). Niektoré mestá už zavádzajú pravidlá na ochranu vodičov.'
    }
  ]
};
