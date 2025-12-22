import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify admin session
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active subscriptions
    const { data: activeSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active');

    if (subError) throw subError;

    // Calculate MRR
    const mrr = (activeSubscriptions || []).reduce((total, sub) => {
      return total + (sub.amount_cents || 0);
    }, 0) / 100;

    // Count by plan type
    const premiumCount = (activeSubscriptions || []).filter(s => s.plan_type === 'premium').length;
    const partnerCount = (activeSubscriptions || []).filter(s => s.plan_type === 'partner').length;

    // Get expiring subscriptions (next 7 and 30 days)
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: expiringSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)
      .lte('current_period_end', thirtyDays.toISOString())
      .order('current_period_end', { ascending: true });

    const expiringSoon = {
      sevenDays: (expiringSubscriptions || []).filter(
        s => new Date(s.current_period_end) <= sevenDays
      ),
      thirtyDays: expiringSubscriptions || [],
    };

    // Get monthly revenue history (using the RPC function)
    const { data: monthlyHistory, error: historyError } = await supabase
      .rpc('get_monthly_revenue', { months_back: 12 });

    // If RPC not available, calculate manually
    let history = monthlyHistory;
    if (historyError || !history) {
      history = await calculateMonthlyHistoryManually();
    }

    // Get recent events for churn calculation
    const { data: recentEvents } = await supabase
      .from('subscription_events')
      .select('*')
      .in('event_type', ['created', 'canceled'])
      .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const newThisMonth = (recentEvents || []).filter(e => e.event_type === 'created').length;
    const canceledThisMonth = (recentEvents || []).filter(e => e.event_type === 'canceled').length;
    const totalActive = premiumCount + partnerCount;
    const churnRate = totalActive > 0 ? (canceledThisMonth / totalActive) * 100 : 0;

    return NextResponse.json({
      mrr,
      subscriptions: {
        total: premiumCount + partnerCount,
        premium: premiumCount,
        partner: partnerCount,
      },
      expiring: expiringSoon,
      history: history || [],
      metrics: {
        newThisMonth,
        canceledThisMonth,
        churnRate: Math.round(churnRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

async function calculateMonthlyHistoryManually() {
  const history = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthKey = monthStart.toISOString().substring(0, 7);

    // Get active subscriptions for this month
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .lte('created_at', monthEnd.toISOString())
      .or(`canceled_at.is.null,canceled_at.gt.${monthStart.toISOString()}`);

    const activeSubs = subs || [];
    const mrr = activeSubs.reduce((t, s) => t + (s.amount_cents || 0), 0) / 100;

    history.push({
      month: monthKey,
      mrr,
      premium_count: activeSubs.filter(s => s.plan_type === 'premium').length,
      partner_count: activeSubs.filter(s => s.plan_type === 'partner').length,
      new_subscriptions: 0, // Would need events table
      canceled_subscriptions: 0,
    });
  }

  return history.reverse();
}
