import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3 } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

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
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Zobraz banner po 1 sekunde (aby to nebolo hneď agresívne)
      setTimeout(() => setIsVisible(true), 1000);
    }
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
    localStorage.setItem('cookieConsent', JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);

    // Tu môžeš pridať logiku na aktiváciu/deaktiváciu cookies
    // Napríklad Google Analytics:
    if (prefs.analytics) {
      // Aktivuj analytics
      console.log('Analytics enabled');
    } else {
      // Deaktivuj analytics
      console.log('Analytics disabled');
    }
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
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-slide-up border-4 border-black/20">
        
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
          className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-full transition-colors z-10"
          aria-label="Zavrieť"
        >
          <X className="w-6 h-6 text-black" />
        </button>

        <div className="relative p-8">
          {/* Header s Cookie postavičkou */}
          <div className="flex items-start gap-6 mb-6">
            {/* Cookie Character - použije sa prvý obrázok */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 relative animate-bounce-slow">
                <img 
                  src="/cookie-character-1.png" 
                  alt="Cookie maskot"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Cookie className="w-8 h-8 text-black" />
                <h2 className="text-3xl font-bold text-black">
                  Ahoj! 🍪 Potrebujeme Tvoj Súhlas
                </h2>
              </div>
              
              <p className="text-black/80 text-lg leading-relaxed">
                Používame cookies aby sme ti mohli poskytnúť najlepšiu možnú skúsenosť na našom webe. 
                Pomáhajú nám pochopiť ako používaš náš web a zlepšovať naše služby.
              </p>
            </div>
          </div>

          {/* Detailné nastavenia */}
          {showDetails && (
            <div className="space-y-4 mb-6 bg-black/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="font-bold text-black text-xl mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Nastavenia Cookies
              </h3>

              {/* Nevyhnutné cookies */}
              <div className="flex items-start gap-4 p-4 bg-white/30 rounded-xl">
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="mt-1 w-5 h-5 accent-black"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-black mb-1">Nevyhnutné Cookies (Vždy aktívne)</h4>
                  <p className="text-black/70 text-sm">
                    Tieto cookies sú nevyhnutné pre základné funkcie webu. 
                    Bez nich by web nefungoval správne.
                  </p>
                </div>
              </div>

              {/* Funkčné cookies */}
              <div className="flex items-start gap-4 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={() => togglePreference('functional')}
                  className="mt-1 w-5 h-5 accent-black cursor-pointer"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-black mb-1">Funkčné Cookies</h4>
                  <p className="text-black/70 text-sm">
                    Umožňujú pokročilé funkcie ako je zapamätanie si tvojich preferencií 
                    a nastavení.
                  </p>
                </div>
              </div>

              {/* Analytické cookies */}
              <div className="flex items-start gap-4 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="mt-1 w-5 h-5 accent-black cursor-pointer"
                />
                <div className="flex-1 flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-black mb-1 flex items-center gap-2">
                      Analytické Cookies
                      <BarChart3 className="w-4 h-4" />
                    </h4>
                    <p className="text-black/70 text-sm">
                      Pomáhajú nám pochopiť ako návštevníci používajú web. 
                      Zbierame anonymné štatistiky.
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketingové cookies */}
              <div className="flex items-start gap-4 p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => togglePreference('marketing')}
                  className="mt-1 w-5 h-5 accent-black cursor-pointer"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-black mb-1">Marketingové Cookies</h4>
                  <p className="text-black/70 text-sm">
                    Používajú sa na zobrazovanie relevantných reklám a meranie 
                    efektivity reklamných kampaní.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAcceptAll}
              className="flex-1 min-w-[200px] px-6 py-4 bg-black text-yellow-400 font-bold rounded-xl 
                       hover:bg-black/90 transition-all shadow-lg hover:shadow-xl 
                       hover:scale-105 active:scale-95 text-lg"
            >
              ✅ Prijať Všetko
            </button>

            {showDetails ? (
              <button
                onClick={handleAcceptSelected}
                className="flex-1 min-w-[200px] px-6 py-4 bg-white/90 text-black font-bold rounded-xl 
                         hover:bg-white transition-all shadow-lg hover:shadow-xl 
                         hover:scale-105 active:scale-95 text-lg"
              >
                💾 Uložiť Výber
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 min-w-[200px] px-6 py-4 bg-white/90 text-black font-bold rounded-xl 
                         hover:bg-white transition-all shadow-lg hover:shadow-xl 
                         hover:scale-105 active:scale-95 text-lg"
              >
                ⚙️ Prispôsobiť
              </button>
            )}

            <button
              onClick={handleRejectAll}
              className="px-6 py-4 text-black font-semibold hover:text-black/70 
                       transition-colors underline text-lg"
            >
              Odmietnuť Všetko
            </button>
          </div>

          {/* Footer info */}
          <p className="mt-6 text-black/60 text-sm text-center">
            Viac informácií o cookies nájdeš v našich{' '}
            <a href="/privacy-policy" className="underline hover:text-black">
              zásadách ochrany osobných údajov
            </a>
          </p>
        </div>

        {/* Dekoratívne cookie obrázky v rohu */}
        <div className="absolute bottom-4 right-4 w-24 h-24 opacity-30 pointer-events-none">
          <img 
            src="/cookie-taxi.png" 
            alt=""
            className="w-full h-full object-contain"
          />
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
