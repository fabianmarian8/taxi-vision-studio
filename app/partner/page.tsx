import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PasswordSettings } from './PasswordSettings';
import { SuperadminPartnerList } from './SuperadminPartnerList';
import { isSuperadmin } from '@/lib/superadmin';
import { getCityBySlug } from '@/data/cities';
import { ServiceIdentityStrip } from '@/components/dashboard/ServiceIdentityStrip';
import { ServiceStatusCard } from '@/components/dashboard/ServiceStatusCard';
import { ProfileStatusPanel } from '@/components/dashboard/ProfileStatusPanel';
import { PerformancePanel } from '@/components/dashboard/PerformancePanel';
import { PlanAndUnlocksPanel } from '@/components/dashboard/PlanAndUnlocksPanel';

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
          phone,
          description,
          hero_image_url,
          gallery,
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
          phone,
          description,
          hero_image_url,
          gallery,
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
          phone,
          description,
          hero_image_url,
          gallery,
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

  // === Command Center data preparation ===
  const featuredPartner = partners?.[0] || null;
  const featuredSub = featuredPartner ? partnerSubscriptions.get(featuredPartner.id) : null;
  const featuredPlanType = featuredSub?.plan_type || (featuredPartner as { plan_type?: string } | null)?.plan_type || 'free';

  // Profile health for featured partner
  type DraftRow = {
    status?: string; phone?: string; description?: string;
    hero_image_url?: string; gallery?: string[]; company_name?: string;
    updated_at?: string | null; submitted_at?: string | null;
  };
  const allDrafts = featuredPartner
    ? [...(featuredPartner.partner_drafts || [])].sort(
        (a: { updated_at?: string | null }, b: { updated_at?: string | null }) =>
          new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      ) as DraftRow[]
    : [];

  // Simple status: if any draft row has status='draft', show "Rozpracované". Otherwise "Live".
  // Publish cleans up all draft rows, so after publish there's only approved = Live.
  const latestApproved = allDrafts.find(d => d.status === 'approved');
  const hasWorkingDraft = allDrafts.some(d => d.status === 'draft');
  const displayStatus = hasWorkingDraft ? 'draft' : (latestApproved ? 'approved' : 'draft');

  // Use approved draft for health data (it has the real content), working draft for status
  const featuredDraft = latestApproved || allDrafts[0];

  const city = featuredPartner ? getCityBySlug(featuredPartner.city_slug) : null;
  const cityName = city?.name || featuredPartner?.city_slug || '';

  // Find matching service from JSON for fallback data
  const jsonService = city?.taxiServices.find(s =>
    s.name.toLowerCase() === featuredPartner?.name.toLowerCase()
  );

  // Profile completeness — merge draft + JSON fallback
  const hasPhone = !!(featuredDraft?.phone || jsonService?.phone);
  const hasDescription = !!(featuredDraft?.description || jsonService?.description || jsonService?.customDescription);
  const hasHeroImage = !!(featuredDraft?.hero_image_url || jsonService?.partnerData?.heroImage);
  const hasGallery = ((featuredDraft?.gallery as string[]) || jsonService?.gallery || []).length > 0;

  const profileChecks = [
    { label: 'Kontakty vyplnené', done: hasPhone },
    { label: 'Popis doplnený', done: hasDescription },
    { label: 'Hero obrázok', done: hasHeroImage },
    { label: 'Galéria', done: hasGallery },
  ];
  const completedFields = profileChecks.filter(c => c.done).length;
  const completeness = profileChecks.length > 0 ? Math.round((completedFields / profileChecks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — kompaktný, len account actions */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">Partner Portal</h1>
              {userIsSuperadmin && (
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  SUPERADMIN
                </span>
              )}
              <span className="text-sm text-gray-400">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {userIsSuperadmin && (
                <Link href="/admin" className="text-purple-600 hover:text-purple-800 font-medium">
                  Admin
                </Link>
              )}
              <PasswordSettings />
              <form action="/partner/auth/signout" method="POST">
                <button type="submit" className="text-gray-500 hover:text-gray-700">
                  Odhlásiť sa
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Chyba pri načítaní dát: {error.message}
          </div>
        )}

        {/* Superadmin Partner List */}
        {userIsSuperadmin && (
          <div className="mb-6">
            <SuperadminPartnerList
              partners={allPartners}
              currentImpersonating={impersonatingSlug}
            />
          </div>
        )}

        {/* Vrstva 1: Service Identity Strip */}
        {featuredPartner && (
          <ServiceIdentityStrip
            serviceName={featuredPartner.name}
            citySlug={featuredPartner.city_slug}
            cityName={cityName}
            partnerSlug={featuredPartner.slug}
            planType={featuredPlanType}
            draftStatus={displayStatus}
            lastUpdated={featuredDraft?.updated_at || null}
            profileHealth={{ completedFields, totalFields: profileChecks.length }}
          />
        )}

        {/* Vrstva 2: 3-column grid — Profil | Výkon | Balík */}
        {featuredPartner && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <ProfileStatusPanel
              partnerSlug={featuredPartner.slug}
              draftStatus={displayStatus}
              lastUpdated={featuredDraft?.updated_at || null}
              checks={profileChecks}
              completeness={completeness}
            />
            <PerformancePanel
              citySlug={featuredPartner.city_slug}
              serviceName={featuredPartner.name}
              planType={featuredPlanType}
            />
            <PlanAndUnlocksPanel
              planType={featuredPlanType}
              partnerId={featuredPartner.id}
              partnerSlug={featuredPartner.slug}
              citySlug={featuredPartner.city_slug}
              taxiServiceName={featuredPartner.name}
              hasSubscription={!!featuredSub}
            />
          </div>
        )}

        {/* Vrstva 3: Moje taxislužby */}
        {partners && partners.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {impersonatingSlug && displayPartnerName
                ? `Taxislužby partnera: ${displayPartnerName}`
                : 'Moje taxislužby'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {partners.map((partner) => (
                <ServiceStatusCard
                  key={partner.id}
                  partner={partner}
                  subscription={partnerSubscriptions.get(partner.id) || null}
                />
              ))}
            </div>
          </>
        )}

        {partners && partners.length === 0 && !userIsSuperadmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              Zatiaľ nemáte priradenú žiadnu taxislužbu.
              <br />
              Kontaktujte administrátora pre pridanie vašej taxislužby.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
