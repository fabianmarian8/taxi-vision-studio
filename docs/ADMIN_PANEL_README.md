# Admin Panel - Návod na použitie

## 🔐 Prístup k Admin Panelu

Admin panel je dostupný na adrese: `https://taxi-vision-studio.vercel.app/admin/login`

### Predvolené heslo
- Heslo: `admin123` (zmeňte ho vo Vercel Environment Variables)

## 🚀 Prvé nastavenie

### 1. Nastavenie hesla vo Vercel

1. Prejdite na [Vercel Dashboard](https://vercel.com/marian-fabians-projects/taxi-vision-studio/settings/environment-variables)
2. Pridajte novú environment variable:
   - **Name**: `ADMIN_PASSWORD`
   - **Value**: Vaše bezpečné heslo
   - **Environment**: Production, Preview, Development
3. Kliknite na "Save"
4. Redeploy projektu pre aplikovanie zmien

### 2. Prihlásenie do Admin Panelu

1. Otvorte: `https://taxi-vision-studio.vercel.app/admin/login`
2. Zadajte heslo, ktoré ste nastavili vo Vercel
3. Kliknite na "Prihlásiť sa"

## 📝 Používanie Admin Panelu

### Dashboard
- Po prihlásení uvidíte zoznam všetkých slovenských miest
- Každé mesto zobrazuje počet pridaných taxislužieb
- Kliknite na "Upraviť zoznam" pre pridanie/editáciu taxislužieb

### Editácia taxislužieb

1. **Pridanie novej služby**
   - Kliknite na "Pridať službu"
   - Vyplňte údaje:
     - Názov (povinné)
     - Telefón (nepovinné)
     - Webová stránka (nepovinné)

2. **Odstránenie služby**
   - Kliknite na ikonu koša vedľa služby

3. **Uloženie zmien**
   - Po dokončení úprav kliknite na "Uložiť zmeny"
   - Zmeny sa okamžite prejavia na verejnej stránke

## 🏗️ Technická architektúra

### API Endpoints

#### `/api/admin-auth` (POST)
- Autentifikácia admina
- Body: `{ "password": "vaše_heslo" }`
- Response: `{ "success": true, "token": "..." }`

#### `/api/admin-data` (GET)
- Načítanie všetkých dát o mestách
- Headers: `Authorization: Bearer <token>`
- Response: JSON so zoznamom miest a taxislužieb

#### `/api/admin-data` (POST)
- Aktualizácia taxislužieb pre mesto
- Headers: `Authorization: Bearer <token>`
- Body: `{ "citySlug": "bratislava", "taxiServices": [...] }`

### Súbory

```
taxi-vision-studio/
├── api/
│   ├── admin-auth.js       # Autentifikačný endpoint
│   └── admin-data.js       # CRUD operácie pre taxislužby
├── src/
│   ├── data/
│   │   └── cities.json     # Ukladanie dát taxislužieb
│   └── pages/
│       ├── AdminLogin.tsx      # Prihlasovacia stránka
│       ├── AdminDashboard.tsx  # Prehľad miest
│       └── AdminEditCity.tsx   # Editácia taxislužieb
```

## 🔒 Bezpečnosť

- Admin panel je chránený heslom
- Token sa ukladá do localStorage
- API endpointy vyžadujú autorizačný token
- V produkcii použite silné heslo

## 🛠️ Troubleshooting

### Problémy s prihlásením
1. Skontrolujte, či je nastavená `ADMIN_PASSWORD` vo Vercel
2. Vyčistite cache browsera
3. Skúste použiť inkognito režim

### Dáta sa neukladajú
1. Skontrolujte, či existuje súbor `src/data/cities.json`
2. Skontrolujte oprávnenia súboru
3. Pozrite si build logy vo Vercel

### API nefunguje
1. Skontrolujte, či sú API súbory v priečinku `api/`
2. Skontrolujte CORS nastavenia
3. Pozrite si funkčné logy vo Vercel

## 📱 Použitie

1. Prihláste sa do admin panelu
2. Vyberte mesto
3. Pridajte taxislužby s kontaktnými údajmi
4. Uložte zmeny
5. Návštevníci webu môžu ihneď vidieť aktualizované taxislužby

## 🎯 Ďalšie vylepšenia

- [ ] Bulk import taxislužieb z CSV
- [ ] História zmien
- [ ] Multi-user support s rôznymi oprávneniami
- [ ] Email notifikácie pri zmenách
- [ ] Export dát do PDF/Excel
