'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCheck, X, Send, Loader2, Phone, KeyRound, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

interface ClaimProfileFlowProps {
  serviceName: string;
  servicePhone: string;
  cityName: string;
  citySlug: string;
}

type Step = 'phone' | 'code' | 'success';

function maskPhone(phone: string): string {
  // +421 901 234 567 -> +421 9XX XXX 567
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.length >= 10) {
    return cleaned.slice(0, 5) + ' XXX ' + cleaned.slice(-3);
  }
  return phone;
}

export function ClaimProfileFlow({
  serviceName,
  servicePhone,
  cityName,
  citySlug,
}: ClaimProfileFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [email, setEmail] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [loginInfo, setLoginInfo] = useState<{ email: string; password: string; loginUrl: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Odpočet pre resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetFlow = useCallback(() => {
    setIsOpen(false);
    setStep('phone');
    setError(null);
    setPhoneInput('');
    setCodeInput('');
    setEmail('');
    setPhoneLast4('');
    setLoginInfo(null);
    setCountdown(0);
  }, []);

  // Feature flag — musí byť za všetkými hooks
  if (process.env.NEXT_PUBLIC_CLAIM_ENABLED !== 'true') {
    return null;
  }

  async function handleSendOTP() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/claim/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneInput,
          profilePhone: servicePhone,
          citySlug,
          taxiServiceName: serviceName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nepodarilo sa odoslať SMS');
        return;
      }

      setPhoneLast4(data.phoneLast4);
      setStep('code');
      setCountdown(60); // 60s pred ďalším odoslaním
    } catch {
      setError('Nastala chyba. Skúste to znova.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOTP() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/claim/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneInput,
          code: codeInput,
          citySlug,
          taxiServiceName: serviceName,
          ownerEmail: email || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nepodarilo sa overiť kód');
        return;
      }

      if (data.loginInfo) {
        setLoginInfo(data.loginInfo);
      }
      setStep('success');
    } catch {
      setError('Nastala chyba. Skúste to znova.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOTP() {
    if (countdown > 0) return;
    await handleSendOTP();
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors group"
      >
        <UserCheck className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-green-700 group-hover:text-green-800">
          Ste majiteľ? Prevezmite profil zadarmo
        </span>
        <ArrowRight className="h-3 w-3 text-green-500" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {step === 'phone' && 'Prevezmite svoj profil'}
                {step === 'code' && 'Overenie telefónneho čísla'}
                {step === 'success' && 'Profil prevzatý!'}
              </h3>
              <button
                onClick={resetFlow}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Step 1: Phone verification */}
              {step === 'phone' && (
                <>
                  <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100">
                    <p className="text-sm font-semibold text-gray-900">{serviceName}</p>
                    <p className="text-sm text-gray-600">{cityName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Číslo v profile: {maskPhone(servicePhone)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Pre prevzatie profilu zadajte telefónne číslo, ktoré je uvedené v profile vašej taxislužby.
                    Pošleme vám SMS s overovacím kódom.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vaše telefónne číslo *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow"
                        placeholder="+421 9XX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Váš email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow"
                        placeholder="vas@email.sk"
                      />
                      <p className="text-xs text-gray-500 mt-1">Na tento email vám pošleme prihlasovacie údaje</p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 mt-3">{error}</p>
                  )}

                  <button
                    onClick={handleSendOTP}
                    disabled={isSubmitting || !phoneInput || !email}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-primary-yellow hover:bg-primary-yellow/90 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Odosielam SMS...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Odoslať overovací kód
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Step 2: Enter code */}
              {step === 'code' && (
                <>
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-100">
                    <p className="text-sm text-blue-800">
                      <KeyRound className="h-4 w-4 inline mr-1" />
                      SMS kód bol odoslaný na číslo končiace <strong>...{phoneLast4}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Kód je platný 10 minút</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overovací kód (6 číslic)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 mt-3">{error}</p>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={isSubmitting || codeInput.length !== 6}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-primary-yellow hover:bg-primary-yellow/90 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Overujem...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Overiť a prevziať profil
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResendOTP}
                    disabled={countdown > 0}
                    className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                  >
                    {countdown > 0
                      ? `Odoslať znova za ${countdown}s`
                      : 'Odoslať kód znova'}
                  </button>

                  <button
                    onClick={() => { setStep('phone'); setError(null); setCodeInput(''); }}
                    className="w-full mt-1 text-sm text-gray-400 hover:text-gray-600"
                  >
                    ← Zmeniť číslo
                  </button>
                </>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Profil úspešne prevzatý!
                  </h4>

                  {loginInfo ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-left mt-4 mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Vaše prihlasovacie údaje:</p>
                      <p className="text-sm text-gray-700">
                        <strong>Email:</strong> {loginInfo.email}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Heslo:</strong> {loginInfo.password}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Údaje si uložte — po zatvorení sa heslo už nezobrazí.
                        {email && ' Údaje sme vám poslali aj na email.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4">
                      Použite svoje existujúce prihlasovacie údaje.
                    </p>
                  )}

                  <a
                    href="/partner/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-yellow hover:bg-primary-yellow/90 text-gray-900 font-bold rounded-lg transition-colors"
                  >
                    Prihlásiť sa do partner portálu
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  {/* Upsell pre vyššie balíky */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">
                      S bezplatným profilom môžete upraviť základné údaje.
                      Pre viac funkcií:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-500">Fotky a galéria</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-500">Google recenzie</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-500">Vlastná stránka</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-500">Prioritné umiestnenie</span>
                      </div>
                    </div>
                    <a
                      href="/pre-taxiky"
                      className="inline-block mt-3 text-sm font-semibold text-primary-yellow hover:underline"
                    >
                      Pozrieť platené balíky →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
