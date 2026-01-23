# Taxi Platba - Privátny platobný systém

**Dátum:** 2026-01-23
**Status:** Schválený

## Prehľad

Jednoduchá platobná stránka pre ad-hoc taxi platby. Nie je verejne prístupná cez navigáciu, len cez priamy link.

## URL

```
taxinearme.sk/taxi-platba
taxinearme.sk/taxi-platba?suma=23.50
taxinearme.sk/taxi-platba?suma=23.50&poznamka=Popis%20jazdy
```

## Používateľský flow

### Vodič (Marian)
1. Po jazde vypočíta sumu
2. Pošle zákazníkovi link (SMS/WhatsApp):
   - S predvyplnenou sumou: `/taxi-platba?suma=23.50`
   - Alebo bez: `/taxi-platba`

### Zákazník
1. Otvorí link
2. Vidí/zadá sumu
3. Voliteľne pridá poznámku
4. Klikne "Zaplatiť kartou"
5. Stripe Checkout - zadá kartu
6. Vidí potvrdenie

## Technická implementácia

### Nové súbory

```
app/taxi-platba/
├── page.tsx              # Formulár
└── success/
    └── page.tsx          # Potvrdenie

app/api/taxi-platba/
└── route.ts              # Stripe Checkout Session
```

### Stripe konfigurácia

- **Produkt ID:** `prod_TqQEeWQAlC24oD`
- **Typ platby:** Jednorazová (nie subscription)
- **Mena:** EUR
- **Min suma:** 1€
- **Max suma:** 500€

### API endpoint

`POST /api/taxi-platba`

Request:
```json
{
  "suma": 23.50,
  "poznamka": "voliteľný popis"
}
```

Response:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

## UI dizajn

### Stránka /taxi-platba

- Čistý, minimalistický dizajn
- Logo taxinearme.sk
- Nadpis: "Platba za taxi"
- Input suma: veľké, s € symbolom, predvyplnené z URL ak existuje
- Input poznámka: voliteľný, bez placeholderu
- Tlačidlo: "Zaplatiť kartou"
- Mobile-first

### Stránka /taxi-platba/success

- Zelená fajka
- "Ďakujeme za platbu!"
- "Potvrdenie príde na váš email"

### Čo stránka NEMÁ

- Navigáciu
- Pätičku
- Linky na iné stránky
- Žiadnu ochranu/autentifikáciu (nie je potrebná)

## Notifikácie

Len štandardný Stripe email - žiadne extra notifikácie.

## Bezpečnosť

- Stránka nie je linkovaná nikde na webe
- Stripe Checkout je bezpečný
- Peniaze idú priamo na účet
- Žiadne citlivé dáta na stránke
