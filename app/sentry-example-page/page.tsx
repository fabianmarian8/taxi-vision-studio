"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
        <p className="text-gray-600 mb-6">
          Klikni na tlačidlo pre odoslanie testovacej chyby do Sentry
        </p>
        <button
          type="button"
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            throw new Error("Sentry Test Error - Frontend");
          }}
        >
          Vyhoď chybu (throw)
        </button>
        <button
          type="button"
          className="ml-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            Sentry.captureException(new Error("Sentry Test Error - Captured"));
          }}
        >
          Zachyť chybu (capture)
        </button>
      </div>
    </div>
  );
}
