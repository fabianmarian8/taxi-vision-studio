# SEO Opravy - Implementacny Plan

**Projekt:** TaxiNearMe.sk (taxi-vision-studio)
**Datum:** 2025-12-07
**Stav:** PRIPRAVENY NA IMPLEMENTACIU

---

## Prehlad problemov a priorit

| # | Problem | Priorita | Dopad na SEO | Zlozitost |
|---|---------|----------|--------------|-----------|
| 1 | Chyba Disallow /admin v robots.txt | VYSOKA | Kriticky | Nizka |
| 2 | Chyba /o-nas v sitemap.xml | VYSOKA | Vysoky | Nizka |
| 3 | Chyba /o-nas vo Footer navigacii | STREDNA | Stredny | Nizka |
| 4 | Service logos pouzivaju `<img>` namiesto `next/Image` | STREDNA | Stredny | Stredna |
| 5 | Crawl-delay v robots.txt je zbytocny | NIZKA | Ziadny | Nizka |
| 6 | TaxiService schema nepouziva `providerMobility` | NIZKA | Minimalny | Nizka |

---

## 1. VYSOKA PRIORITA: Disallow /admin v robots.txt

### Problem
Subor `/Users/marianfabian/taxi-vision-studio/public/robots.txt` neblokuje pristup k admin sekcii. Hoci admin moze byt chraneny autentifikaciou, crawler by nemal zbytocne skusat indexovat tieto URL.

### Aktualna verzia
```
User-agent: *
Allow: /
```

### Navrhovana zmena
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
```

### Dotknuty subor
- `/Users/marianfabian/taxi-vision-studio/public/robots.txt`

### Dopad na SEO
- **Bezpecnost:** Zabraňuje crawlerom indexovať admin stránky
- **Crawl budget:** Šetrí crawl budget pre dôležitý obsah
- **Best practice:** Štandardná bezpečnostná praktika

### Implementacia
```diff
# robots.txt for taxinearme.sk
# https://www.taxinearme.sk

User-agent: *
Allow: /
+Disallow: /admin
+Disallow: /admin/
+Disallow: /api/

# Sitemap location
Sitemap: https://www.taxinearme.sk/sitemap.xml

-# Crawl-delay (optional - be gentle with the server)
-Crawl-delay: 1
```

---

## 2. VYSOKA PRIORITA: Pridat /o-nas do sitemap.xml

### Problem
Stranka `/o-nas` existuje a ma plnu metadata konfiguraciu, ale nie je zahrnutá v sitemap.ts. To znizuje jej viditelnost pre vyhladavace.

### Dotknuty subor
- `/Users/marianfabian/taxi-vision-studio/app/sitemap.ts`

### Aktualna struktura
```typescript
// Právne stránky
const legalPages = [
  { path: '/ochrana-sukromia', priority: 0.3 },
  { path: '/cookies', priority: 0.3 },
  { path: '/podmienky-pouzivania', priority: 0.3 },
  { path: '/obchodne-podmienky', priority: 0.3 },
  { path: '/kontakt', priority: 0.5 },
  { path: '/pre-taxiky', priority: 0.6 },
];
```

### Navrhovana zmena
```typescript
// Statické stránky
const staticPages = [
  { path: '/o-nas', priority: 0.6 },           // NOVE - O nas stranka
  { path: '/ochrana-sukromia', priority: 0.3 },
  { path: '/cookies', priority: 0.3 },
  { path: '/podmienky-pouzivania', priority: 0.3 },
  { path: '/obchodne-podmienky', priority: 0.3 },
  { path: '/kontakt', priority: 0.5 },
  { path: '/pre-taxiky', priority: 0.6 },
];
```

### Dopad na SEO
- **Indexacia:** Google rychlejsie najde a indexuje stranku
- **E-E-A-T:** Stranka "O nas" posilnuje doveryhodnost webu
- **Priorita 0.6:** Vyssia priorita ako pravne stranky, nizssia ako hlavne taxi stranky

---

## 3. STREDNA PRIORITA: Pridat /o-nas do Footer navigacie

### Problem
Stranka `/o-nas` nie je dostupna z Footer navigacie, co znizuje internal linking a uzivatelsku dostupnost.

### Dotknuté subory
1. `/Users/marianfabian/taxi-vision-studio/app/page.tsx` (homepage footer - riadky 229-250)
2. `/Users/marianfabian/taxi-vision-studio/src/components/FooterLegal.tsx` (zdielany footer)

### Navrhovana zmena pre FooterLegal.tsx
```typescript
<div className="flex flex-wrap justify-center gap-8">
  {/* NOVE - pridat na zaciatok */}
  <Link
    href="/o-nas"
    className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors"
    title="O nas - Kto stojí za TaxiNearMe"
  >
    O nas
  </Link>
  <Link
    href="/ochrana-sukromia"
    ...
```

### Navrhovana zmena pre page.tsx (homepage)
```typescript
<div className="flex flex-wrap justify-center gap-3 md:gap-5">
  {/* NOVE */}
  <Link
    href="/o-nas"
    className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors duration-200"
    title="O nas - Kto stojí za TaxiNearMe"
  >
    O nas
  </Link>
  <Link
    href="/ochrana-sukromia"
    ...
