import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const citySlug = request.nextUrl.searchParams.get('city_slug');
    const serviceName = request.nextUrl.searchParams.get('service_name');

    if (!citySlug || !serviceName) {
      return NextResponse.json({ error: 'Missing city_slug or service_name' }, { status: 400 });
    }

    // Admins use service role for bypassing RLS
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Kliknutia za poslednych 30 dni
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: clicks, error: clickError } = await adminSupabase
      .from('click_events')
      .select('event_type, created_at')
      .eq('city_slug', citySlug)
      .ilike('service_name', serviceName)
      .gte('created_at', thirtyDaysAgo);

    // Kliknutia na mesto (všetky služby) za 30 dni — pre "hľadania v meste"
    const { data: cityClicks, error: cityError } = await adminSupabase
      .from('click_events')
      .select('event_type, created_at')
      .eq('city_slug', citySlug)
      .gte('created_at', thirtyDaysAgo);

    if (clickError || cityError) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // Agregácia
    const phoneClicks = (clicks || []).filter(c => c.event_type === 'phone_click').length;
    const totalServiceClicks = (clicks || []).length;
    const totalCityClicks = (cityClicks || []).length;

    // Denný breakdown za posledných 7 dní
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyBreakdown: { date: string; clicks: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayClicks = (clicks || []).filter(c => {
        const clickDate = new Date(c.created_at).toISOString().split('T')[0];
        return clickDate === dateStr;
      }).length;
      dailyBreakdown.push({ date: dateStr, clicks: dayClicks });
    }

    return NextResponse.json({
      phoneClicks,
      totalServiceClicks,
      totalCityClicks,
      dailyBreakdown,
      period: '30d',
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' }, // 5 min cache
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
