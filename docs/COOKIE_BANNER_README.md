# 🍪 Cookie Banner - GDPR Compliant

Profesionálny cookie banner pre taxinearme.sk s podporou GDPR a úžasným dizajnom!

## ✨ Features

- ✅ **GDPR Compliant** - Plne v súlade s európskou legislatívou
- 🎨 **Custom Dizajn** - Taxameter štýl so žltým pozadím
- 🍪 **Cookie Postavičky** - Vtipné 3D cookie maskotky
- ⚙️ **Granular Controls** - Detailné nastavenia pre jednotlivé typy cookies
- 📱 **Responsive** - Funguje na mobile, tablete aj desktope
- 🚀 **Performance** - Optimalizované, nenaťahuje stránku
- 💾 **LocalStorage** - Ukladá preferencie lokálne
- 🔄 **Version Control** - Sleduje zmeny v cookie policy
- ⏰ **Auto-Expiration** - Consent expiruje po 6 mesiacoch

## 📦 Inštalácia

### 1. Skopíruj súbory do projektu

```bash
# Vytvor cookie-banner adresár v src/components
mkdir -p src/components/cookie-banner

# Skopíruj komponenty
cp CookieBanner.tsx src/components/cookie-banner/
cp cookieManager.ts src/components/cookie-banner/
cp index.ts src/components/cookie-banner/
```

### 2. Pridaj obrázky do public/

```bash
# Obrázky cookie postavičiek
cp cookie-character-1.png public/
cp cookie-taxi.png public/
cp cookie-characters-group.png public/
```

### 3. Pridaj do App.tsx

```tsx
import { CookieBanner } from './components/cookie-banner';

function App() {
  return (
    <>
      {/* Tvoj existujúci kód */}
      
      {/* Cookie Banner */}
      <CookieBanner />
    </>
  );
}
```

## 🎯 Použitie

### Základné Použitie

Cookie banner sa automaticky zobrazí pri prvej návšteve. Po nastavení preferencií sa už nezobrazí (kým neexpiruje consent).

### Kontrola Cookie Consent v Kóde

```tsx
import { isCookieTypeEnabled, getCookieConsent } from './components/cookie-banner';

// Kontrola či sú analytics povolené
if (isCookieTypeEnabled('analytics')) {
  // Spusti Google Analytics
  initGoogleAnalytics();
}

// Získaj celý consent object
const consent = getCookieConsent();
console.log(consent?.preferences);
```

### Tlačidlo na Znovuotvorenie Nastavení

Pridaj do pätičky alebo nastavení:

```tsx
import { reopenCookieSettings } from './components/cookie-banner';

<button onClick={reopenCookieSettings}>
  Nastavenia Cookies 🍪
</button>
```

## 🔧 Konfigurácia

### Integrácia Google Analytics

V `cookieManager.ts` je už pripravená integrácia. Stačí pridať GA kód do `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Default consent na 'denied'
  gtag('consent', 'default', {
    'analytics_storage': 'denied'
  });
  
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Cookie banner automaticky aktivuje/deaktivuje Analytics na základe užívateľského súhlasu.

### Integrácia Facebook Pixel

Podobne ako GA, pridaj Facebook Pixel do `index.html`:

```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  
  // Consent na denied
  fbq('consent', 'revoke');
  
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

## 🎨 Customizácia

### Zmena Farieb

V `CookieBanner.tsx` môžeš upraviť farby:

```tsx
// Aktuálne: Žlté pozadie (taxameter štýl)
bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400

// Zmena na inú farbu:
bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400
```

### Zmena Pozície

Banner je momentálne dole v strede. Pre zmenu pozície uprav:

```tsx
// Aktuálne: Dole v strede
className="fixed inset-0 z-50 flex items-end justify-center"

// Hore v strede:
className="fixed inset-0 z-50 flex items-start justify-center"

// Vpravo dole (corner):
className="fixed bottom-4 right-4 z-50"
```

### Zmena Expirárcie

V `cookieManager.ts` uprav:

```tsx
// Aktuálne: 6 mesiacov
if (monthsOld > 6) {

// Zmena na 12 mesiacov:
if (monthsOld > 12) {
```

## 📱 Responsive Dizajn

Cookie banner je plne responzívny:

- **Desktop:** Veľký banner s detailmi
- **Tablet:** Stredný banner s prispôsobeným layoutom  
- **Mobile:** Kompaktný banner s vertikálnym usporiadaním

## 🧪 Testing

### Testovanie Banneru

```tsx
// Vymaž consent pre testovanie
localStorage.removeItem('cookieConsent');
// Refresh stránku - banner sa zobrazí
```

### Debug Mode

Zapni console logy v `cookieManager.ts` pre debugging:

```tsx
console.log('✅ Google Analytics enabled');
console.log('❌ Google Analytics disabled');
```

## 🔒 GDPR Compliance Checklist

- ✅ Opt-in systém (nie opt-out)
- ✅ Jasné popisy každého typu cookie
- ✅ Možnosť odmietnuť všetko
- ✅ Možnosť prispôsobiť nastavenia
- ✅ Link na Privacy Policy
- ✅ Uloženie timestamp súhlasu
- ✅ Verzia cookie policy
- ✅ Expirárcia po 6 mesiacoch
- ✅ Možnosť zmeniť nastavenia kedykoľvek

## 📄 Privacy Policy

Nezabudni pridať sekciu o cookies do Privacy Policy! Odporúčam:

```markdown
## Používanie Cookies

Náš web používa cookies na zlepšenie užívateľskej skúsenosti:

### Nevyhnutné Cookies
- Zabezpečujú základné funkcie webu
- Nemôžu byť vypnuté

### Analytické Cookies  
- Google Analytics
- Sledovanie návštevnosti a správania
- Pomáhajú nám zlepšovať web

### Marketingové Cookies
- Facebook Pixel
- Retargeting reklamy
- Meranie efektivity kampaní
```

## 🚀 Deployment

Po pridaní do projektu:

1. **Commit do GitHub:**
```bash
git add .
git commit -m "feat: pridaný GDPR compliant cookie banner"
git push origin main
```

2. **Vercel Automaticky Deployuje** 🎉

## 💡 Tips & Best Practices

1. **Testuj na rôznych zariadeniach** - banner musí fungovať všade
2. **Aktualizuj cookie policy** - vždy keď pridáš novú službu
3. **Monitoruj consent rate** - sleduj koľko ľudí akceptuje cookies
4. **Respektuj užívateľské preferencie** - nepoužívaj cookies ak nebol daný súhlas
5. **Pravidelne kontroluj GDPR requirements** - legislatíva sa môže meniť

## 🤝 Support

Ak máš otázky alebo problémy:
- Otvor issue na GitHub
- Kontaktuj fabianmarian8@gmail.com

## 📜 License

MIT License - Môžeš použiť voľne!

---

**Made with ❤️ for taxinearme.sk**
🚕 Nájdi Taxík Blízko Teba! 🍪
