'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Track404() {
  const pathname = usePathname();

  useEffect(() => {
    // Send 404 event to N8N webhook
    const track404 = async () => {
      try {
        await fetch('https://n8n.taxinearme.sk/webhook/vercel-404-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proxy: {
              statusCode: 404,
              path: pathname,
              timestamp: new Date().toISOString(),
              host: typeof window !== 'undefined' ? window.location.host : 'taxinearme.sk',
              userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
              referer: typeof document !== 'undefined' ? document.referrer : '',
            },
          }),
        });
      } catch (error) {
        // Silently fail - don't break the page if tracking fails
        console.error('404 tracking failed:', error);
      }
    };

    track404();
  }, [pathname]);

  return null;
}