```

### Dopad na SEO
- **Internal linking:** Zlepšuje PageRank flow k stránke /o-nas
- **E-E-A-T:** Uľahčuje prístup k informáciám o autorite
- **UX:** Používatelia očakávajú link "O nás" v pätičke

---

## 4. STREDNA PRIORITA: Nahradit `<img>` za `next/Image`

### Problem
Service logos používajú natívny `<img>` tag namiesto optimalizovaného `next/Image` komponentu. Toto ovplyvňuje Core Web Vitals (LCP, CLS).

### Dotknuty subor
- `/Users/marianfabian/taxi-vision-studio/app/taxi/[...slug]/page.tsx`

### Lokácie na opravu

#### A) Riadok ~499 - Logo v zozname taxislužieb
```tsx
// AKTUALNE (riadok 499-509)
<img
  src={service.logo}
  alt={`${service.name} logo`}
  className={`w-10 h-10 rounded-full object-cover ...`}
/>

// NAVRHOVANÁ ZMENA
<Image
  src={service.logo}
  alt={`${service.name} logo`}
  width={40}
  height={40}
  className={`w-10 h-10 rounded-full object-cover ...`}
  unoptimized  // Ak logo je externá URL, potrebujeme toto
/>
```

#### B) Riadok ~715 - Preview obrázok partnerskej stránky
```tsx
// AKTUALNE (riadok 715-719)
<img
  src="/images/taxi-partner-preview.png"
  alt="Ukážka partnerskej stránky"
  className="w-full h-full object-cover"
/>

// NAVRHOVANÁ ZMENA
<Image
  src="/images/taxi-partner-preview.png"
  alt="Ukážka partnerskej stránky"
  fill
  className="object-cover"
  sizes="80px"
/>
```

#### C) Riadok ~1461 - Logo na detail stránke taxislužby
```tsx
// AKTUALNE (riadok 1461-1468)
<img
  src={service.logo}
  alt={`${service.name} logo`}
  className={`flex-shrink-0 w-16 h-16 rounded-2xl object-cover ...`}
/>

// NAVRHOVANÁ ZMENA
<Image
  src={service.logo}
  alt={`${service.name} logo`}
  width={64}
  height={64}
  className={`flex-shrink-0 w-16 h-16 rounded-2xl object-cover ...`}
  unoptimized  // Pre externé URL
/>
```

### Dalsie subory na kontrolu
- `/Users/marianfabian/taxi-vision-studio/src/components/TaxiGallery.tsx` (riadky 52, 93)
- `/Users/marianfabian/taxi-vision-studio/src/components/GoogleReviewsSection.tsx` (riadok 62)

### Konfiguracia next.config.js
Ak service.logo môže byť externá URL, treba pridať domény do next.config.js:
```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      // Dalsie domeny podla potreby
    ],
  },
}
```

### Dopad na SEO
- **LCP:** Lepšie skóre Largest Contentful Paint vďaka lazy loading
- **CLS:** Placeholder zabraňuje layoutu shifts
- **Veľkosť:** Automatická optimalizácia a WebP konverzia

---

## 5. NIZKA PRIORITA: Odstranit Crawl-delay

### Problem
`Crawl-delay: 1` je ignorovaný Googlom (a väčšinou crawlerov). Je to zbytočný riadok.

### Zmena
Odstránenie je už zahrnuté v bode #1.

### Dopad na SEO
- Žiadny praktický dopad
- Čistejší robots.txt

---

## 6. NIZKA PRIORITA: Pridat providerMobility do TaxiService schema

### Problem
Schema.org TaxiService by mala obsahovať `providerMobility` property pre lepšiu kategorizáciu.

### Navrhovana zmena (ak existuje schema markup)
```json
{
  "@type": "TaxiService",
  "providerMobility": "dynamic",
  ...
}
```

### Dopad na SEO
- Minimálny dopad
- Best practice pre structured data

---

## Poradie implementacie

### Faza 1: Kriticke opravy (5 min)
1. Upravit `robots.txt` - pridať Disallow pravidlá
2. Upravit `sitemap.ts` - pridať /o-nas

### Faza 2: Internal linking (10 min)
3. Upravit `FooterLegal.tsx` - pridať link na /o-nas
4. Upravit `page.tsx` homepage footer - pridať link na /o-nas

### Faza 3: Performance optimalizacia (30 min)
5. Nahradit `<img>` za `next/Image` v `page.tsx` (taxi detail)
6. Skontrolovat next.config.js pre remote images
7. Nahradit `<img>` v TaxiGallery.tsx a GoogleReviewsSection.tsx

### Faza 4: Nice-to-have (5 min)
8. Pridat providerMobility do schema (ak existuje)

---

## Verifikacia po implementacii

### Robots.txt
```bash
curl https://www.taxinearme.sk/robots.txt
```
Overit: Disallow /admin je pritomne

### Sitemap
```bash
curl https://www.taxinearme.sk/sitemap.xml | grep "o-nas"
```
Overit: /o-nas je v sitemap

### Internal linking
- Navstivit homepage, skontrolovat footer obsahuje "O nas"
- Navstivit lubovolnu stranku s FooterLegal, skontrolovat footer

### Core Web Vitals
- Spustit Lighthouse na /taxi/bratislava
- Porovnat LCP pred a po zmene `<img>` -> `next/Image`

---

## Odhadovany cas implementacie

| Faza | Cas |
|------|-----|
| Faza 1 | 5 min |
| Faza 2 | 10 min |
| Faza 3 | 30 min |
| Faza 4 | 5 min |
| **SPOLU** | **50 min** |

---

## Poznamky pre developera

1. **Testovat lokalne** pred deployom - `npm run build` a `npm run start`
2. **Commitovat po fazach** - jednoduchsie rollback ak nieco nefunguje
3. **Po deployi** odoslat sitemap na reindex cez Google Search Console
4. **Monitorovat** Core Web Vitals 24-48 hodin po deployi

---

*Plan vytvoreny: 2025-12-07*
*Autor: Claude Code*
