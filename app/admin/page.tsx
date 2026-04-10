import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async function getPendingCount(table: 'partner_drafts' | 'taxi_submissions') {
    try {
      const { count } = await adminClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    } catch {
      return 0;
    }
  }

  const [pendingPartnerDraftsCount, pendingTaxiSubmissionsCount] = await Promise.all([
    getPendingCount('partner_drafts'),
    getPendingCount('taxi_submissions'),
  ]);

  const pendingApprovals = pendingPartnerDraftsCount + pendingTaxiSubmissionsCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel - Taxi NearMe</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Prihlásený: <strong>{session.username}</strong>
            </span>
            <form action="/api/admin/logout" method="POST">
              <Button type="submit" variant="outline">
                Odhlásiť sa
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className={`mb-6 ${pendingApprovals > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'}`}>
          <CardHeader>
            <CardTitle>Dnes vyžaduje pozornosť</CardTitle>
            <CardDescription>
              {pendingApprovals > 0
                ? `${pendingApprovals} položiek čaká na schválenie`
                : 'Žiadne čakajúce schvaľovanie'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
              <span className="text-sm font-medium">Partner úpravy</span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                {pendingPartnerDraftsCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
              <span className="text-sm font-medium">Návrhy taxislužieb</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                {pendingTaxiSubmissionsCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Taxislužby Card */}
          <Link href="/admin/services">
            <Card className="cursor-pointer">
              <CardHeader>
                <CardTitle>Taxislužby</CardTitle>
                <CardDescription>
                  Spravovať taxislužby, pridať nové, upraviť existujúce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Mestá Card */}
          <Link href="/admin/cities">
            <Card className="cursor-pointer">
              <CardHeader>
                <CardTitle>Mestá</CardTitle>
                <CardDescription>
                  Spravovať mestá a pridávať nové lokality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Regióny Card */}
          <Link href="/admin/regions">
            <Card className="cursor-pointer">
              <CardHeader>
                <CardTitle>Regióny</CardTitle>
                <CardDescription>
                  Spravovať regióny Slovenska
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Taxi Submissions Card */}
          <Link href="/admin/taxi-submissions">
            <Card className="cursor-pointer border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Návrhy taxislužieb</CardTitle>
                  {pendingTaxiSubmissionsCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      {pendingTaxiSubmissionsCount}
                    </span>
                  )}
                </div>
                <CardDescription>
                  Schvaľovať nové taxislužby navrhnuté používateľmi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Partner Drafts Card */}
          <Link href="/admin/partner-drafts">
              <Card className="cursor-pointer border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Partner úpravy</CardTitle>
                    {pendingPartnerDraftsCount > 0 && (
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                        {pendingPartnerDraftsCount}
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    Schvaľovať zmeny od partnerov taxislužieb
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Discovery Agent Card */}
          <Link href="/admin/discoveries">
            <Card className="cursor-pointer border-sky-200 bg-sky-50/50">
              <CardHeader>
                <CardTitle>Discovery Agent</CardTitle>
                <CardDescription>
                  Automaticky objavene taxisluzby z Brave Search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvorit</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Azet Scraper Card */}
          <Link href="/admin/azet-scraper">
            <Card className="cursor-pointer border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <CardTitle>Azet.sk Scraper</CardTitle>
                <CardDescription>
                  Vyhľadať a importovať nové taxislužby z Azet.sk katalógu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Revenue Dashboard Card */}
          <Link href="/admin/revenue">
            <Card className="cursor-pointer border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle>Revenue Dashboard</CardTitle>
                <CardDescription>
                  MRR, predplatné, churn rate a finančné metriky
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* SEO Performance Card */}
          <Link href="/admin/seo">
            <Card className="cursor-pointer border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle>SEO Performance</CardTitle>
                <CardDescription>
                  Google Search Console metriky a keyword rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Click Stats Card */}
          <Link href="/admin/stats">
            <Card className="cursor-pointer border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle>Štatistiky kliknutí</CardTitle>
                <CardDescription>
                  Sledovanie telefónnych a WhatsApp kliknutí na taxislužby
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Audit Log Card */}
          <Link href="/admin/audit-log">
            <Card className="cursor-pointer border-gray-300 bg-gray-50/50">
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  Kto sa kedy prihlásil a aké zmeny vykonal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Taxi Platba Generator Card */}
          <Link href="/admin/taxi-platba">
            <Card className="cursor-pointer border-cyan-200 bg-cyan-50/50">
              <CardHeader>
                <CardTitle>Platobné linky</CardTitle>
                <CardDescription>
                  Generovať platobné linky pre taxi jazdy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">Otvoriť</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Vitajte v admin paneli</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tu môžete spravovať obsah stránky TaxiNearMe. Vyberte jednu z možností vyššie pre začiatok.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
