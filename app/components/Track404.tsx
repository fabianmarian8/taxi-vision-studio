'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Track404() {
  const pathname = usePathname();

  useEffect(() => {
    // Send 404 event to N8N webhook
    // Using sendBeacon as it's less likely to be blocked by browser extensions
    const track404 = () => {
      const data = JSON.stringify({
        proxy: {
          statusCode: 404,
          path: pathname,
          timestamp: new Date().toISOString(),
          host: typeof window !== 'undefined' ? window.location.host : 'taxinearme.sk',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          referer: typeof document !== 'undefined' ? document.referrer : '',
        },
      });

      // Try sendBeacon first (less likely to be blocked by extensions)
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        const sent = navigator.sendBeacon('https://n8n.taxinearme.sk/webhook/vercel-404-logs', blob);
        if (sent) return;
      }

      // Fallback to fetch if sendBeacon fails or is not available
      fetch('https://n8n.taxinearme.sk/webhook/vercel-404-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't break the page if tracking fails
      });
    };

    track404();
  }, [pathname]);

  return null;
}
