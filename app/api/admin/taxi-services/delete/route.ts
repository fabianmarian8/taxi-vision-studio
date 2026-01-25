import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperadmin } from '@/lib/superadmin';
import { logger } from '@/lib/logger';

// POST - skryť taxislužbu (pridá do hidden_taxi_services)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Debug logging
  console.log('[delete API] Session check:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    email: session?.user?.email,
    sessionError: sessionError?.message,
  });

  if (!session?.user) {
    return NextResponse.json({
      error: 'Unauthorized',
      debug: { hasSession: !!session, sessionError: sessionError?.message }
    }, { status: 401 });
  }

  const isAdmin = isSuperadmin(session.user.email);
  console.log('[delete API] Superadmin check:', { email: session.user.email, isAdmin });

  // Check if user is superadmin
  if (!isAdmin) {
    return NextResponse.json({
      error: 'Forbidden - only superadmin can delete',
      debug: { email: session.user.email, isAdmin }
    }, { status: 403 });
  }

  const userEmail = session.user.email || 'unknown';

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

    // Escape LIKE pattern special characters to prevent pattern injection
    const escapedServiceName = serviceName
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    // Najprv skús zmazať z taxi_submissions (ak to je submission)
    const { data: deletedSubmission } = await supabase
      .from('taxi_submissions')
      .delete()
      .eq('city_slug', citySlug)
      .ilike('name', escapedServiceName)
      .eq('status', 'approved')
      .select()
      .single();

    if (deletedSubmission) {
      log.info('Deleted taxi submission', {
        citySlug,
        serviceName,
        deletedBy: userEmail,
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
        hidden_by: userEmail,
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
      hiddenBy: userEmail,
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
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user || !isSuperadmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const citySlug = searchParams.get('citySlug');

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
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSuperadmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('hidden_taxi_services')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
