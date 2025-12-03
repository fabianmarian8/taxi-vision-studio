'use client';

import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { citySpecificFAQs, getDefaultFAQItems, type FAQItem } from "@/data/cityFAQs";

interface CityFAQProps {
  cityName: string;
  citySlug: string;
}

export const CityFAQ = ({ cityName, citySlug }: CityFAQProps) => {
  // Get city-specific FAQs or use default ones
  const faqItems: FAQItem[] = citySpecificFAQs[citySlug] || getDefaultFAQItems(cityName);

  // Pridanie FAQ Schema.org Structured Data
  useEffect(() => {
    // Guard pre SSR - document nie je dostupný na serveri
    if (typeof document === 'undefined') return;

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
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground">
            Často Kladené Otázky
          </h2>
          <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
            Všetko, čo potrebujete vedieť o taxi v meste {cityName}
          </p>
        </div>

        <Card>
          <div>
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
