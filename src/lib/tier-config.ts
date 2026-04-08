/**
 * Tier Configuration — Centrálna definícia balíkov a feature gatingu
 *
 * Toto je JEDINÉ miesto kde sa definuje čo patrí do akého tieru.
 * Používa sa v:
 * - Inline editor (client-side gating)
 * - API save route (server-side enforcement)
 * - Dashboard (zobrazenie zamknutých funkcií)
 * - Predajná stránka (porovnanie balíkov)
 */

// Plan typy zoradené od najnižšieho po najvyšší
export type PlanTier = 'free' | 'managed' | 'partner' | 'leader';

// Mapovanie starých plan typov na nové
export function normalizePlanType(planType: string | null | undefined): PlanTier {
  switch (planType) {
    case 'mini': return 'free'; // Legacy 0.99€ = teraz free
    case 'premium': return 'managed';
    case 'partner': return 'partner';
    case 'leader': return 'leader';
    case 'free': return 'free';
    case 'managed': return 'managed';
    default: return 'free';
  }
}

// Hierarchia tierov (vyšší index = vyšší tier)
const TIER_HIERARCHY: PlanTier[] = ['free', 'managed', 'partner', 'leader'];

export function tierLevel(tier: PlanTier): number {
  return TIER_HIERARCHY.indexOf(tier);
}

export function hasAccess(userTier: PlanTier, requiredTier: PlanTier): boolean {
  return tierLevel(userTier) >= tierLevel(requiredTier);
}

// ============================================
// DEFINÍCIA POLÍ PODĽA TIERU
// ============================================

export interface FieldDefinition {
  key: string;
  label: string;
  requiredTier: PlanTier;
  group: FieldGroup;
}

export type FieldGroup =
  | 'basic'       // Základné údaje
  | 'visual'      // Vizuál a branding
  | 'services'    // Služby a tagy
  | 'contact'     // Kontaktné info (rozšírené)
  | 'gallery'     // Galéria a médiá
  | 'page'        // Vlastná stránka
  | 'advanced';   // Pokročilé funkcie

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // === FREE — základné údaje (po SMS verifikácii) ===
  { key: 'company_name',    label: 'Názov taxislužby',       requiredTier: 'free',    group: 'basic' },
  { key: 'phone',           label: 'Telefónne číslo',        requiredTier: 'free',    group: 'basic' },
  { key: 'website',         label: 'Webstránka',             requiredTier: 'free',    group: 'basic' },
  { key: 'description',     label: 'Popis taxislužby',       requiredTier: 'free',    group: 'basic' },
  { key: 'show_description', label: 'Zobraziť popis',       requiredTier: 'free',    group: 'basic' },
  { key: 'email',           label: 'Kontaktný email',        requiredTier: 'free',    group: 'basic' },

  // === MANAGED (5,99€) — vizuál, služby, kontakt ===
  { key: 'hero_title',      label: 'Nadpis profilu',         requiredTier: 'managed', group: 'visual' },
  { key: 'hero_subtitle',   label: 'Podnadpis profilu',      requiredTier: 'managed', group: 'visual' },
  { key: 'hero_image_url',  label: 'Hero obrázok',           requiredTier: 'managed', group: 'visual' },
  { key: 'hero_image_zoom', label: 'Priblíženie obrázka',    requiredTier: 'managed', group: 'visual' },
  { key: 'hero_image_pos_x', label: 'Pozícia obrázka X',    requiredTier: 'managed', group: 'visual' },
  { key: 'hero_image_pos_y', label: 'Pozícia obrázka Y',    requiredTier: 'managed', group: 'visual' },
  { key: 'services',        label: 'Služby a tagy',          requiredTier: 'managed', group: 'services' },
  { key: 'show_services',   label: 'Zobraziť služby',        requiredTier: 'managed', group: 'services' },
  { key: 'services_description', label: 'Popis služieb',     requiredTier: 'managed', group: 'services' },
  { key: 'whatsapp',        label: 'WhatsApp číslo',         requiredTier: 'managed', group: 'contact' },
  { key: 'social_facebook', label: 'Facebook',               requiredTier: 'managed', group: 'contact' },
  { key: 'social_instagram', label: 'Instagram',             requiredTier: 'managed', group: 'contact' },
  { key: 'booking_url',     label: 'Objednávkový odkaz',     requiredTier: 'managed', group: 'contact' },
  { key: 'contact_url',     label: 'Kontaktný odkaz',        requiredTier: 'managed', group: 'contact' },

  // === PARTNER (14,99€) — galéria, vlastná stránka, cenník ===
  { key: 'gallery',         label: 'Fotogaléria',            requiredTier: 'partner', group: 'gallery' },
  { key: 'template_variant', label: 'Šablóna stránky (skin)', requiredTier: 'partner', group: 'page' },
  { key: 'pricelist_url',   label: 'Cenník',                 requiredTier: 'partner', group: 'page' },
  { key: 'transport_rules_url', label: 'Prepravný poriadok', requiredTier: 'partner', group: 'page' },

  // === LEADER (24,99€+) — analytika, zvýraznenie na trasách ===
  { key: 'city_search_stats',   label: 'Štatistiky hľadaní taxi v meste',    requiredTier: 'leader', group: 'advanced' },
  { key: 'click_analytics',     label: 'Analytika kliknutí na vaše číslo',   requiredTier: 'leader', group: 'advanced' },
  { key: 'route_highlight',     label: 'Zvýraznenie na trasách do iných miest', requiredTier: 'leader', group: 'advanced' },
];

