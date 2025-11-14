#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load cities data
const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/cities.json'), 'utf8'));

// Generate FAQ for a city
const generateCityFAQs = (city) => {
  const { name, slug, taxiServices } = city;
  const taxiCount = taxiServices.length;
  const hasMany = taxiCount >= 10;

  return [
    {
      question: `Ako si objednám taxi v meste ${name}?`,
      answer: generateOrderAnswer(name, taxiCount, hasMany)
    },
    {
      question: `Koľko stojí jazda taxíkom v meste ${name}?`,
      answer: generatePriceAnswer(name)
    },
    {
      question: `Sú taxislužby v meste ${name} dostupné nonstop?`,
      answer: generateAvailabilityAnswer(name, taxiCount)
    },
    {
      question: `Môžem platiť kartou v taxi v meste ${name}?`,
      answer: generatePaymentAnswer(name, hasMany)
    },
    {
      question: `Ako poznám, že ide o legálnu taxislužbu v meste ${name}?`,
      answer: generateLegalityAnswer(name)
    },
    {
      question: `Môžem si vopred rezervovať taxi v meste ${name}?`,
      answer: generateReservationAnswer(name)
    }
  ];
};

const generateOrderAnswer = (cityName, taxiCount, hasMany) => {
  const base = `V meste ${cityName} si môžete objednať taxi telefonicky (telefónne čísla nájdete v našom zozname`;

  if (hasMany) {
    return `${base} ${taxiCount} taxislužieb), cez mobilné aplikácie moderných taxislužieb, online formuláre na webových stránkach, alebo na stanovištiach taxi na frekventovaných miestach v meste. Objednávanie je rýchle a jednoduché.`;
  } else if (taxiCount >= 5) {
    return `${base} ${taxiCount} taxislužieb), cez mobilné aplikácie niektorých taxislužieb, alebo na stanovištiach taxi v centre mesta. Priemerná čakacia doba je krátka.`;
  } else {
    return `${base} ${taxiCount} ${taxiCount === 1 ? 'taxislužby' : 'taxislužieb'}). Niektoré služby môžu ponúkať aj možnosť objednania cez webovú stránku alebo mobilnú aplikáciu.`;
  }
};

const generatePriceAnswer = (cityName) => {
  return `Ceny taxi v meste ${cityName} sa líšia podľa spoločnosti. Každá taxislužba má vlastný cenník, ktorý zohľadňuje nástupnú sadzbu a cenu za kilometer. Niektoré služby majú odlišné ceny pre denné a nočné jazdy alebo počas víkendov. Odporúčame sa o cene informovať vopred priamo u dispečingu vybranej taxislužby.`;
};

const generateAvailabilityAnswer = (cityName, taxiCount) => {
  if (taxiCount >= 10) {
    return `Áno, väčšina z ${taxiCount} taxislužieb v meste ${cityName} poskytuje služby 24 hodín denne, 7 dní v týždni. Vďaka širokej ponuke je taxi dostupné prakticky kedykoľvek.`;
  } else if (taxiCount >= 5) {
    return `Väčšina z ${taxiCount} taxislužieb v meste ${cityName} poskytuje služby 24 hodín denne, 7 dní v týždni. Pre istotu si overte dostupnosť priamo u vybranej taxislužby.`;
  } else {
    return `Väčšina taxislužieb v meste ${cityName} poskytuje služby počas celého dňa. Niektoré môžu mať obmedzený prevádzkový čas, preto si dostupnosť overte priamo u vybranej taxislužby.`;
  }
};

const generatePaymentAnswer = (cityName, hasMany) => {
  if (hasMany) {
    return `Väčšina moderných taxislužieb v meste ${cityName} akceptuje platby kartou. Mnohé ponúkajú aj platbu cez mobilné aplikácie. Pri objednávaní je vhodné overiť si formy platby, ktoré daná taxislužba akceptuje.`;
  } else {
    return `Niektoré taxislužby v meste ${cityName} akceptujú platby kartou alebo cez mobilné aplikácie. Odporúčame si formu platby overiť pri objednávaní taxi.`;
  }
};

