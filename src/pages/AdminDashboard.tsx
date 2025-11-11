import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, MapPin, Edit, Bell } from 'lucide-react';

interface CityData {
  name: string;
  slug: string;
  region: string;
  taxiServices: any[];
}

export default function AdminDashboard() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    loadCities();
  }, [navigate]);

  const loadCities = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      } else {
        throw new Error('Failed to load data');
      }

      // Načítaj počet čakajúcich návrhov
      try {
        const suggestionsResponse = await fetch('/api/suggestions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json();
          const pendingCount = suggestionsData.suggestions.filter(
            (s: any) => s.status === 'pending'
          ).length;
          setPendingSuggestionsCount(pendingCount);
        }
      } catch (error) {
        console.error('Failed to load suggestions count:', error);
      }
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať dáta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    toast({
      title: 'Odhlásenie úspešné',
      description: 'Boli ste odhlásení z admin panelu',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítavam dáta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel - Správa Taxislužieb</h1>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Odhlásiť sa
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Návrhy - Quick Access */}
        {pendingSuggestionsCount > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Bell className="w-5 h-5" />
                Čakajúce návrhy taxislužieb
              </CardTitle>
              <CardDescription>
                Máte {pendingSuggestionsCount} nových návrhov čakajúcich na schválenie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/admin/suggestions')}
                className="w-full sm:w-auto"
              >
                Zobraziť návrhy
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Mestá na Slovensku</h2>
          <p className="text-gray-600">Kliknutím na mesto môžete upraviť zoznam taxislužieb</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <Card key={city.slug} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  {city.name}
                </CardTitle>
                <CardDescription>{city.region}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Počet taxislužieb: <span className="font-semibold">{city.taxiServices?.length || 0}</span>
                  </div>
                  <Button 
                    onClick={() => navigate(`/admin/edit/${city.slug}`)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Upraviť zoznam
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
