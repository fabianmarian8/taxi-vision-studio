#!/usr/bin/env node
/**
 * Zadarma API Test Script
 *
 * Testuje autentifikaciu volanim GET /v1/info/balance/
 *
 * Pouzitie:
 *   ZADARMA_API_KEY=xxx ZADARMA_API_SECRET=yyy node scripts/test-zadarma-auth.mjs
 *
 * Alebo ak mas .env v roote projektu:
 *   node --env-file=.env scripts/test-zadarma-auth.mjs
 *
 * Referencia: github.com/zadarma/user-api-typescript (oficialny SDK)
 */

import crypto from 'crypto';

const API_URL = 'https://api.zadarma.com';

const key = process.env.ZADARMA_API_KEY;
const secret = process.env.ZADARMA_API_SECRET;

if (!key || !secret) {
  console.error('CHYBA: Nastav ZADARMA_API_KEY a ZADARMA_API_SECRET');
  console.error('Pouzitie: ZADARMA_API_KEY=xxx ZADARMA_API_SECRET=yyy node scripts/test-zadarma-auth.mjs');
  process.exit(1);
}

console.log(`API Key: ${key.substring(0, 6)}...${key.substring(key.length - 4)}`);
console.log(`Secret:  ${secret.substring(0, 4)}...${secret.substring(secret.length - 4)} (dlzka: ${secret.length})`);
console.log('');

/**
 * Generuj podpis pre Zadarma API (presne podla oficialneho SDK)
 *
 * Algoritmus:
 * 1. Sort params keys alphabetically, filter out objects
 * 2. URLSearchParams (= PHP http_build_query RFC1738): spaces -> +, + -> %2B
 * 3. md5(paramString) -> hex
 * 4. signStr = method + paramString + md5hex
 * 5. hmac-sha1(signStr, secret) -> hex -> base64
 */
function generateSignature(method, params, secret) {
  // 1. Sort + filter (presne ako oficial SDK)
  const sortedParams = Object.keys(params)
    .filter(key => typeof params[key] !== 'object' || params[key] === null)
    .sort()
    .reduce((obj, k) => { obj[k] = params[k]; return obj; }, {});

  // 2. URL encode (URLSearchParams = PHP http_build_query RFC1738)
  const paramString = new URLSearchParams(sortedParams).toString().replace(/%20/g, '+');

  // 3. MD5 hash
  const md5Hash = crypto.createHash('md5').update(paramString).digest('hex');

  // 4. Sign string
  const signStr = method + paramString + md5Hash;

  // 5. HMAC-SHA1 -> HEX -> base64
  //    KRITICKE: PHP base64_encode(hash_hmac('sha1',...)) = base64(hex_string)
  //    NIE crypto.createHmac().digest('base64') = base64(raw_binary)
  const hmacHex = crypto.createHmac('sha1', secret).update(signStr).digest('hex');
  const signature = Buffer.from(hmacHex).toString('base64');

  return { signature, paramString, signStr, md5Hash };
}

/**
 * Zavolaj Zadarma API
 */
async function callApi(method, params = {}, httpMethod = 'GET') {
  // Pridaj format parameter (oficial SDK to robi)
  params.format = 'json';

  const { signature, paramString, signStr } = generateSignature(method, params, secret);

  const authHeader = `${key}:${signature}`;
  let url = `${API_URL}${method}`;
  const headers = {
    'Authorization': authHeader,
  };
  const fetchOptions = { method: httpMethod, headers };

  if (httpMethod === 'GET') {
    url = `${url}?${paramString}`;
  } else {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    fetchOptions.body = paramString;
  }

  console.log(`--- ${httpMethod} ${method} ---`);
  console.log(`URL: ${url}`);
  console.log(`Authorization: ${authHeader.substring(0, 20)}...`);
  console.log(`Params: ${paramString || '(none)'}`);
  console.log('');

  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  console.log(`HTTP Status: ${response.status}`);
  console.log(`Response: ${JSON.stringify(data, null, 2)}`);

  // Rate limit headers
  for (const [h, v] of response.headers.entries()) {
    if (h.toLowerCase().startsWith('x-ratelimit')) {
      console.log(`${h}: ${v}`);
    }
  }
  console.log('');

  return data;
}

// === Testy ===

console.log('='.repeat(60));
console.log('TEST 1: GET /v1/info/balance/ (najjednoduchsi endpoint)');
console.log('='.repeat(60));
const balanceResult = await callApi('/v1/info/balance/');

console.log('='.repeat(60));
console.log('TEST 2: GET /v1/info/timezone/');
console.log('='.repeat(60));
const tzResult = await callApi('/v1/info/timezone/');

console.log('='.repeat(60));
console.log('TEST 3: GET /v1/tariff/');
console.log('='.repeat(60));
const tariffResult = await callApi('/v1/tariff/');

// Sumar
console.log('='.repeat(60));
console.log('SUMAR');
console.log('='.repeat(60));
console.log(`Balance: ${balanceResult.status === 'success' ? 'OK' : 'FAIL - ' + (balanceResult.message || JSON.stringify(balanceResult))}`);
console.log(`Timezone: ${tzResult.status === 'success' ? 'OK' : 'FAIL - ' + (tzResult.message || JSON.stringify(tzResult))}`);
console.log(`Tariff: ${tariffResult.status === 'success' ? 'OK' : 'FAIL - ' + (tariffResult.message || JSON.stringify(tariffResult))}`);

if (balanceResult.status === 'success') {
  console.log('');
  console.log('AUTENTIFIKACIA FUNGUJE! API kluce su spravne.');
  if (balanceResult.balance !== undefined) {
    console.log(`Zostatok: ${balanceResult.balance} ${balanceResult.currency || ''}`);
  }
} else {
  console.log('');
  console.log('AUTENTIFIKACIA ZLYHALA. Mozne priciny:');
  console.log('1. Nespravny API key alebo secret');
  console.log('2. API kluce nie su aktivovane v https://my.zadarma.com/api/');
  console.log('3. IP adresa nie je na whiteliste (ak je nastaveny)');
  console.log('4. Ucet nie je plne verifikovany');
  console.log('5. API kluce expirovali a treba vygenerovat nove');
}
