'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SEOBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const SEOBreadcrumbs = ({ items }: SEOBreadcrumbsProps) => {
  const baseUrl = 'https://taxinearme.sk';

  useEffect(() => {
    // Vytvorenie BreadcrumbList Schema.org Structured Data
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Domov",
          "item": baseUrl
        },
        ...items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 2,
          "name": item.label,
          ...(item.href && { "item": `${baseUrl}${item.href}` })
        }))
      ]
    };

    // Pridanie breadcrumb schema do <head>
    let breadcrumbScriptElement = document.querySelector('script[data-breadcrumb-schema="true"]');
    if (!breadcrumbScriptElement) {
      breadcrumbScriptElement = document.createElement('script');
      breadcrumbScriptElement.setAttribute('type', 'application/ld+json');
      breadcrumbScriptElement.setAttribute('data-breadcrumb-schema', 'true');
      document.head.appendChild(breadcrumbScriptElement);
    }
    breadcrumbScriptElement.textContent = JSON.stringify(breadcrumbSchema);

    // Cleanup
    return () => {
      const element = document.querySelector('script[data-breadcrumb-schema="true"]');
      if (element) {
        element.remove();
      }
    };
  }, [items, baseUrl]);

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-2 md:pt-3">
      <Breadcrumb>
        <BreadcrumbList className="text-xs md:text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1 hover:text-foreground/70 transition-colors font-bold" title="Domovská stránka Taxi NearMe">
                <Home className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Domov</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="hover:text-foreground/70 transition-colors font-bold" title={item.label}>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-bold text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
