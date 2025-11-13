import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface CityFAQProps {
  cityName: string;
}

export const CityFAQ = ({ cityName }: CityFAQProps) => {
  const faqItems: FAQItem[] = [
    {
      question: `Ako si objednám taxi v meste ${cityName}?`,
      answer: `Taxi v meste ${cityName} si môžete objednať telefonicky, cez webovú stránku taxislužby alebo mobilnú aplikáciu. Na našej stránke nájdete kontaktné údaje na overené taxislužby.`
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
      answer: `Legálna taxislužba má označené vozidlo s logom, menovkou vodiča, taxametrom a cenníkom viditeľným v interiéri vozidla. Na našej stránke uvádzame overené a licencované taxislužby.`
    },
    {
      question: `Môžem si vopred rezervovať taxi v meste ${cityName}?`,
      answer: `Áno, väčšina taxislužieb v meste ${cityName} ponúka možnosť vopred si rezervovať taxi na konkrétny čas. Stačí kontaktovať vybranú taxislužbu telefonicky alebo cez web.`
    }
  ];

  // Pridanie FAQ Schema.org Structured Data
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };

    // Pridanie FAQ schema do <head>
    let faqScriptElement = document.querySelector('script[data-faq-schema="true"]');
    if (!faqScriptElement) {
      faqScriptElement = document.createElement('script');
      faqScriptElement.setAttribute('type', 'application/ld+json');
      faqScriptElement.setAttribute('data-faq-schema', 'true');
      document.head.appendChild(faqScriptElement);
    }
    faqScriptElement.textContent = JSON.stringify(faqSchema);

    // Cleanup
    return () => {
      const element = document.querySelector('script[data-faq-schema="true"]');
      if (element) {
        element.remove();
      }
    };
  }, [cityName, faqItems]);

  return (
    <section className="py-12 md:py-20 lg:py-24 px-4 md:px-8 relative">
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-12 w-12 md:h-16 md:w-16 text-foreground" />
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
            Často Kladené Otázky
          </h2>
          <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
            Všetko, čo potrebujete vedieť o taxi v meste {cityName}
          </p>
        </div>

        <Card className="perspective-1000">
          <div className="card-3d shadow-3d-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-black text-foreground">
                Odpovede na vaše otázky
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-bold text-foreground hover:text-foreground/80">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/90 font-medium">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
};