const generateLegalityAnswer = (cityName) => {
  return `Legálne taxi v meste ${cityName} má riadne označené vozidlo s logom taxislužby, menovku vodiča viditeľnú v interiéri a cenník. Vždy sa uistite, že nastupujete do riadne označeného vozidla. Využívajte služby overených spoločností z nášho zoznamu.`;
};

const generateReservationAnswer = (cityName) => {
  return `Áno, všetky taxislužby v meste ${cityName} ponúkajú možnosť vopred si rezervovať taxi na konkrétny čas. To je obzvlášť užitočné pri dôležitých cestách. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez ich webovú stránku či aplikáciu.`;
};

// Generate TypeScript file content
const generateTypeScriptFile = () => {
  let content = `export interface FAQItem {
  question: string;
  answer: string;
}

export const citySpecificFAQs: Record<string, FAQItem[]> = {\n`;

  citiesData.cities.forEach((city, index) => {
    const faqs = generateCityFAQs(city);
    content += `  '${city.slug}': [\n`;

    faqs.forEach((faq, faqIndex) => {
      content += `    {\n`;
      content += `      question: '${faq.question}',\n`;
      content += `      answer: '${faq.answer}'\n`;
      content += `    }${faqIndex < faqs.length - 1 ? ',' : ''}\n`;
    });

    content += `  ]${index < citiesData.cities.length - 1 ? ',' : ''}\n`;
  });

  content += `};

// Default FAQ items for cities without specific FAQs (fallback)
export const getDefaultFAQItems = (cityName: string): FAQItem[] => [
  {
    question: \`Ako si objednám taxi v meste \${cityName}?\`,
    answer: \`Taxi v meste \${cityName} si môžete objednať telefonicky, cez webovú stránku taxislužby alebo mobilnú aplikáciu. Na našej stránke nájdete kontaktné údaje na dostupné taxislužby v meste.\`
  },
  {
    question: \`Koľko stojí jazda taxíkom v meste \${cityName}?\`,
    answer: \`Cena taxislužby závisí od vzdialenosti, času jazdy a konkrétnej taxislužby. Väčšina taxíkov má základný poplatok a cenu za kilometer. Presné cenníky si môžete overiť priamo u vybratej taxislužby.\`
  },
  {
    question: \`Sú taxislužby v meste \${cityName} dostupné nonstop?\`,
    answer: \`Väčšina taxislužieb v meste \${cityName} poskytuje služby 24 hodín denne, 7 dní v týždni. Niektoré menšie taxislužby môžu mať obmedzený prevádzkový čas. Odporúčame overiť si dostupnosť priamo u zvolenej taxislužby.\`
  },
  {
    question: \`Môžem platiť kartou v taxi v meste \${cityName}?\`,
    answer: \`Väčšina moderných taxislužieb v meste \${cityName} akceptuje platby kartou. Pri objednávaní je vhodné overiť si formy platby, ktoré daná taxislužba akceptuje.\`
  },
  {
    question: \`Ako poznám, že ide o legálnu taxislužbu v meste \${cityName}?\`,
    answer: \`Naša stránka je iba databáza kontaktov na taxislužby a nie poskytovateľ ani overovateľ týchto služieb. Odporúčame vám pred jazdou si overiť legitimitu taxislužby - legálne taxi má označené vozidlo s logom, menovkou vodiča a cenníkom viditeľným v interiéri vozidla.\`
  },
  {
    question: \`Môžem si vopred rezervovať taxi v meste \${cityName}?\`,
    answer: \`Áno, väčšina taxislužieb v meste \${cityName} ponúka možnosť vopred si rezervovať taxi na konkrétny čas. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez web.\`
  }
];
`;

  return content;
};

// Generate and write the file
const outputPath = path.join(__dirname, '../src/data/cityFAQs.ts');
const content = generateTypeScriptFile();

fs.writeFileSync(outputPath, content, 'utf8');

console.log(`✓ Successfully generated cityFAQs.ts with ${citiesData.cities.length} cities!`);
console.log(`File saved to: ${outputPath}`);
