# Command Center Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prestavať partner dashboard z "prechodovej stránky" na Command Center cockpit s jasnou hierarchiou: identita → akcie → panely → zoznam služieb.

**Architecture:** Existujúce dáta a server-side logika v `app/partner/page.tsx` zostávajú. Vytvárame nové client komponenty, presúvame JSX z page.tsx do nich, a zlučujeme TierStatusBanner + UpgradePlanCard do jedného panelu. Žiadne nové DB tabuľky, API routes ani routing.

**Tech Stack:** Next.js 15, React Server Components, Tailwind CSS, Lucide icons, existujúce tier-config.ts

---

### Task 1: ServiceIdentityStrip

Najväčší vizuálny dopad — nahradí generický "Partner Portal" header.

**Files:**
- Create: `src/components/dashboard/ServiceIdentityStrip.tsx`

**Step 1: Vytvoriť komponent**

```tsx
// src/components/dashboard/ServiceIdentityStrip.tsx
'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, CreditCard, Clock } from 'lucide-react';
import { normalizePlanType, TIER_INFO, type PlanTier } from '@/lib/tier-config';

interface ServiceIdentityStripProps {
  serviceName: string;
  citySlug: string;
  cityName: string;
  partnerSlug: string;
  planType: string | null | undefined;
  draftStatus: string | null; // 'draft' | 'approved' | 'rejected' | null
  lastUpdated: string | null;
  profileHealth: {
    hasPhone: boolean;
    hasDescription: boolean;
    hasHeroImage: boolean;
    hasGallery: boolean;
    completedFields: number;
    totalFields: number;
  };
}

const PLAN_COLORS: Record<PlanTier, { badge: string; accent: string }> = {
  free: { badge: 'bg-green-100 text-green-700', accent: 'border-green-200' },
  managed: { badge: 'bg-blue-100 text-blue-700', accent: 'border-blue-200' },
  partner: { badge: 'bg-amber-100 text-amber-700', accent: 'border-amber-200' },
  leader: { badge: 'bg-purple-100 text-purple-700', accent: 'border-purple-200' },
};

export function ServiceIdentityStrip({
  serviceName, citySlug, cityName, partnerSlug, planType,
  draftStatus, lastUpdated, profileHealth,
}: ServiceIdentityStripProps) {
  const tier = normalizePlanType(planType);
  const tierInfo = TIER_INFO[tier];
  const colors = PLAN_COLORS[tier];
  const completeness = Math.round((profileHealth.completedFields / profileHealth.totalFields) * 100);

  const isLive = draftStatus === 'approved';
  const hasDraft = draftStatus === 'draft';

  return (
    <div className={`bg-white rounded-xl border ${colors.accent} shadow-sm p-5 md:p-6 mb-6`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Ľavá strana — identita */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 truncate">
            {serviceName}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm text-gray-500">{cityName}</span>
            <span className="text-gray-300">•</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
              {tierInfo.name}
            </span>
            <span className="text-gray-300">•</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isLive ? 'bg-green-100 text-green-700' :
              hasDraft ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {isLive ? 'Live' : hasDraft ? 'Rozpracované' : 'Draft'}
            </span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              Posledná zmena: {new Date(lastUpdated).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Pravá strana — health + CTA */}
        <div className="flex flex-col items-end gap-3">
          {/* Health summary */}
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">
              Profil {completeness}%
            </div>
            <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-1">
              <div
                className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/partner/edit/${partnerSlug}`}
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Upraviť profil
            </Link>
            <Link
              href={`/taxi/${citySlug}/${partnerSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live stránka
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Build check**

Run: `npx next build 2>&1 | grep -E "error|Error|✓ Compiled" | head -3`
Expected: `✓ Compiled successfully`

**Step 3: Commit**

```
git add src/components/dashboard/ServiceIdentityStrip.tsx
git commit -m "feat: add ServiceIdentityStrip component for Command Center dashboard"
```

---

### Task 2: ServiceStatusCard

Extrahovať inline JSX kariet z page.tsx do samostatného komponentu.

**Files:**
- Create: `src/components/dashboard/ServiceStatusCard.tsx`

**Step 1: Vytvoriť komponent**

Extrahuje logiku z `app/partner/page.tsx:498-584` (partner karty) do reusable komponentu.

Props:
- `partner: { id, name, slug, city_slug, partner_drafts }`
- `subscription: { stripe_customer_id, status, plan_type } | null`

Obsah:
- Názov + mesto
- Plan badge + status badge (Live / Draft / Needs Attention / Rejected)
- Krátka status veta ("Profil živý a aktuálny" / "Máte nepublikované zmeny" / "Vyžaduje doplniť údaje")
- Posledná zmena
- CTA: Upraviť, Zobraziť live
- Predplatné link (ak subscription existuje)

**Step 2: Build check + Commit**

---

### Task 3: PlanAndUnlocksPanel

Zlúčiť `TierStatusBanner` + `UpgradePlanCard` do jedného kompaktného panelu.

**Files:**
- Create: `src/components/dashboard/PlanAndUnlocksPanel.tsx`
- Modify: `app/partner/page.tsx` — nahradiť oba komponenty jedným

**Step 1: Vytvoriť komponent**

Panel odpovedá na otázku: "Čo mám a čo mi chýba?"

Obsah:
- Aktuálny balík veľkým názvom
- Odomknuté/celkové funkcie (X/Y)
- 2-3 najdôležitejšie zamknuté veci z next tieru
- CTA: "Porovnať balíky" alebo "Spravovať predplatné"
- Bez route previews (presunúť do RecommendedActions ak treba)

Vizuál: kompaktná karta rovnakej výšky ako ProfileStatusPanel a PerformancePanel.

**Step 2: Build check + Commit**

---

### Task 4: PerformancePanel

Refaktor `PartnerAnalytics` na kompaktnejší panel pre 3-column grid.

**Files:**
- Create: `src/components/dashboard/PerformancePanel.tsx`

**Step 1: Vytvoriť wrapper/adaptér**

Buď wrappuje existujúci `PartnerAnalytics` s upraveným layoutom, alebo vytvorí novú kompaktnú verziu. Kľúčový rozdiel: musí mať rovnakú výšku ako ostatné 2 panely.

Pre non-Leader: kompaktný locked stav bez veľkého blur overlay — len ikona, text a CTA.
Pre Leader: 3 KPI čísla + mini graf.

**Step 2: Build check + Commit**

---

### Task 5: ProfileStatusPanel

**Files:**
- Create: `src/components/dashboard/ProfileStatusPanel.tsx`

**Step 1: Vytvoriť komponent**

Panel odpovedá na otázku: "Je môj profil v poriadku?"

Obsah:
- Status publikácie: Live / Rozpracované / Čaká na schválenie
- Completeness: percentuálny progress bar
- Mini checklist (4 body):
  - ✅/❌ Kontakty vyplnené
  - ✅/❌ Popis doplnený
  - ✅/❌ Hero obrázok
  - ✅/❌ Galéria (ak tier dovoľuje)
- CTA: Otvoriť editor

**Step 2: Build check + Commit**

---

### Task 6: Rewire page.tsx — Command Center layout

Hlavná zmena — prestaviť page.tsx na nový layout.

**Files:**
- Modify: `app/partner/page.tsx`

**Step 1: Nahradiť header + obsah**

Nový layout:
```
1. Header (zjednodušený — len account actions vpravo)
2. ServiceIdentityStrip (ak partners.length > 0)
3. RecommendedActionsBar (voliteľne — Fáza C, preskočiť ak nie je čas)
4. 3-column grid: ProfileStatusPanel | PerformancePanel | PlanAndUnlocksPanel
5. "Moje taxislužby" — grid ServiceStatusCard
6. SuperadminPartnerList (ak superadmin)
```

Odstrániť:
- Inline free banner (riadky 350-383)
- Samostatný PartnerAnalytics volanie
- Samostatný UpgradePlanCard volanie
- Samostatný TierStatusBanner volanie
- Inline partner karty JSX

Nahradiť novými komponentmi.

**Step 2: Pripraviť profileHealth dáta**

V server componente page.tsx vypočítať `profileHealth` z approved draft dát:
```ts
const profileHealth = {
  hasPhone: !!latestDraft?.phone,
  hasDescription: !!latestDraft?.description,
  hasHeroImage: !!latestDraft?.hero_image_url,
  hasGallery: (latestDraft?.gallery as string[] || []).length > 0,
  completedFields: [phone, description, heroImage, gallery, ...].filter(Boolean).length,
  totalFields: tierAccessibleFieldCount,
};
```

**Step 3: Build check + full test**

Run: `npx next build && npm test`

**Step 4: Commit**

```
git commit -m "feat: rewire partner dashboard to Command Center layout"
```

---

### Task 7 (voliteľné): RecommendedActionsBar

**Files:**
- Create: `src/components/dashboard/RecommendedActionsBar.tsx`

Tenký pás pod identity stripom. Max 3 akcie:
- "Publikujte rozpracované zmeny" (ak draft status = 'draft')
- "Doplňte hero obrázok" (ak chýba a tier dovoľuje)
- "Odomknite galériu v Partner balíku" (ak tier < partner)

Ak nie je čo riešiť, komponent sa nerenderuje.

**Implementovať len ak zostane čas.**

---

## Poradie implementácie

| # | Komponent | Závislosť | Priorita |
|---|-----------|-----------|----------|
| 1 | ServiceIdentityStrip | žiadna | Must |
| 2 | ServiceStatusCard | žiadna | Must |
| 3 | PlanAndUnlocksPanel | žiadna | Must |
| 4 | PerformancePanel | žiadna | Must |
| 5 | ProfileStatusPanel | žiadna | Must |
| 6 | Rewire page.tsx | 1-5 | Must |
| 7 | RecommendedActionsBar | 6 | Nice-to-have |

## Pravidlá

- Žiadne nové DB tabuľky
- Žiadne nové API routes
- Žiadny redesign editora
- Purple zostáva brand farba
- Mobile-first responsive
- Každý komponent commitnúť samostatne
