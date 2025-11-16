/**
 * Next.js Configuration
 *
 * Migrácia z vite.config.ts a vercel.json
 *
 * Obsahuje:
 * - Security headers (z vercel.json)
 * - Image optimization
 * - TypeScript path aliases (automaticky z tsconfig.json)
 * - Experimental features pre budúce rozšírenia (Stripe, VIP)
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // TypeScript strict mode
  typescript: {
    // Počas buildu skontrolovať TypeScript errors
    ignoreBuildErrors: false,
  },

  // ESLint počas buildu
  eslint: {
    // Počas buildu spustiť ESLint
    ignoreDuringBuilds: false,
  },

  // Image optimization
  images: {
    // Povolené domény pre Next.js Image komponent
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Všetky HTTPS domény (pre externé obrázky)
      },
    ],
    // Image formats
    formats: ['image/avif', 'image/webp'],
  },

  // Security Headers (migrované z vercel.json lines 9-38)
  async headers() {
    return [
      {
        // Aplikuj headers na všetky routes
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.clarity.ms https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.clarity.ms https://www.google-analytics.com https://nominatim.openstreetmap.org; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://formsubmit.co;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=(), payment=()',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // Server Actions - pripravené pre Stripe platby
    serverActions: {
      allowedOrigins: ['localhost:3000', 'taxinearme.sk', 'www.taxinearme.sk'],
      bodySizeLimit: '2mb',
    },
  },

  // Output (pre Vercel deployment)
  output: 'standalone', // Optimalizovaný pre Vercel

  // Redirects (ak potrebné)
  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true,
  //     },
  //   ];
  // },

  // Rewrites (ak potrebné pre API routes)
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: '/api/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;
