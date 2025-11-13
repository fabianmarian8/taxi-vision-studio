// Cookie Management Utility
// GDPR compliant cookie management system

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsent {
  preferences: CookiePreferences;
  timestamp: string;
  version: string; // pre tracking zmien v cookie policy
}

const CONSENT_KEY = 'cookieConsent';
const CONSENT_VERSION = '1.0';

/**
 * Získa uložený cookie consent z localStorage
 */
export const getCookieConsent = (): CookieConsent | null => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

/**
 * Uloží cookie consent do localStorage
 */
export const saveCookieConsent = (preferences: CookiePreferences): void => {
  const consent: CookieConsent = {
    preferences,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    
    // Spusti callback funkcie pre aktiváciu/deaktiváciu služieb
    applyConsent(preferences);
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
};

/**
 * Kontrola či existuje platný consent
 */
export const hasValidConsent = (): boolean => {
  const consent = getCookieConsent();
  if (!consent) return false;
  
  // Kontrola či je consent v platnej verzii
  if (consent.version !== CONSENT_VERSION) {
    // Vymaž starý consent
    clearCookieConsent();
    return false;
  }
  
  // Optional: Kontrola expirárcie (napríklad po 6 mesiacoch)
  const consentDate = new Date(consent.timestamp);
  const monthsOld = (Date.now() - consentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthsOld > 6) {
    clearCookieConsent();
    return false;
  }
  
  return true;
};

/**
 * Vymaže cookie consent
 */
export const clearCookieConsent = (): void => {
  localStorage.removeItem(CONSENT_KEY);
};

/**
 * Aplikuje consent nastavenia na externe služby
 */
const applyConsent = (preferences: CookiePreferences): void => {
  // Google Analytics
  if (preferences.analytics) {
    enableGoogleAnalytics();
  } else {
    disableGoogleAnalytics();
  }
  
  // Facebook Pixel
  if (preferences.marketing) {
    enableFacebookPixel();
  } else {
    disableFacebookPixel();
  }
  
  // Ďalšie služby...
};

/**
 * Google Analytics aktivácia
 */
const enableGoogleAnalytics = (): void => {
  // Príklad integrácie s Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
    console.log('✅ Google Analytics enabled');
  }
};

/**
 * Google Analytics deaktivácia
 */
const disableGoogleAnalytics = (): void => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
    console.log('❌ Google Analytics disabled');
  }
};

/**
 * Facebook Pixel aktivácia
 */
const enableFacebookPixel = (): void => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('consent', 'grant');
    console.log('✅ Facebook Pixel enabled');
  }
};

/**
 * Facebook Pixel deaktivácia
 */
const disableFacebookPixel = (): void => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('consent', 'revoke');
    console.log('❌ Facebook Pixel disabled');
  }
};

/**
 * Helper funkcia - kontrola či je konkrétny typ cookie povolený
 */
export const isCookieTypeEnabled = (type: keyof CookiePreferences): boolean => {
  const consent = getCookieConsent();
  if (!consent) return type === 'necessary'; // Necessary sú vždy povolené
  return consent.preferences[type];
};

/**
 * Otvor cookie nastavenia znova (pre tlačidlo v pätičke)
 */
export const reopenCookieSettings = (): void => {
  clearCookieConsent();
  // Trigger reload alebo event pre zobrazenie banneru
  window.dispatchEvent(new Event('cookieSettingsRequested'));
};

/**
 * Export cookie preferencií ako JSON (pre audit)
 */
export const exportCookiePreferences = (): string => {
  const consent = getCookieConsent();
  return JSON.stringify(consent, null, 2);
};
