import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Taxislužby Card */}
          <Link href="/admin/services">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
