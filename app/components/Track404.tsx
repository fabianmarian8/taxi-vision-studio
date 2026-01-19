'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Track404() {
  const pathname = usePathname();

  useEffect(() => {
    // Send 404 event via same-origin API route (bypasses extension blocking)
    fetch('/api/track/404', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proxy: {
          statusCode: 404,
          path: pathname,
          timestamp: new Date().toISOString(),
          host: window.location.host,
          userAgent: navigator.userAgent,
          referer: document.referrer,
        },
      }),
    }).catch(() => {
      // Silently fail
    });
  }, [pathname]);

  return null;
}
