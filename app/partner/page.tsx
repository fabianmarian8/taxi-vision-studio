import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PasswordSettings } from './PasswordSettings';
import { SuperadminPartnerList } from './SuperadminPartnerList';
import { isSuperadmin } from '@/lib/superadmin';
import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';

interface PageProps {
  searchParams: Promise<{ as?: string }>;
}

function normalizeCompanyName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function PartnerDashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const impersonatingSlug = params.as || null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/partner/login');
  }

  const userIsSuperadmin = isSuperadmin(user.email);

  // For superadmin: get ALL partners for the list
  let allPartners: Array<{
    id: string;
    name: string;
    slug: string;
    city_slug: string;
    email: string | null;
    user_id: string | null;
    created_at: string;
  }> = [];

  if (userIsSuperadmin) {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: allPartnersData } = await adminClient
      .from('partners')
      .select('id, name, slug, city_slug, email, user_id, created_at')
      .order('name');

    allPartners = allPartnersData || [];
  }

  // Determine which partners to show in the dashboard
  let displayPartnerId: string | null = null;
  let displayPartnerName: string | null = null;

  // If superadmin is impersonating, find that partner
  if (userIsSuperadmin && impersonatingSlug) {
    const impersonatedPartner = allPartners.find((p) => p.slug === impersonatingSlug);
    if (impersonatedPartner) {
      displayPartnerId = impersonatedPartner.id;
      displayPartnerName = impersonatedPartner.name;
    }
  }

  // Get partner's taxi services based on impersonation or user
  let partnersQuery;

  if (userIsSuperadmin && displayPartnerId) {
    // Superadmin impersonating - use admin client
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    partnersQuery = adminClient
      .from('partners')
      .select(`
        *,
        partner_drafts (
          id,
          status,
          company_name,
          submitted_at,
          reviewed_at,
          updated_at
        )
      `)
      .eq('id', displayPartnerId);
  } else if (userIsSuperadmin && !impersonatingSlug) {
    // Superadmin without impersonation - show their own partners (if any)
    partnersQuery = supabase
      .from('partners')
      .select(`
        *,
        partner_drafts (
          id,
          status,
          company_name,
          submitted_at,
          reviewed_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);
  } else {
    // Regular user - show their partners
    partnersQuery = supabase
      .from('partners')
      .select(`
        *,
        partner_drafts (
          id,
          status,
          company_name,
          submitted_at,
          reviewed_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);
  }

  const { data: partners, error } = await partnersQuery;

  // Fetch subscription data for each partner (via taxi_services)
  const partnerSubscriptions: Map<string, { stripe_customer_id: string; status: string; plan_type: string }> = new Map();

  if (partners && partners.length > 0) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const citySlugs = Array.from(new Set(partners.map((partner) => partner.city_slug).filter(Boolean)));

    const { data: taxiServicesWithSubscriptions } = await adminClient
      .from('taxi_services')
      .select(`
        name,
        city_slug,
        subscriptions (
          stripe_customer_id,
          status,
          plan_type
        )
      `)
      .in('city_slug', citySlugs)
      .not('subscription_id', 'is', null);

    const exactSubscriptionMap = new Map<string, { stripe_customer_id: string; status: string; plan_type: string }>();
    const subscriptionsByCity = new Map<
      string,
      Array<{ normalizedName: string; subscription: { stripe_customer_id: string; status: string; plan_type: string } }>
    >();

    for (const taxiService of taxiServicesWithSubscriptions || []) {
      const rawSubscription = (taxiService as { subscriptions?: unknown }).subscriptions;
      const subscription = Array.isArray(rawSubscription) ? rawSubscription[0] : rawSubscription;
      if (!subscription || typeof subscription !== 'object') continue;

      const { stripe_customer_id, status, plan_type } = subscription as {
        stripe_customer_id?: string;
        status?: string;
        plan_type?: string;
      };

      const serviceName = (taxiService as { name?: string }).name;
      const serviceCitySlug = (taxiService as { city_slug?: string }).city_slug;
      if (!stripe_customer_id || !serviceName || !serviceCitySlug) continue;

      const mappedSubscription = {
        stripe_customer_id,
        status: status || 'unknown',
        plan_type: plan_type || 'unknown',
      };
      const normalizedServiceName = normalizeCompanyName(serviceName);
      const exactKey = `${serviceCitySlug}::${normalizedServiceName}`;

      if (!exactSubscriptionMap.has(exactKey)) {
        exactSubscriptionMap.set(exactKey, mappedSubscription);
      }

      const cityServices = subscriptionsByCity.get(serviceCitySlug) || [];
      cityServices.push({ normalizedName: normalizedServiceName, subscription: mappedSubscription });
      subscriptionsByCity.set(serviceCitySlug, cityServices);
    }

    for (const partner of partners) {
      const normalizedPartnerName = normalizeCompanyName(partner.name);
      const exactKey = `${partner.city_slug}::${normalizedPartnerName}`;

      const exactMatch = exactSubscriptionMap.get(exactKey);
      if (exactMatch) {
        partnerSubscriptions.set(partner.id, exactMatch);
        continue;
      }

      const cityCandidates = subscriptionsByCity.get(partner.city_slug) || [];
      const MIN_FUZZY_LENGTH = 5;
      const MIN_LENGTH_RATIO = 0.7;
      const fuzzyMatch =
        normalizedPartnerName.length >= MIN_FUZZY_LENGTH
          ? cityCandidates.find((candidate) => {
              if (candidate.normalizedName.length < MIN_FUZZY_LENGTH) return false;
              const shorter = Math.min(candidate.normalizedName.length, normalizedPartnerName.length);
              const longer = Math.max(candidate.normalizedName.length, normalizedPartnerName.length);
              if (shorter / longer < MIN_LENGTH_RATIO) return false;
              return (
                candidate.normalizedName.includes(normalizedPartnerName) ||
                normalizedPartnerName.includes(candidate.normalizedName)
              );
            })
          : undefined;

      if (fuzzyMatch) {
        partnerSubscriptions.set(partner.id, fuzzyMatch.subscription);
      }
    }
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rozpracované', color: 'bg-gray-100 text-gray-700' },
    pending: { label: 'Čaká na schválenie', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Schválené', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Zamietnuté', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${userIsSuperadmin ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-purple-600'} rounded-full flex items-center justify-center`}>
                {userIsSuperadmin ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Partner Portal</h1>
                  {userIsSuperadmin && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      SUPERADMIN
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {userIsSuperadmin && (
                <Link
                  href="/admin"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Admin Panel
                </Link>
              )}
              <PasswordSettings />
              <form action="/partner/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Odhlásiť sa
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Superadmin Partner List */}
        {userIsSuperadmin && (
          <SuperadminPartnerList
            partners={allPartners}
            currentImpersonating={impersonatingSlug}
          />
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {impersonatingSlug && displayPartnerName
              ? `Taxislužby partnera: ${displayPartnerName}`
              : 'Vaše taxislužby'}
          </h2>
          <p className="text-gray-600 mt-1">
            {impersonatingSlug
              ? 'Upravujete profil ako superadmin'
              : 'Spravujte informácie o vašich taxislužbách'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Chyba pri načítaní dát: {error.message}
          </div>
        )}

        {partners && partners.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {impersonatingSlug ? 'Žiadne taxislužby pre tohto partnera' : 'Žiadne taxislužby'}
            </h3>
            <p className="text-gray-500">
              {impersonatingSlug ? (
                <>
                  Tento partner nemá priradenú žiadnu taxislužbu.
                  <br />
                  <Link href="/partner" className="text-purple-600 hover:underline">
                    Vrátiť sa späť
                  </Link>
                </>
              ) : (
                <>
                  Zatiaľ nemáte priradenú žiadnu taxislužbu.
                  <br />
                  Kontaktujte administrátora pre pridanie vašej taxislužby.
                </>
              )}
            </p>
          </div>
        )}

        {partners && partners.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {partners.map((partner) => {
              // Sort drafts by updated_at descending and get the latest
              const sortedDrafts = [...(partner.partner_drafts || [])].sort(
                (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
              );
              const latestDraft = sortedDrafts[0];
              const status = latestDraft?.status || 'draft';
              const statusInfo = statusLabels[status];
              const subscription = partnerSubscriptions.get(partner.id);

              return (
                <div
                  key={partner.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-gray-500">{partner.city_slug}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        {subscription && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              subscription.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {subscription.plan_type?.toUpperCase()} {subscription.status === 'active' ? '✓' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {latestDraft?.submitted_at && (
                      <p className="text-sm text-gray-500 mb-4">
                        Odoslané:{' '}
                        {new Date(latestDraft.submitted_at).toLocaleDateString('sk-SK')}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Link
                        href={`/partner/edit/${partner.slug}`}
                        className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        Upraviť
                      </Link>
                      <Link
                        href={`/taxi/${partner.city_slug}/${partner.slug}`}
                        target="_blank"
                        className="flex-1 relative bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-center py-2 px-4 rounded-lg font-bold hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                      >
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          NEW
                        </span>
                        LIVE úpravy
                      </Link>
                    </div>

                    {/* Stripe Customer Portal - pre správu predplatného */}
                    {subscription && subscription.stripe_customer_id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Predplatné</span>
                          <CustomerPortalButton
                            customerId={subscription.stripe_customer_id}
                            variant="outline"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
