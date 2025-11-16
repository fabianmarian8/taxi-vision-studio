'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3 } from 'lucide-react';
import {
  CookiePreferences,
  hasValidConsent,
  saveCookieConsent
} from './cookieManager';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // vždy povolené
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Kontrola či už užívateľ dal súhlas
    if (!hasValidConsent()) {
      // Zobraz banner po 1 sekunde (aby to nebolo hneď agresívne)
      setTimeout(() => setIsVisible(true), 1000);
    }

    // Listener pre znovu otvorenie nastavení
    const handleReopenSettings = () => {
      setIsVisible(true);
      setShowDetails(false);
    };

    window.addEventListener('cookieSettingsRequested', handleReopenSettings);
    return () => {
      window.removeEventListener('cookieSettingsRequested', handleReopenSettings);
    };
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    savePreferences(onlyNecessary);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    saveCookieConsent(prefs); // Používame cookieManager funkciu
    setIsVisible(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // necessary nemôžu byť vypnuté
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={() => !showDetails && setIsVisible(false)}
      />
      
      {/* Cookie Banner */}
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-slide-up border-2 md:border-4 border-black/20">
        
        {/* Čierne kockované pozadie (taxameter style) */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #000 0px,
              #000 20px,
              transparent 20px,
              transparent 40px
            )`
          }} />
        </div>

        {/* Close button */}
        <button
          onClick={handleRejectAll}
          className="absolute top-2 right-2 md:top-4 md:right-4 p-1.5 md:p-2 hover:bg-black/10 rounded-full transition-colors z-10"
          aria-label="Zavrieť"
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-black" />
        </button>

        <div className="relative p-4 md:p-8">
          {/* Header s Cookie postavičkou */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 mb-4 md:mb-6">
            {/* Cookie Character - použije sa prvý obrázok */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-32 md:h-32 relative animate-bounce-slow">
                <img
                  src="/cookie-character-1.png"
                  alt="Cookie maskot"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-2 md:mb-3">
                <Cookie className="w-5 h-5 md:w-8 md:h-8 text-black" />
                <h2 className="text-xl md:text-3xl font-bold text-black">
                  Ahoj! 🍪 Potrebujeme Tvoj Súhlas
                </h2>
              </div>

              <p className="text-black/80 text-sm md:text-lg leading-relaxed">
                Používame cookies aby sme ti mohli poskytnúť najlepšiu možnú skúsenosť na našom webe.
                Pomáhajú nám pochopiť ako používaš náš web a zlepšovať naše služby.
              </p>
            </div>
          </div>

          {/* Detailné nastavenia */}
          {showDetails && (
            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 bg-black/10 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h3 className="font-bold text-black text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 md:w-6 md:h-6" />
                Nastavenia Cookies
              </h3>

              {/* Nevyhnutné cookies */}
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/30 rounded-lg md:rounded-xl">
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 accent-black"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-black text-sm md:text-base mb-1">Nevyhnutné Cookies (Vždy aktívne)</h4>
                  <p className="text-black/70 text-xs md:text-sm">
                    Tieto cookies sú nevyhnutné pre základné funkcie webu.
                    Bez nich by web nefungoval správne.
                  </p>
                </div>
              </div>

              {/* Funkčné cookies */}
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/20 rounded-lg md:rounded-xl hover:bg-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={() => togglePreference('functional')}
                  className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 accent-black cursor-pointer"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-black text-sm md:text-base mb-1">Funkčné Cookies</h4>
                  <p className="text-black/70 text-xs md:text-sm">
                    Umožňujú pokročilé funkcie ako je zapamätanie si tvojich preferencií
                    a nastavení.
                  </p>
                </div>
              </div>

              {/* Analytické cookies */}
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/20 rounded-lg md:rounded-xl hover:bg-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 accent-black cursor-pointer"
                />
                <div className="flex-1 flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-black text-sm md:text-base mb-1 flex items-center gap-2">
                      Analytické Cookies
                      <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                    </h4>
                    <p className="text-black/70 text-xs md:text-sm">
                      Pomáhajú nám pochopiť ako návštevníci používajú web.
                      Zbierame anonymné štatistiky.
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketingové cookies */}
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-white/20 rounded-lg md:rounded-xl hover:bg-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => togglePreference('marketing')}
                  className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 accent-black cursor-pointer"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-black text-sm md:text-base mb-1">Marketingové Cookies</h4>
                  <p className="text-black/70 text-xs md:text-sm">
                    Používajú sa na zobrazovanie relevantných reklám a meranie
                    efektivity reklamných kampaní.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={handleAcceptAll}
              className="flex-1 min-w-[140px] md:min-w-[200px] px-4 md:px-6 py-3 md:py-4 bg-black text-yellow-400 font-bold rounded-lg md:rounded-xl
                       hover:bg-black/90 transition-all shadow-lg hover:shadow-xl
                       hover:scale-105 active:scale-95 text-sm md:text-lg"
            >
              ✅ Prijať Všetko
            </button>

            {showDetails ? (
              <button
                onClick={handleAcceptSelected}
                className="flex-1 min-w-[140px] md:min-w-[200px] px-4 md:px-6 py-3 md:py-4 bg-white/90 text-black font-bold rounded-lg md:rounded-xl
                         hover:bg-white transition-all shadow-lg hover:shadow-xl
                         hover:scale-105 active:scale-95 text-sm md:text-lg"
              >
                💾 Uložiť Výber
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 min-w-[140px] md:min-w-[200px] px-4 md:px-6 py-3 md:py-4 bg-white/90 text-black font-bold rounded-lg md:rounded-xl
                         hover:bg-white transition-all shadow-lg hover:shadow-xl
                         hover:scale-105 active:scale-95 text-sm md:text-lg"
              >
                ⚙️ Prispôsobiť
              </button>
            )}

            <button
              onClick={handleRejectAll}
              className="w-full md:w-auto px-4 md:px-6 py-2 md:py-4 text-black font-semibold hover:text-black/70
                       transition-colors underline text-sm md:text-lg"
            >
              Odmietnuť Všetko
            </button>
          </div>

          {/* Footer info */}
          <p className="mt-4 md:mt-6 text-black/60 text-xs md:text-sm text-center">
            Viac informácií o cookies nájdeš v našich{' '}
            <a href="/ochrana-sukromia" className="underline hover:text-black">
              zásadách ochrany osobných údajov
            </a>
          </p>
        </div>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
