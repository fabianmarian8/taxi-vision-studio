import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * FOMO Marketing Script - SK Version (JSON-based)
 *
 * Tento script prideľuje "promo" Premium status jednej taxislužbe v každom meste,
 * aby vytvoril FOMO (Fear Of Missing Out) efekt pre ostatné taxislužby.
 *
 * Keď taxislužba uvidí, že konkurencia má "zlatý odznak", bude ho chcieť tiež.
 *
 * DÔLEŽITÉ:
 * - Používa flag `isPromotional = true` na odlíšenie od platiacich zákazníkov
 * - Preskakuje mestá kde už je platiaci Premium (isPromotional = false, isPremium = true)
 * - Preskakuje mestá s iba 1 taxislužbou (žiadna konkurencia)
 * - V mestách s 3+ taxislužbami vylučuje predchádzajúceho víťaza (garantovaná rotácia)
 * - Spúšťa sa automaticky každý týždeň cez GitHub Actions
 * - Posiela email notifikáciu cez Resend ak má taxislužba email
 */

const CITIES_PATH = path.join(__dirname, '../src/data/cities.json');
const SITE_URL = 'https://taxinearme.sk';
const FROM_EMAIL = 'TaxiNearMe.sk <info@taxinearme.sk>';

interface TaxiService {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  isPremium?: boolean;
  isPromotional?: boolean;
  premiumExpiresAt?: string;
  [key: string]: unknown;
}

interface City {
  name: string;
  slug: string;
  taxiServices: TaxiService[];
  [key: string]: unknown;
}

interface CitiesData {
  cities: City[];
}

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function sendPremiumNotification(taxi: TaxiService, city: City): Promise<boolean> {
  if (!taxi.email || !resend) {
    return false;
  }

  const cityUrl = `${SITE_URL}/taxi/${city.slug}`;
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 7);
  const formattedDate = expiresDate.toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header .badge { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px; background: #f9fafb; }
    .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #e5e7eb; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">⭐</div>
    <h1>Gratulujeme! Máte PREMIUM status zadarmo</h1>
  </div>
  <div class="content">
    <p>Dobrý deň,</p>
    <p>Vaša taxislužba <strong>${taxi.name}</strong> bola vybraná ako <strong>PREMIUM taxislužba týždňa</strong> v meste ${city.name}!</p>

    <div class="highlight">
      <strong>🎁 Čo to pre vás znamená?</strong>
      <ul>
        <li>Vaša taxislužba je zobrazená na prvom mieste v zozname</li>
        <li>Zlatý PREMIUM odznak pri vašom mene</li>
        <li>Väčšia viditeľnosť pre potenciálnych zákazníkov</li>
        <li>Platí do: <strong>${formattedDate}</strong></li>
      </ul>
    </div>

    <p>Toto je jednorazová akcia. Ak chcete mať PREMIUM status <strong>trvalo</strong>, môžete si ho aktivovať za pouhých <strong>4,99 €/mesiac</strong>.</p>

    <div class="cta">
      <a href="${cityUrl}">Zobraziť moju taxislužbu →</a>
    </div>

    <p>Máte otázky? Odpovezte na tento email.</p>
    <p>S pozdravom,<br><strong>Tím TaxiNearMe.sk</strong></p>
  </div>
  <div class="footer">
    <p>Tento email bol odoslaný automaticky. Ak ho nechcete dostávať, dajte nám vedieť.</p>
    <p>© ${new Date().getFullYear()} TaxiNearMe.sk</p>
  </div>
</body>
</html>
`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: taxi.email,
      subject: `⭐ ${taxi.name} - Máte PREMIUM status zadarmo tento týždeň!`,
      html: emailHtml
    });

    if (error) {
      console.error(`  ✗ Email error for ${taxi.email}:`, error.message);
      return false;
    }

    console.log(`  ✉ Email sent to ${taxi.email}`);
    return true;
  } catch (err) {
    console.error(`  ✗ Email failed for ${taxi.email}:`, err);
    return false;
  }
}

async function runFomoMarketing() {
  console.log('='.repeat(60));
  console.log('FOMO Marketing Script - SK Version');
  console.log('='.repeat(60));
  console.log('');

  // Check Resend
  if (!resend) {
    console.log('⚠ RESEND_API_KEY not set - emails will be skipped');
  } else {
    console.log('✓ Resend configured');
  }
  console.log('');

  // Load cities
  const citiesData: CitiesData = JSON.parse(fs.readFileSync(CITIES_PATH, 'utf8'));
  const cities = citiesData.cities;

  console.log(`Loaded ${cities.length} cities`);
  console.log('');

  // Stats
  let totalCities = 0;
  let citiesWithMultipleTaxis = 0;
  let citiesWithPaidPremium = 0;
  let promotionalReset = 0;
  let newPremium = 0;
  let emailsSent = 0;

  // Expiration date - 1 week from now
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  const premiumExpiresAt = expirationDate.toISOString();

  for (const city of cities) {
    if (!city.taxiServices || city.taxiServices.length === 0) {
      continue;
    }

    totalCities++;

    // Skip: only 1 taxi (no competition)
    if (city.taxiServices.length === 1) {
      continue;
    }

    citiesWithMultipleTaxis++;

    // Skip: has paying Premium customer
    const hasPaidPremium = city.taxiServices.some(
      t => t.isPremium && !t.isPromotional
    );

    if (hasPaidPremium) {
      citiesWithPaidPremium++;
      continue;
    }

    // Remember previous promotional winner BEFORE reset (for rotation)
    const previousWinner = city.taxiServices.find(t => t.isPromotional)?.name;

    // Reset existing promotional in this city
    for (const taxi of city.taxiServices) {
      if (taxi.isPromotional) {
        taxi.isPremium = false;
        taxi.isPromotional = false;
        delete taxi.premiumExpiresAt;
        promotionalReset++;
      }
    }

    // Select random winner from non-premium services
    // If city has 3+ taxis, exclude previous winner to ensure rotation
    const nonPremium = city.taxiServices.filter(t => !t.isPremium);
    const eligible = nonPremium.length >= 3 && previousWinner
      ? nonPremium.filter(t => t.name !== previousWinner)
      : nonPremium;

    if (eligible.length === 0) {
      continue;
    }

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[randomIndex];

    // Set promotional premium
    winner.isPremium = true;
    winner.isPromotional = true;
    winner.premiumExpiresAt = premiumExpiresAt;
    newPremium++;

    console.log(`[PREMIUM] ${city.name}: "${winner.name}"${winner.email ? ` (${winner.email})` : ''}`);

    // Send email notification
    if (winner.email && resend) {
      const sent = await sendPremiumNotification(winner, city);
      if (sent) emailsSent++;
    }
  }

  // Save updated cities
  fs.writeFileSync(CITIES_PATH, JSON.stringify(citiesData, null, 2));
  console.log('');
  console.log('✓ cities.json updated');

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Cities with taxis:           ${totalCities}`);
  console.log(`Cities with 2+ taxis:        ${citiesWithMultipleTaxis}`);
  console.log(`Cities with paid Premium:    ${citiesWithPaidPremium}`);
  console.log(`Promotional reset:           ${promotionalReset}`);
  console.log(`New promo PREMIUM:           ${newPremium}`);
  console.log(`Emails sent:                 ${emailsSent}`);
  console.log('');
  console.log(`Premium expires: ${premiumExpiresAt}`);
  console.log('');
  console.log('FOMO effect activated! 🚀');
}

runFomoMarketing().catch(console.error);
