import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * FOMO Marketing Script
 *
 * Tento script prideluje "fake" Premium status jednej taxisluzbe v kazdom meste,
 * aby vytvoril FOMO (Fear Of Missing Out) efekt pre ostatne taxisluzby.
 *
 * Ked taxisluzba uvidi, ze konkurencia ma "zlaty odznak", bude ho chciet tiez.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CITIES_PATH = path.join(__dirname, '..', 'src', 'data', 'cities.json');

function seedPremiumTaxis() {
  console.log('='.repeat(60));
  console.log('FOMO Marketing Script - Seed Premium Taxisluzby');
  console.log('='.repeat(60));
  console.log('');

  if (!fs.existsSync(CITIES_PATH)) {
    console.error(`Subor ${CITIES_PATH} neexistuje!`);
    process.exit(1);
  }

  // Nacitanie dat
  const rawData = fs.readFileSync(CITIES_PATH, 'utf-8');
  const data = JSON.parse(rawData);

  let totalUpgraded = 0;
  let citiesWithTaxis = 0;
  let citiesWithPaidPremium = 0;
  let citiesSkippedNoTaxis = 0;

  // Expiracny datum - 1 mesiac od dnes
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 1);
  const premiumExpiresAt = expirationDate.toISOString();

  // Iteracia cez mesta
  data.cities = data.cities.map((city) => {
    // Ak mesto nema sluzby, preskocime
    if (!city.taxiServices || city.taxiServices.length === 0) {
      citiesSkippedNoTaxis++;
      return city;
    }

    citiesWithTaxis++;

    // Skontrolujeme, ci uz mesto ma nejake platene Premium alebo Partner
    const hasExistingPaidPremium = city.taxiServices.some(
      s => (s.isPremium || s.isPartner) && !s.isPromotional
    );

    if (hasExistingPaidPremium) {
      citiesWithPaidPremium++;
      console.log(`[SKIP] ${city.name} - uz ma platiaceho Premium/Partner klienta`);
      return city;
    }

    // Resetni existujuce promotional premium v tomto meste
    city.taxiServices = city.taxiServices.map(s => {
      if (s.isPromotional) {
        const { isPremium, isPromotional, premiumExpiresAt, ...rest } = s;
        return rest;
      }
      return s;
    });

    // Vyber nahodneho "vitaza" z nepremium sluzieb
    const nonPremiumServices = city.taxiServices.filter(s => !s.isPremium && !s.isPartner);

    if (nonPremiumServices.length > 0) {
      // Nahodny vyber
      const randomIndex = Math.floor(Math.random() * nonPremiumServices.length);
      const winnerId = nonPremiumServices[randomIndex].name;

      // Update vitaza
      city.taxiServices = city.taxiServices.map(service => {
        if (service.name === winnerId) {
          console.log(`[PREMIUM] ${city.name}: "${service.name}"`);
          return {
            ...service,
            isPremium: true,
            isPromotional: true,
            premiumExpiresAt
          };
        }
        return service;
      });

      totalUpgraded++;
    }

    return city;
  });

  // Ulozenie dat
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CITIES_PATH, JSON.stringify(data, null, 2), 'utf-8');

  // Sumar
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMAR');
  console.log('='.repeat(60));
  console.log(`Celkovo miest:                  ${data.cities.length}`);
  console.log(`Miest s taxisluzami:            ${citiesWithTaxis}`);
  console.log(`Miest bez taxisluzieb:          ${citiesSkippedNoTaxis}`);
  console.log(`Miest s platenym Premium:       ${citiesWithPaidPremium}`);
  console.log(`Novych promo PREMIUM:           ${totalUpgraded}`);
  console.log('');
  console.log(`Data ulozene do: ${CITIES_PATH}`);
  console.log(`Premium expiruje: ${premiumExpiresAt}`);
  console.log('');
  console.log('FOMO efekt aktivovany!');
}

seedPremiumTaxis();
