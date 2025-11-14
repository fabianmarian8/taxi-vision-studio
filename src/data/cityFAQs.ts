export interface FAQItem {
  question: string;
  answer: string;
}

export const citySpecificFAQs: Record<string, FAQItem[]> = {
  'bratislava': [
    {
      question: 'Ako si objednám taxi v Bratislave?',
      answer: 'V Bratislave si môžete objednať taxi niekoľkými spôsobmi: telefonicky priamo u vybranej taxislužby (telefónne čísla nájdete v našom zozname), cez mobilné aplikácie moderných taxislužieb, alebo na stanovištiach taxi na frekventovaných miestach ako letisko, hlavná stanica či centrum mesta. Priemerná čakacia doba je len niekoľko minút.'
    },
    {
      question: 'Koľko stojí jazda taxíkom v Bratislave?',
      answer: 'Ceny taxi v Bratislave sa líšia podľa taxislužby. Zvyčajne zahŕňajú nástupnú sadzbu, cenu za kilometer a prípadné príplatky za čakanie alebo batožinu. Ceny sa môžu líšiť aj medzi dňom a nocou. Odporúčame si vopred overiť približnú cenu jazdy priamo u dispečingu vybranej taxislužby.'
    },
    {
      question: 'Sú taxislužby v Bratislave dostupné nonstop?',
      answer: 'Áno, väčšina z 14 taxislužieb v Bratislave poskytuje služby 24 hodín denne, 7 dní v týždni. Bratislava ako hlavné mesto má hustú sieť vozidiel, takže taxi je dostupné prakticky kedykoľvek.'
    },
    {
      question: 'Môžem platiť kartou v taxi v Bratislave?',
      answer: 'Väčšina moderných taxislužieb v Bratislave akceptuje platby kartou. Mnohé ponúkajú aj platbu cez mobilné aplikácie. Pri objednávaní je vhodné overiť si formy platby, ktoré daná taxislužba akceptuje.'
    },
    {
      question: 'Ako poznám, že ide o legálnu taxislužbu v Bratislave?',
      answer: 'Legálne taxi v Bratislave má označené vozidlo s logom taxislužby, menovku vodiča viditeľnú v interiéri a cenník umiestnený tak, aby bol pre cestujúcich čitateľný. Vždy si vyberajte oficiálne označené vozidlá taxislužby. Náš web obsahuje zoznam preverených taxislužieb.'
    },
    {
      question: 'Môžem si vopred rezervovať taxi v Bratislave?',
      answer: 'Áno, všetky taxislužby v Bratislave ponúkajú možnosť vopred si rezervovať taxi na konkrétny čas. To je obzvlášť užitočné pri cestách na letisko alebo na dôležité stretnutia. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez aplikáciu.'
    }
  ],
  'kosice': [
    {
      question: 'Ako si objednám taxi v Košiciach?',
      answer: 'V Košiciach si môžete objednať taxi telefonicky (telefónne čísla nájdete v našom zozname 14 taxislužieb), cez mobilné aplikácie, online formuláre na webových stránkach taxislužieb, alebo na stanovištiach pri železničnej stanici či v centre mesta.'
    },
    {
      question: 'Koľko stojí jazda taxíkom v Košiciach?',
      answer: 'Ceny taxi v Košiciach sú konkurencieschopné a líšia sa podľa spoločnosti. Základné tarify zahŕňajú nástupnú sadzbu a cenu za prejdený kilometer. Niektoré služby účtujú rozdielne ceny počas dňa a v noci. Pre presnú informáciu kontaktujte dispečing vybranej taxislužby.'
    },
    {
      question: 'Sú taxislužby v Košiciach dostupné nonstop?',
      answer: 'Väčšina z 14 taxislužieb v Košiciach poskytuje služby 24 hodín denne, 7 dní v týždni. Košice ako metropola východného Slovenska majú dobrú dostupnosť taxi služieb.'
    },
    {
      question: 'Môžem platiť kartou v taxi v Košiciach?',
      answer: 'Mnohé košické taxislužby idú s dobou a akceptujú platby kartou. Niektoré ponúkajú aj moderné spôsoby platby cez mobilné aplikácie. Odporúčame si to overiť pri objednávaní.'
    },
    {
      question: 'Ako poznám, že ide o legálnu taxislužbu v Košiciach?',
      answer: 'Legálne taxi má riadne označené vozidlo s logom, menovku vodiča a cenník viditeľný v interiéri. Vždy sa uistite, že nastupujete do označeného vozidla. Náš zoznam obsahuje overené taxislužby v Košiciach.'
    },
    {
      question: 'Môžem si vopred rezervovať taxi v Košiciach?',
      answer: 'Áno, všetky taxislužby v Košiciach ponúkajú možnosť vopred si rezervovať taxi na konkrétny čas. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez ich webovú stránku.'
    }
  ],
  'presov': [
    {
      question: 'Ako si objednám taxi v Prešove?',
      answer: 'V Prešove si môžete objednať taxi telefonicky (všetky potrebné čísla nájdete v našom zozname), cez mobilné aplikácie niektorých prešovských taxislužieb, alebo na stanovištiach pri autobusovej a železničnej stanici.'
    },
    {
      question: 'Koľko stojí jazda taxíkom v Prešove?',
      answer: 'Ceny taxi v Prešove závisia od cenníka konkrétnej spoločnosti. Vo všeobecnosti sa cena skladá z nástupnej sadzby a ceny za kilometer. Počas nočných hodín alebo sviatkov môžu byť ceny mierne vyššie. Pre presnú kalkuláciu kontaktujte taxislužbu vopred.'
    },
    {
      question: 'Sú taxislužby v Prešove dostupné nonstop?',
      answer: 'Áno, väčšina z 14 taxislužieb v Prešove poskytuje služby 24 hodín denne, 7 dní v týždni. Prešov ako tretie najväčšie mesto na Slovensku má spoľahlivú dostupnosť taxi služieb.'
    },
    {
      question: 'Môžem platiť kartou v taxi v Prešove?',
      answer: 'Niektoré prešovské taxislužby akceptujú platby kartou alebo cez mobilné aplikácie. Odporúčame si formu platby overiť pri objednávaní taxi.'
    },
    {
      question: 'Ako poznám, že ide o legálnu taxislužbu v Prešove?',
      answer: 'Legálne taxi má riadne označené vozidlo s logom taxislužby, menovku vodiča a cenník. Vždy skontrolujte, či je vozidlo riadne označené. Využívajte služby overených spoločností z nášho zoznamu.'
    },
    {
      question: 'Môžem si vopred rezervovať taxi v Prešove?',
      answer: 'Áno, všetky taxislužby v Prešove ponúkajú možnosť vopred si rezervovať taxi na konkrétny čas. Kontaktujte taxislužbu telefonicky alebo cez ich webovú stránku.'
    }
  ],
  'zilina': [
    {
      question: 'Ako si objednám taxi v Žiline?',
      answer: 'V Žiline si môžete objednať taxi telefonicky (kontakty na všetky taxislužby nájdete v našom zozname), cez mobilné aplikácie, online formuláre, alebo na stanovištiach v centre mesta či pri stanici. Objednávanie je rýchle a jednoduché.'
    },
    {
      question: 'Koľko stojí jazda taxíkom v Žiline?',
      answer: 'Ceny taxi v Žiline sa líšia podľa spoločnosti. Každá taxislužba má vlastnú tarifu skladajúcu sa z nástupnej sadzby a ceny za kilometer. Niektoré služby majú odlišné ceny pre denné a nočné jazdy. Odporúčame sa o cene informovať vopred.'
    },
    {
      question: 'Sú taxislužby v Žiline dostupné nonstop?',
      answer: 'Áno, väčšina z 14 taxislužieb v Žiline poskytuje služby 24 hodín denne, 7 dní v týždni. Žilina ako dôležité dopravné centrum má dobrú dostupnosť taxi služieb.'
    },
    {
      question: 'Môžem platiť kartou v taxi v Žiline?',
      answer: 'Mnohé žilinské taxislužby ponúkajú možnosť platby kartou alebo cez mobilné aplikácie. Pri objednávaní si overte, aké formy platby daná taxislužba akceptuje.'
    },
    {
      question: 'Ako poznám, že ide o legálnu taxislužbu v Žiline?',
      answer: 'Legálne taxi má riadne označené vozidlo s logom, menovku vodiča a cenník viditeľný v interiéri. Vždy sa uistite, že vozidlo je riadne označené. Využívajte služby známych a overených spoločností z nášho zoznamu.'
    },
    {
      question: 'Môžem si vopred rezervovať taxi v Žiline?',
      answer: 'Áno, všetky taxislužby v Žiline ponúkajú možnosť vopred si rezervovať taxi na konkrétny čas. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez aplikáciu.'
    }
  ],
  'banska-bystrica': [
    {
      question: 'Ako si objednám taxi v Banskej Bystrici?',
      answer: 'V Banskej Bystrici si môžete objednať taxi telefonicky (všetky kontakty nájdete v našom zozname), cez mobilné aplikácie niektorých taxislužieb, alebo na stanovištiach na Námestí SNP či pri autobusovej stanici.'
    },
    {
      question: 'Koľko stojí jazda taxíkom v Banskej Bystrici?',
      answer: 'Ceny taxi v Banskej Bystrici sa líšia podľa spoločnosti. Každá má svoj vlastný cenník zohľadňujúci nástupnú sadzbu a cenu za kilometer. Odporúčame sa vopred informovať o cene jazdy priamo u vybranej taxislužby.'
    },
    {
      question: 'Sú taxislužby v Banskej Bystrici dostupné nonstop?',
      answer: 'Väčšina z 9 taxislužieb v Banskej Bystrici poskytuje služby 24 hodín denne, 7 dní v týždni. Banská Bystrica ako centrum stredného Slovenska má spoľahlivú dostupnosť taxi služieb.'
    },
    {
      question: 'Môžem platiť kartou v taxi v Banskej Bystrici?',
      answer: 'Niektoré taxislužby v Banskej Bystrici akceptujú platby kartou alebo cez mobilné aplikácie. Pri objednávaní si overte, aké formy platby daná taxislužba ponúka.'
    },
    {
      question: 'Ako poznám, že ide o legálnu taxislužbu v Banskej Bystrici?',
      answer: 'Legálne taxi má riadne označené vozidlo s logom taxislužby, menovku vodiča a cenník. Vždy sa uistite, že nastupujete do riadne označeného vozidla. Využívajte služby overených spoločností z nášho zoznamu.'
    },
    {
      question: 'Môžem si vopred rezervovať taxi v Banskej Bystrici?',
      answer: 'Áno, všetky taxislužby v Banskej Bystrici ponúkajú možnosť vopred si rezervovať taxi na konkrétny čas. Kontaktujte taxislužbu telefonicky alebo cez ich webovú stránku.'
    }
  ]
};

