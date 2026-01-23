import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// POST - skryť taxislužbu (pridá do hidden_taxi_services)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Kontrola či je superadmin (username = 'admin')
  if (session.username !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - only superadmin can delete' }, { status: 403 });
  }

  const log = logger.with({ endpoint: 'admin/taxi-services/delete' });

  try {
    const body = await request.json();
    const { citySlug, serviceName, reason } = body;

    if (!citySlug || !serviceName) {
      return NextResponse.json(
        { error: 'citySlug and serviceName are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Najprv skús zmazať z taxi_submissions (ak to je submission)
    const { data: deletedSubmission } = await supabase
      .from('taxi_submissions')
      .delete()
      .eq('city_slug', citySlug)
      .ilike('name', serviceName)
      .eq('status', 'approved')
      .select()
      .single();

    if (deletedSubmission) {
      log.info('Deleted taxi submission', {
        citySlug,
        serviceName,
        deletedBy: session.username,
      });
      await logger.flush();

      return NextResponse.json({
        success: true,
        message: 'Taxislužba bola zmazaná (submission)',
        type: 'submission',
      });
    }

    // Ak to nie je submission, pridaj do hidden_taxi_services
    const { error: insertError } = await supabase
      .from('hidden_taxi_services')
      .insert({
        city_slug: citySlug,
        service_name: serviceName,
        hidden_by: session.username,
        reason: reason || 'Removed by superadmin',
      });

    if (insertError) {
      // Ak už existuje, to je OK
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Taxislužba je už skrytá',
          type: 'already_hidden',
        });
      }

      log.error('Error hiding taxi service', { error: insertError.message });
      await logger.flush();
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    log.info('Hidden taxi service', {
      citySlug,
      serviceName,
      hiddenBy: session.username,
    });
    await logger.flush();

    return NextResponse.json({
      success: true,
      message: 'Taxislužba bola skrytá',
      type: 'hidden',
    });
  } catch (error) {
    log.error('Error in delete endpoint', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    await logger.flush();

    return NextResponse.json(
      { error: 'Nastala neočakávaná chyba' },
      { status: 500 }
    );
  }
}

// GET - zoznam skrytých služieb
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const citySlug = searchParams.get('citySlug');

  const supabase = await createClient();

  let query = supabase.from('hidden_taxi_services').select('*');

  if (citySlug) {
    query = query.eq('city_slug', citySlug);
  }

  const { data, error } = await query.order('hidden_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hiddenServices: data });
}

// DELETE - obnoviť skrytú službu (odstrániť z hidden_taxi_services)
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.username !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('hidden_taxi_services')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
