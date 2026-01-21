'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="sk">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Niečo sa pokazilo
            </h1>
            <p className="text-gray-600 mb-6">
              Ospravedlňujeme sa za problémy. Skúste to prosím znova.
            </p>
            <button
              onClick={reset}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Skúsiť znova
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
