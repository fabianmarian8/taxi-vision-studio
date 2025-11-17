# Nastavenie Resend pre emailový formulár

## Čo je Resend?

Resend je profesionálna emailová API služba, ktorú používame pre kontaktný formulár "Niečo tu chýba?" na Taxi NearMe.

**Výhody Resend:**
- ✅ 100 emailov/deň zadarmo (3000/mesiac)
- ✅ Profesionálna doručiteľnosť
- ✅ Jednoduché API
- ✅ Bez potreby verifikácie pre každé nasadenie
- ✅ Podpora vlastných domén

## Kroky pre nastavenie

### 1. Vytvorenie Resend účtu

1. Choď na [resend.com](https://resend.com)
2. Zaregistruj sa (je to zadarmo)
3. Potvrď emailovú adresu

### 2. Získanie API kľúča

1. Po prihlásení choď na [API Keys](https://resend.com/api-keys)
2. Klikni na **"Create API Key"**
3. Pomenuj ho napr. `Taxi NearMe Production`
4. Vyber oprávnenia: **"Sending access"** (default)
5. Klikni **"Create"**
6. **DÔLEŽITÉ:** Skopíruj API kľúč okamžite! Začína `re_...`
7. Ulož ho niekde bezpečne (napr. do password managera)

### 3. Pridanie verifikovanej emailovej adresy (DÔLEŽITÉ pre Free Tier)

**V Free Tier Resend môžeš posielať emaily iba na verifikované adresy!**

1. Choď na [Resend Audience](https://resend.com/audiences)
2. Klikni **"Add Email"**
3. Zadaj `info@taxinearme.sk`
4. Resend pošle verifikačný email na túto adresu
5. Otvor email a klikni na verifikačný link
6. Po verifikácii bude možné na túto adresu posielať emaily

**Poznámka:** Ak neverifikuješ `info@taxinearme.sk`, formulár bude vracať chybu "Unable to fetch data".

### 4. Konfigurácia vo Vercel

1. Choď do Vercel Dashboard
2. Vyber projekt `taxi-vision-studio`
3. Choď do **Settings → Environment Variables**
4. Pridaj novú premennú:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_...` (tvoj API kľúč z kroku 2)
   - **Environments:** Zaškrtni všetky:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
5. Klikni **"Save"**

### 5. Opätovné nasadenie (Redeploy)

Po pridaní environment variable je potrebné projekt znova nasadiť:

1. Choď do **Deployments**
2. Klikni na posledný deployment
3. Klikni na tri bodky (⋯) → **"Redeploy"**
4. Potvrď akciou **"Redeploy"**

### 6. Testovanie

1. Choď na [taxinearme.sk](https://taxinearme.sk)
2. Klikni na tlačidlo **"Niečo tu chýba?"**
3. Vyplň formulár
4. Odošli
5. Skontroluj, či email prišiel na `info@taxinearme.sk`

## Pokročilé nastavenie (voliteľné)

### Nastavenie vlastnej domény

Momentálne emaily chodia z adresy `noreply@taxinearme.sk`, ale používajú Resend infraštruktúru.

Pre profesionálnejší prístup môžeš nastaviť vlastnú doménu:

1. V Resend Dashboard choď na [Domains](https://resend.com/domains)
2. Klikni **"Add Domain"**
3. Zadaj `taxinearme.sk`
4. Resend ti poskytne DNS záznamy (SPF, DKIM, DMARC)
5. Pridaj tieto záznamy do DNS nastavení domény (napr. na Namecheap, GoDaddy, Cloudflare)
6. Počkaj na verifikáciu (zvyčajne pár minút až hodín)
7. Po verifikácii emaily budú chodiť z plne verifikovanej domény

**Výhody vlastnej domény:**
- ✅ Lepšia doručiteľnosť (menšia šanca skončiť v spame)
- ✅ Profesionálnejší vzhľad
- ✅ Možnosť sledovať reputáciu domény
- ✅ Kontrola nad DMARC políciami

### Monitorovanie emailov

Všetky odoslané emaily môžeš sledovať na:
[https://resend.com/emails](https://resend.com/emails)

Tu uvidíš:
- ✅ Všetky odoslané emaily
- ✅ Stav doručenia (delivered, bounced, etc.)
- ✅ Otvorenia (ak je tracking zapnutý)
- ✅ Kliknutia na linky
- ✅ Logy a error messages

## Debugging

### Email sa neodoslal

1. **Skontroluj Vercel logs:**
   - Choď do Vercel Dashboard → Functions
   - Klikni na `/api/contact`
   - Pozri logy

2. **Skontroluj API kľúč:**
   - Uisti sa, že `RESEND_API_KEY` je nastavený vo Vercel
   - Skontroluj, či začína s `re_`
   - Skús vytvoriť nový API kľúč

3. **Skontroluj limity:**
   - Free tier: 100 emailov/deň
   - Choď na [Resend Dashboard](https://resend.com) a pozri Usage

### Email skončil v spame

1. **Krátkodobé riešenie:**
   - Pridaj `noreply@resend.dev` do kontaktov
   - Označ email ako "Not Spam"

2. **Dlhodobé riešenie:**
   - Nastav vlastnú doménu (pozri vyššie)
   - Nakonfiguruj SPF, DKIM, DMARC záznamy

## Náklady

- **Free tier:** 100 emailov/deň, 3000/mesiac - **$0**
- **Pro tier:** 50,000 emailov/mesiac - **$20/mesiac**

Pre Taxi NearMe je free tier viac než dostačujúci.

## Porovnanie s predchádzajúcim riešením (FormSubmit.co)

| Vlastnosť | FormSubmit.co | Resend |
|-----------|---------------|--------|
| Cena | Zadarmo | Zadarmo (100/deň) |
| Verifikácia | Áno, pri každom nasadení | Raz, potom stačí API kľúč |
| Doručiteľnosť | Nižšia | Vyššia |
| Custom doména | Nie | Áno |
| Monitoring | Nie | Áno |
| API | Nie | Áno |
| Profesionalita | Nízka | Vysoká |

## Podpora

- **Resend dokumentácia:** https://resend.com/docs
- **Resend Discord:** https://resend.com/discord
- **Email podpora:** support@resend.com

## Súvisiace súbory v projekte

- `app/api/contact/route.ts` - API route pre odosielanie emailov
- `src/components/ContactFormModal.tsx` - Kontaktný formulár
- `.env.example` - Príklad konfigurácie
- `next.config.ts` - CSP konfigurácia