// Default FAQ items for cities without specific FAQs
export const getDefaultFAQItems = (cityName: string): FAQItem[] => [
  {
    question: `Ako si objednám taxi v meste ${cityName}?`,
    answer: `Taxi v meste ${cityName} si môžete objednať telefonicky, cez webovú stránku taxislužby alebo mobilnú aplikáciu. Na našej stránke nájdete kontaktné údaje na dostupné taxislužby v meste.`
  },
  {
    question: `Koľko stojí jazda taxíkom v meste ${cityName}?`,
    answer: `Cena taxislužby závisí od vzdialenosti, času jazdy a konkrétnej taxislužby. Väčšina taxíkov má základný poplatok a cenu za kilometer. Presné cenníky si môžete overiť priamo u vybratej taxislužby.`
  },
  {
    question: `Sú taxislužby v meste ${cityName} dostupné nonstop?`,
    answer: `Väčšina taxislužieb v meste ${cityName} poskytuje služby 24 hodín denne, 7 dní v týždni. Niektoré menšie taxislužby môžu mať obmedzený prevádzkový čas. Odporúčame overiť si dostupnosť priamo u zvolenej taxislužby.`
  },
  {
    question: `Môžem platiť kartou v taxi v meste ${cityName}?`,
    answer: `Väčšina moderných taxislužieb v meste ${cityName} akceptuje platby kartou. Pri objednávaní je vhodné overiť si formy platby, ktoré daná taxislužba akceptuje.`
  },
  {
    question: `Ako poznám, že ide o legálnu taxislužbu v meste ${cityName}?`,
    answer: `Naša stránka je iba databáza kontaktov na taxislužby a nie poskytovateľ ani overovateľ týchto služieb. Odporúčame vám pred jazdou si overiť legitimitu taxislužby - legálne taxi má označené vozidlo s logom, menovkou vodiča a cenníkom viditeľným v interiéri vozidla.`
  },
  {
    question: `Môžem si vopred rezervovať taxi v meste ${cityName}?`,
    answer: `Áno, väčšina taxislužieb v meste ${cityName} ponúka možnosť vopred si rezervovať taxi na konkrétny čas. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez web.`
  }
];
