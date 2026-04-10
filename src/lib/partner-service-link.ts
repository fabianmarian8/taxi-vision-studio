import { SupabaseClient } from '@supabase/supabase-js';

export function normalizeCompanyName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeLikePattern(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

interface ResolveTaxiServiceIdOptions {
  stripeSubscriptionId?: string | null;
  citySlug?: string | null;
  taxiServiceName?: string | null;
}

interface TaxiServiceMatch {
  id: string;
  source: 'subscription' | 'exact_name' | null;
}

export async function resolveTaxiServiceId(
  supabase: SupabaseClient,
  options: ResolveTaxiServiceIdOptions
): Promise<TaxiServiceMatch> {
  const { stripeSubscriptionId, citySlug, taxiServiceName } = options;

  if (stripeSubscriptionId) {
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .limit(2);

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (subscriptions?.length === 1) {
      const { data: services, error: serviceError } = await supabase
        .from('taxi_services')
        .select('id')
        .eq('subscription_id', subscriptions[0].id)
        .limit(2);

      if (serviceError) {
        throw serviceError;
      }

      if (services?.length === 1) {
        return { id: services[0].id, source: 'subscription' };
      }
    }
  }

  if (citySlug && taxiServiceName) {
    const escapedName = escapeLikePattern(taxiServiceName);
    const { data: services, error } = await supabase
      .from('taxi_services')
      .select('id')
      .eq('city_slug', citySlug)
      .ilike('name', escapedName)
      .limit(2);

    if (error) {
      throw error;
    }

    if (services?.length === 1) {
      return { id: services[0].id, source: 'exact_name' };
    }
  }

  return { id: '', source: null };
}
