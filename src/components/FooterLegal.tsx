'use client';

import Link from 'next/link';
import { reopenCookieSettings } from './cookie-banner/cookieManager';

export const FooterLegal = () => {
  return (
    <footer className="border-t-4 border-foreground py-12 px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-foreground font-bold">
            © 2024 Taxi NearMe. Všetky práva vyhradené.
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <Link
              href="/ochrana-sukromia"
              className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Ochrana súkromia
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/podmienky-pouzivania"
              className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Podmienky používania
            </Link>
            <Link
              href="/kontakt"
              className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
            >
              Kontakt
            </Link>
            <button
              onClick={reopenCookieSettings}
              className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors cursor-pointer"
            >
              Nastavenia cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