// ============================================
// HELPER FUNKCIE
// ============================================

/** Zoznam polí prístupných pre daný tier */
export function getAccessibleFields(tier: PlanTier): string[] {
  return FIELD_DEFINITIONS
    .filter(f => hasAccess(tier, f.requiredTier))
    .map(f => f.key);
}

/** Zoznam zamknutých polí pre daný tier */
export function getLockedFields(tier: PlanTier): FieldDefinition[] {
  return FIELD_DEFINITIONS.filter(f => !hasAccess(tier, f.requiredTier));
}

/** Aký tier je potrebný na odomknutie konkrétneho poľa */
export function getRequiredTier(fieldKey: string): PlanTier | null {
  const field = FIELD_DEFINITIONS.find(f => f.key === fieldKey);
  return field ? field.requiredTier : null;
}

/** Či je pole prístupné pre daný tier */
export function isFieldAccessible(fieldKey: string, tier: PlanTier): boolean {
  const requiredTier = getRequiredTier(fieldKey);
  if (!requiredTier) return true; // Neznáme pole = povolené
  return hasAccess(tier, requiredTier);
}

// ============================================
// TIER METADATA (pre UI)
// ============================================

export interface TierInfo {
  id: PlanTier;
  name: string;
  price: string;        // Zobrazovaná cena
  priceValue: number;   // Cena v EUR (pre porovnanie)
  description: string;
  badge: string;
  color: string;        // Tailwind color class
  features: string[];   // Hlavné features pre marketing
}

export const TIER_INFO: Record<PlanTier, TierInfo> = {
  free: {
    id: 'free',
    name: 'Prevzatý profil',
    price: 'Zadarmo',
    priceValue: 0,
    description: 'Prevezmite kontrolu nad profilom vašej taxislužby',
    badge: 'Overené',
    color: 'green',
    features: [
      'SMS overenie vlastníctva',
      'Úprava názvu a kontaktov',
      'Badge "Overená taxislužba"',
      'Základné štatistiky',
    ],
  },
  managed: {
    id: 'managed',
    name: 'Spravovaný profil',
    price: '5,99 €/mes',
    priceValue: 5.99,
    description: 'Kompletná správa profilu s vizuálom a službami',
    badge: 'Spravovaný',
    color: 'blue',
    features: [
      'Všetko z Free',
      'Hero obrázok a branding',
      'Služby, tagy a popis',
      'WhatsApp, sociálne siete',
      'Objednávkový odkaz',
    ],
  },
  partner: {
    id: 'partner',
    name: 'Partner',
    price: '14,99 €/mes',
    priceValue: 14.99,
    description: 'Vlastná stránka, galéria a prioritné umiestnenie',
    badge: 'Partner',
    color: 'amber',
    features: [
      'Všetko zo Spravovaného',
      'Vlastná personalizovaná stránka',
      'Fotogaléria vozidiel',
      'Cenník a prepravný poriadok',
      'Google recenzie',
      'Prioritné umiestnenie',
    ],
  },
  leader: {
    id: 'leader',
    name: 'Leader mesta',
    price: '24,99 €/mes',
    priceValue: 24.99,
    description: 'Exkluzívna pozícia #1 a dominancia vo vašom meste',
    badge: 'Leader',
    color: 'purple',
    features: [
      'Všetko z Partnera',
      'Exkluzívna pozícia #1',
      'Štatistiky hľadaní taxi vo vašom meste',
      'Analytika kliknutí na vaše číslo',
      'Zvýraznenie na trasách do iných miest',
      'Prioritná podpora',
    ],
  },
};

/** Vráť nasledujúci vyšší tier (pre upsell) */
export function getNextTier(currentTier: PlanTier): PlanTier | null {
  const idx = TIER_HIERARCHY.indexOf(currentTier);
  if (idx < 0 || idx >= TIER_HIERARCHY.length - 1) return null;
  return TIER_HIERARCHY[idx + 1];
}

/** Vráť tier info pre upsell — aký tier potrebuješ na odomknutie poľa */
export function getUpsellTier(fieldKey: string, currentTier: PlanTier): TierInfo | null {
  const requiredTier = getRequiredTier(fieldKey);
  if (!requiredTier || hasAccess(currentTier, requiredTier)) return null;
  return TIER_INFO[requiredTier];
}
