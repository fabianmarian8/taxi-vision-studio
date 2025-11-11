import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface TaxiService {
  name: string;
  website?: string;
  phone?: string;
}

interface CityData {
  name: string;
  slug: string;
  region: string;
  taxiServices: TaxiService[];
}

export default function AdminEditCity() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [city, setCity] = useState<CityData | null>(null);
  const [taxiServices, setTaxiServices] = useState<TaxiService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    loadCityData();
  }, [citySlug, navigate]);

  const loadCityData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const foundCity = data.cities.find((c: CityData) => c.slug === citySlug);
        
        if (foundCity) {
          setCity(foundCity);
          setTaxiServices(foundCity.taxiServices || []);
        } else {
          toast({
            title: 'Chyba',
            description: 'Mesto nebolo nájdené',
            variant: 'destructive',
          });
          navigate('/admin/dashboard');
        }
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

  const handleAddService = () => {
    setTaxiServices([...taxiServices, { name: '', website: '', phone: '' }]);
  };

  const handleRemoveService = (index: number) => {
    setTaxiServices(taxiServices.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof TaxiService, value: string) => {
    const updated = [...taxiServices];
    updated[index] = { ...updated[index], [field]: value };
    setTaxiServices(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          citySlug,
          taxiServices: taxiServices.filter(s => s.name.trim() !== ''),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Úspech',
          description: 'Dáta boli úspešne uložené',
        });
        navigate('/admin/dashboard');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa uložiť dáta',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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

  if (!city) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/admin/dashboard')} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Späť
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{city.name}</h1>
              <p className="text-sm text-gray-600">{city.region}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Taxislužby v meste {city.name}</span>
              <Button onClick={handleAddService}>
                <Plus className="w-4 h-4 mr-2" />
                Pridať službu
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {taxiServices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Žiadne taxislužby. Kliknite na "Pridať službu" pre pridanie novej.</p>
              </div>
            ) : (
              taxiServices.map((service, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Taxislužba #{index + 1}</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveService(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>Názov *</Label>
                      <Input
                        id={`name-${index}`}
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                        placeholder="Napr. Taxi XYZ"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`phone-${index}`}>Telefón</Label>
                      <Input
                        id={`phone-${index}`}
                        value={service.phone || ''}
                        onChange={(e) => handleServiceChange(index, 'phone', e.target.value)}
                        placeholder="+421 XXX XXX XXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`website-${index}`}>Webová stránka</Label>
                      <Input
                        id={`website-${index}`}
                        value={service.website || ''}
                        onChange={(e) => handleServiceChange(index, 'website', e.target.value)}
                        placeholder="https://example.com"
                        type="url"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                Zrušiť
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Ukladám...' : 'Uložiť zmeny'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
