'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function Track404() {
  const pathname = usePathname();
  const hasSentRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate sends (React StrictMode calls useEffect twice in dev)
    if (hasSentRef.current) return;

    const controller = new AbortController();

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
          referer: document.referrer || '',
        },
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          console.warn('[Track404] Failed to send tracking event:', response.status);
        }
      })
      .catch((error) => {
        // Ignore abort errors (component unmounted)
        if (error instanceof Error && error.name === 'AbortError') return;
        // Silently fail for other errors
      });

    hasSentRef.current = true;

    // Cleanup: abort fetch if component unmounts
    return () => {
      controller.abort();
    };
  }, [pathname]);

  return null;
}
