/**
 * Root Layout - Next.js App Router
 *
 * Tento layout je Server COMPONENT (default) a aplikuje sa na všetky stránky.
 * Obsahuje:
 * - Metadata (SEO, Open Graph, favicons) - migrované z index.html
 * - Google Analytics + Consent Mode v2 - migrované z index.html <head>
 * - Google Fonts (Manrope) - optimalizované cez next/font
 * - Global Providers (QueryClient, Tooltip) - Client Component wrapper
 * - Cookie Banner - GDPR compliance
 */

import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/providers';
import { CookieBanner } from '@/components/cookie-banner';

// Google Font optimalizácia (Next.js automaticky hostuješ fonty)
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap', // Lepší performance
  variable: '--font-roboto',
});

// Metadata API - SEO optimalizácia (migrované z index.html lines 3-43)
export const metadata: Metadata = {
  title: 'Taxi NearMe - Nájdite Taxi v Každom Meste na Slovensku',
  description:
    'Nájdite spoľahlivé taxislužby v každom meste na Slovensku. Bratislava, Košice, Prešov, Žilina a ďalších 8 miest. Rýchlo, jednoducho a vždy nablízku.',
  keywords: [
    'taxi',
    'taxislužby',
    'taxi slovensko',
    'taxi bratislava',
    'taxi košice',
    'objednať taxi',
    'taxi online',
  ],
  authors: [{ name: 'Taxi NearMe' }],
  manifest: '/site.webmanifest',

  // Favicons a ikony (z index.html lines 14-28)
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },

  // Open Graph metadata (z index.html lines 33-36)
  openGraph: {
    title: 'Taxi NearMe - Taxi v Každom Meste na Slovensku',
    description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku. Kompletný zoznam taxi služieb.',
    type: 'website',
    locale: 'sk_SK',
    url: 'https://taxinearme.sk',
    siteName: 'Taxi NearMe',
    images: [
      {
        url: 'https://taxinearme.sk/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Taxi NearMe - Nájdite taxi v každom meste na Slovensku',
      },
    ],
  },

  // Twitter Card metadata (z index.html lines 38-40)
  twitter: {
    card: 'summary_large_image',
    title: 'Taxi NearMe - Taxi v Každom Meste na Slovensku',
    description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku.',
    images: ['https://taxinearme.sk/og-image.png'],
  },

  // Ostatné meta tagy
  other: {
    'google-site-verification': '', // Ak máš Google Search Console
  },

  // Hreflang a canonical URL pre SEO
  alternates: {
    canonical: 'https://taxinearme.sk',
    languages: {
      'sk': 'https://taxinearme.sk',
      'x-default': 'https://taxinearme.sk',
    },
  },
};

// Viewport konfigurácia (z index.html line 31)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffd700', // Taxi yellow
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        {/* Sitemap link (z index.html line 43) */}
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />

        {/* Schema.org Organization and WebSite structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://taxinearme.sk/#organization',
                  name: 'Taxi NearMe',
                  url: 'https://taxinearme.sk',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://taxinearme.sk/taxi-nearme-logo.png',
                    width: 512,
                    height: 512,
                  },
                  description: 'Kompletný katalóg taxislužieb na Slovensku',
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'SK',
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://taxinearme.sk/#website',
                  url: 'https://taxinearme.sk',
                  name: 'Taxi NearMe',
                  description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku',
                  publisher: {
                    '@id': 'https://taxinearme.sk/#organization',
                  },
                  inLanguage: 'sk',
                },
              ],
            }),
          }}
        />

        {/*
          Google Consent Mode v2 - Default Denied State
          Musí byť pred Google Analytics (z index.html lines 45-61)
        */}
        <Script id="google-consent-mode" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Default stav: DENIED pre všetko okrem necessary
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'denied',
              'personalization_storage': 'denied',
              'security_storage': 'granted',
              'wait_for_update': 500
            });
          `}
        </Script>

        {/*
          Google Analytics (gtag.js)
          Z index.html lines 63-71
        */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XM0ES676GB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XM0ES676GB');
          `}
        </Script>
      </head>

      <body className={roboto.className}>
        {/*
          Providers wrapper - Client Component
          Obsahuje: QueryClient, TooltipProvider, Toasters, Cookie Consent logic
        */}
        <Providers>
          {children}
        </Providers>

        {/*
          Cookie Banner - GDPR Compliance
          Globálny komponent, zobrazuje sa na všetkých stránkach
        */}
        <CookieBanner />
      </body>
    </html>
  );
}
