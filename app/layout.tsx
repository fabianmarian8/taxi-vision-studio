/**
 * Root Layout - Next.js App Router
 *
 * Tento layout je Server COMPONENT (default) a aplikuje sa na všetky stránky.
 * Obsahuje:
 * - Metadata (SEO, Open Graph, favicons) - migrované z index.html
 * - Google Analytics + Consent Mode v2 - migrované z index.html <head>
 * - Google Fonts (Inter only) - optimalizované cez next/font (1 font = 200ms úspora)
 * - Global Providers (QueryClient, Tooltip) - Client Component wrapper
 * - Cookie Banner - GDPR compliance
 */

import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { SEO_CONSTANTS } from '@/lib/seo-constants';
import { CookieBanner } from '@/components/cookie-banner';

// Optimalizovaný Inter font cez next/font/google
// LCP Optimalizácia: Redukovaný z 3 fontov na 1 (úspora ~200ms render-blocking)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
    url: 'https://www.taxinearme.sk',
    siteName: 'Taxi NearMe',
    images: [
      {
        url: 'https://www.taxinearme.sk/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Taxi NearMe - Nájdite taxi v každom meste na Slovensku',
      },
    ],
  },

  // Twitter Card metadata (z index.html lines 38-40)
  twitter: {
    card: 'summary_large_image',
    site: SEO_CONSTANTS.twitterSite,
    title: 'Taxi NearMe - Taxi v Každom Meste na Slovensku',
    description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku.',
    images: ['https://www.taxinearme.sk/og-image.png'],
  },

  // Ostatné meta tagy
  other: {
    'google-site-verification': 'zErTLx6mZJ_pALOvJPlUcZOXaZjW4tCTTfQVQICywzk',
  },

  // Hreflang a canonical URL pre SEO
  alternates: {
    canonical: 'https://www.taxinearme.sk',
    languages: {
      'sk': 'https://www.taxinearme.sk',
      'x-default': 'https://www.taxinearme.sk',
    },
  },
};

// Viewport konfigurácia
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
    <html lang="sk" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* LCP Optimalizácia: Preload hero obrázka */}
        <link
          rel="preload"
          as="image"
          type="image/webp"
          href="/taxi-nearme-logo.webp"
          fetchPriority="high"
        />

        {/* Preconnect pre externe domény - zrýchľuje načítanie */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />

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
                  '@id': 'https://www.taxinearme.sk/#organization',
                  name: 'Taxi NearMe',
                  url: 'https://www.taxinearme.sk',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://www.taxinearme.sk/taxi-nearme-logo.png',
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
                  '@id': 'https://www.taxinearme.sk/#website',
                  url: 'https://www.taxinearme.sk',
                  name: 'Taxi NearMe',
                  description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku',
                  publisher: {
                    '@id': 'https://www.taxinearme.sk/#organization',
                  },
                  inLanguage: 'sk',
                },
              ],
            }),
          }}
        />

        {/*
          Google Consent Mode v2 - Analytics GRANTED by default
          Meranie beží vždy, ignoruje cookie consent
        */}
        <Script id="google-consent-mode" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Analytics povolené vždy - ignoruje cookie consent
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'granted',
              'functionality_storage': 'granted',
              'personalization_storage': 'denied',
              'security_storage': 'granted'
            });
          `}
        </Script>

        {/*
          Google Analytics (gtag.js)
          lazyOnload - načíta sa až po plnom načítaní stránky (lepší LCP)
        */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XM0ES676GB"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XM0ES676GB');
          `}
        </Script>

        {/*
          Microsoft Clarity
          Tracking script - načíta sa až keď je stránka hotová (lazyOnload pre lepší performance na mobile)
        */}
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "u5uwq9jn6t");
          `}
        </Script>
      </head>

      <body className="font-sans antialiased" suppressHydrationWarning>
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
