import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { getCityBySlug } from '@/data/cities';
import { discoverTaxiServices, normalizePhone as braveNormalizePhone } from '@/lib/brave-search';
import {
  scrapeAzetForCity,
  normalizePhone as azetNormalizePhone,
  formatPhoneNumber,
} from '@/lib/azet-scraper';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function generateHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 32);
}

function generateBatchId(): string {
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const rand = crypto.randomBytes(4).toString('hex');
  return `discovery-${ts}-${rand}`;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { citySlug } = await request.json();
    if (!citySlug || typeof citySlug !== 'string') {
      return NextResponse.json({ error: 'citySlug is required' }, { status: 400 });
    }

    const city = getCityBySlug(citySlug);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const supabase = getServiceClient();
    const batchId = generateBatchId();

    // Create discovery run record
    await supabase.from('discovery_runs').insert({
      batch_id: batchId,
      status: 'running',
      cities_total: 1,
      cities_processed: 0,
      config: { citySlug, cityName: city.name, sources: ['brave', 'azet'] },
    });

    // Gather all existing phones (from JSON + DB discoveries)
    const existingPhones = city.taxiServices
      .flatMap(s => [s.phone, s.phone2, s.phone3])
      .filter((p): p is string => !!p);

    const { data: existingDiscoveries } = await supabase
      .from('taxi_discoveries')
      .select('phone_normalized')
      .eq('city_slug', citySlug)
      .not('phone_normalized', 'is', null);

    const existingNormalizedSet = new Set<string>();
    for (const p of existingPhones) {
      const n = azetNormalizePhone(p);
      if (n) existingNormalizedSet.add(n);
    }
    for (const d of existingDiscoveries || []) {
      if (d.phone_normalized) existingNormalizedSet.add(d.phone_normalized);
    }

    let newDiscoveries = 0;
    let duplicatesSkipped = 0;
    let braveApiCalls = 0;
    const allErrors: string[] = [];

    // --- SOURCE 1: Brave Search ---
    try {
      const braveResult = await discoverTaxiServices(city.name, existingNormalizedSet);
      braveApiCalls = braveResult.apiCalls;
      allErrors.push(...braveResult.errors);

      for (const candidate of braveResult.candidates) {
        const hashInput = candidate.phoneNormalized
          ? `${candidate.phoneNormalized}:${citySlug}`
          : `${candidate.name.toLowerCase().replace(/\s/g, '')}:${citySlug}:${candidate.sourceUrl}`;

        const { error: insertError } = await supabase.from('taxi_discoveries').insert({
          discovery_hash: generateHash(hashInput),
          city_slug: citySlug,
          city_name: city.name,
          region: city.region,
          name: candidate.name,
          phone: candidate.phone,
          phone_normalized: candidate.phoneNormalized || null,
          website: candidate.website,
          address: candidate.address,
          source: 'brave',
          source_url: candidate.sourceUrl,
          search_query: candidate.searchQuery,
          raw_snippet: candidate.rawSnippet,
          confidence_score: candidate.phone ? 0.70 : 0.35,
          status: 'new',
          is_nonstop: candidate.isNonstop,
          batch_id: batchId,
          discovered_at: new Date().toISOString(),
        });

        if (insertError) {
          if (insertError.code === '23505') {
            duplicatesSkipped++;
          } else {
            allErrors.push(`Brave insert "${candidate.name}": ${insertError.message}`);
          }
        } else {
          newDiscoveries++;
          // Track newly added phones to avoid Azet duplicates
          if (candidate.phoneNormalized) {
            existingNormalizedSet.add(candidate.phoneNormalized);
          }
        }
      }
    } catch (error) {
      allErrors.push(`Brave search failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // --- SOURCE 2: Azet.sk Scraper ---
    try {
      const azetResult = await scrapeAzetForCity(
        city.name,
        [...existingNormalizedSet].map(n => `+421${n}`)
      );
      allErrors.push(...azetResult.errors);

      for (const service of azetResult.services) {
        const phoneNorm = azetNormalizePhone(service.phone);
        const hashInput = phoneNorm
          ? `${phoneNorm}:${citySlug}`
          : `${service.name.toLowerCase().replace(/\s/g, '')}:${citySlug}:azet:${service.azet_id}`;

        const { error: insertError } = await supabase.from('taxi_discoveries').insert({
          discovery_hash: generateHash(hashInput),
          city_slug: citySlug,
          city_name: city.name,
          region: city.region,
          name: service.name,
          phone: service.phone ? formatPhoneNumber(service.phone) : null,
          phone_normalized: phoneNorm || null,
          website: service.website,
          address: [service.address, service.postalCode, service.city]
            .filter(Boolean)
            .join(', ') || null,
          source: 'azet',
          source_url: service.azet_url,
          search_query: `taxi ${city.name}`,
          raw_snippet: service.description?.slice(0, 500) || null,
          confidence_score: service.phone ? 0.80 : 0.40,
          status: 'new',
          is_nonstop: false,
          batch_id: batchId,
          discovered_at: new Date().toISOString(),
        });

        if (insertError) {
          if (insertError.code === '23505') {
            duplicatesSkipped++;
          } else {
            allErrors.push(`Azet insert "${service.name}": ${insertError.message}`);
          }
        } else {
          newDiscoveries++;
        }
      }

      duplicatesSkipped += azetResult.duplicatesSkipped;
    } catch (error) {
      allErrors.push(`Azet scraper failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // --- Update discovery run record ---
    const finalStatus =
      allErrors.length > 0 && newDiscoveries === 0 ? 'failed'
      : allErrors.length > 0 ? 'partial'
      : 'completed';

    await supabase
      .from('discovery_runs')
      .update({
        status: finalStatus,
        finished_at: new Date().toISOString(),
        cities_processed: 1,
        new_discoveries: newDiscoveries,
        duplicates_skipped: duplicatesSkipped,
        errors_count: allErrors.length,
        brave_api_calls: braveApiCalls,
        error_log: allErrors.length > 0 ? allErrors : null,
      })
      .eq('batch_id', batchId);

    return NextResponse.json({
      success: true,
      batchId,
      citySlug,
      cityName: city.name,
      stats: {
        newDiscoveries,
        duplicatesSkipped,
        braveApiCalls,
        errors: allErrors.length,
      },
    });
  } catch (error) {
    console.error('[discovery-run] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery run failed' },
      { status: 500 }
    );
  }
}
