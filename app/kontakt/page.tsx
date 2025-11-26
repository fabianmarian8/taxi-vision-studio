/**
 * Contact Page
 *
 * Migrované z: src/vite-pages/Contact.tsx
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { FooterLegal } from '@/components/FooterLegal';
import { SEO_CONSTANTS } from '@/lib/seo-constants';

export const metadata: Metadata = {
  title: 'Kontakt | Taxi NearMe',
  description: 'Kontaktujte nás cez email info@taxinearme.sk',
  openGraph: {
    title: 'Kontakt | Taxi NearMe',
    description: 'Kontaktujte nás cez email info@taxinearme.sk',
    type: 'website',
    locale: 'sk_SK',
    url: 'https://www.taxinearme.sk/kontakt',
    siteName: 'Taxi NearMe',
    images: [
      {
        url: 'https://www.taxinearme.sk/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kontakt - Taxi NearMe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SEO_CONSTANTS.twitterSite,
    title: 'Kontakt | Taxi NearMe',
    description: 'Kontaktujte nás cez email info@taxinearme.sk',
    images: ['https://www.taxinearme.sk/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.taxinearme.sk/kontakt',
    languages: {
      'sk': 'https://www.taxinearme.sk/kontakt',
      'x-default': 'https://www.taxinearme.sk/kontakt',
    },
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto max-w-4xl px-8 py-24">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-12 text-foreground">Kontakt</h1>

        <div className="space-y-8">
          <div className="bg-card rounded-2xl p-8 md:p-12 border-2 border-foreground/10">
            <div className="flex items-start gap-6">
              <div className="bg-foreground text-background rounded-full p-4">
                <Mail className="h-8 w-8" />
              </div>

              <div className="flex-1 space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Kontaktujte nás</h2>
                <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                  Ak máte otázky, podnety, sťažnosti, požiadavky na zmenu alebo návrhy na
                  spoluprácu, napíšte nám na
                </p>

                <a
                  href="mailto:info@taxinearme.sk"
                  className="inline-flex items-center text-2xl md:text-3xl font-bold text-foreground hover:text-foreground/70 transition-colors"
                >
                  info@taxinearme.sk
                </a>

                <p className="text-lg text-foreground/80 leading-relaxed pt-4 border-t border-foreground/10">
                  Odpovieme vám čo najskôr.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link href="/">
          <Button className="mt-12" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </Link>
      </div>

      <FooterLegal />
    </div>
  );
}
