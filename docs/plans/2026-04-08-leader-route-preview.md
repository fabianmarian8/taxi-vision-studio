# Leader Route Preview — Personalizovaná ukážka zvýraznenia na trasách

**Goal:** Na predajnej stránke a v dashboarde zobraziť personalizovanú ukážku pre Leader balík — reálne trasy z mesta majiteľa kde by sa jeho číslo zobrazovalo ako hlavná taxislužba.

**Príklad:** Pre taxislužbu zo Žiliny zobraziť:
- "Žilina → Bratislava" (hlavná trasa)
- "Žilina → Martin" 
- "Žilina → Banská Bystrica"
s vizuálom ako by vyzeralo zvýraznenie jeho taxislužby na stránke trasy.

## Implementácia

### Dátový zdroj
- `src/data/route-pages.json` obsahuje všetky definované trasy s origin/destination
- Filtrovať trasy kde `origin` alebo `destination` matchuje mesto partnera
- Fallback: ak nemá trasy, vygenerovať top 3 najbližšie mestá s taxi

### Komponenty
1. `RoutePreviewCard.tsx` — vizuálna ukážka jednej trasy so zvýraznenou taxislužbou
2. Integrácia v `ServiceCheckout.tsx` — pri Leader balíku zobraziť "Takto by to vyzeralo pre vaše mesto"
3. Integrácia v `TierStatusBanner.tsx` — pri Leader zamknutých funkciách zobraziť preview
4. Integrácia na `/pre-taxiky` — dynamická sekcia s mestom z URL parametra

### UX
- Ukážka musí byť vizuálne atraktívna — mockup stránky trasy s ich logom/menom zvýrazneným
- CTA: "Vaše číslo by videlo X ľudí mesačne na tejto trase" (ak máme click data)
