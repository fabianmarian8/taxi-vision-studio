const fs = require('fs');
const path = require('path');

let verifyAdminAuth = null;
try { ({ verifyAdminAuth } = require('./admin-auth')); } catch (_) {}

const STAGED_PATH = path.join(process.cwd(), 'staged-suggestions.json');

function readStaged() {
  try {
    const raw = fs.readFileSync(STAGED_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { suggestions: [] };
    if (!Array.isArray(data.suggestions)) return { suggestions: [] };
    return data;
  } catch (_) {
    return { suggestions: [] };
  }
}

module.exports = async function handler(req, res) {
  try {
    if (verifyAdminAuth) {
      const ok = await verifyAdminAuth(req, res);
      if (ok === false) return;
    }
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
    const staged = readStaged();

    // Helper funkcia pre získanie prvej non-empty hodnoty
    const take = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v).trim();
        }
      }
      return '';
    };

    // Helper pre pristup k vnoreným poliam
    const getNested = (obj, ...keys) => {
      let cur = obj;
      for (const k of keys) {
        if (!cur) return undefined;
        cur = cur[k];
      }
      return cur;
    };

    // Normalizuj polia na jednotný tvar, aby UI nikdy nezobrazilo prázdne karty
    const suggestions = (staged.suggestions || []).map((s) => {
      // ID - skús rôzne aliasy
      const id = take(s?.id, s?._id, s?.uid, getNested(s, 'gbp', 'id'), getNested(s, 'place', 'place_id'));

      // citySlug - skús rôzne aliasy
      const citySlug = take(s?.citySlug, s?.city, getNested(s, 'gbp', 'citySlug'), getNested(s, 'place', 'citySlug'));

      // name - DÔLEŽITÉ: skús vnorené taxiService.name, gbp.name, place.name
      let name = take(
        s?.name,
        s?.title,
        s?.company,
        getNested(s, 'taxiService', 'name'),  // <-- Toto je kľúčové pre staged-suggestions.json!
        getNested(s, 'gbp', 'name'),
        getNested(s, 'gbp', 'title'),
        getNested(s, 'place', 'name'),
        getNested(s, 'data', 'name')
      );

      // website - skús vnorené polia
      const website = take(
        s?.website,
        s?.url,
        s?.link,
        getNested(s, 'taxiService', 'website'),
        getNested(s, 'gbp', 'website'),
        getNested(s, 'place', 'website')
      ) || undefined;

      // phone - skús vnorené polia
      const phone = take(
        s?.phone,
        s?.phoneNumber,
        s?.tel,
        getNested(s, 'taxiService', 'phone'),
        getNested(s, 'gbp', 'phone'),
        getNested(s, 'place', 'formatted_phone_number'),
        getNested(s, 'place', 'international_phone_number')
      ) || undefined;

      // address - skús vnorené polia
      const address = take(
        s?.address,
        s?.formatted_address,
        s?.addr,
        getNested(s, 'taxiService', 'address'),
        getNested(s, 'gbp', 'address'),
        getNested(s, 'place', 'vicinity'),
        getNested(s, 'place', 'formatted_address')
      ) || undefined;

      // createdAt
      const createdAt = take(
        s?.createdAt,
        s?.created_at,
        s?.timestamp,
        getNested(s, 'gbp', 'createdAt')
      ) || undefined;

      // Ak chýba name, odvoď z website, phone alebo address
      if (!name) {
        if (website) {
          try {
            const url = website.startsWith('http') ? new URL(website) : new URL('https://' + website);
            name = url.hostname.replace('www.', '');
          } catch {
            // ignore invalid URL
          }
        }
        if (!name && phone) {
          name = phone;
        }
        if (!name && address) {
          name = address.split(',')[0].trim();
        }
        if (!name) {
          name = '—';  // fallback
        }
      }

      return { id, citySlug, name, website, phone, address, createdAt };
    }).filter(x => x.id && x.citySlug);

    return res.status(200).json({ suggestions });
  } catch (e) {
    console.error('suggestions-list error', e);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};