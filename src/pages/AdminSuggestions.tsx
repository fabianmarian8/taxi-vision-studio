import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X, Edit2, CheckCheck } from 'lucide-react';
import type { Suggestion, SuggestionsData } from '@/types/suggestions';

interface GroupedSuggestions {
  [citySlug: string]: {
    cityName: string;
    suggestions: Suggestion[];
  };
}

export default function AdminSuggestions() {
  const [suggestionsData, setSuggestionsData] = useState<SuggestionsData | null>(null);
  const [groupedSuggestions, setGroupedSuggestions] = useState<GroupedSuggestions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; phone: string; website: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    loadSuggestions();
  }, [navigate]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: SuggestionsData = await response.json();
        setSuggestionsData(data);

        // Načítaj dáta miest pre zobrazenie názvov
        const citiesResponse = await fetch('/api/admin-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();

          // Zoskup návrhy podľa miest
          const grouped: GroupedSuggestions = {};

          data.suggestions
            .filter((s) => s.status === 'pending')
            .forEach((suggestion) => {
              const city = citiesData.cities.find((c: any) => c.slug === suggestion.citySlug);
              if (city) {
                if (!grouped[suggestion.citySlug]) {
                  grouped[suggestion.citySlug] = {
                    cityName: city.name,
                    suggestions: []
                  };
                }
                grouped[suggestion.citySlug].suggestions.push(suggestion);
              }
            });

          setGroupedSuggestions(grouped);
        }
      } else {
        throw new Error('Failed to load suggestions');
      }
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať návrhy',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // NOVÁ FUNKCIA: Schváliť a presmerovať na AdminEditCity
  const handleApprove = async (suggestionId: string) => {
    const suggestion = Object.values(groupedSuggestions)
      .flatMap((g) => g.suggestions)
      .find((s) => s.id === suggestionId);

    if (!suggestion) return;

    // Presmeruj na AdminEditCity s návrhom v URL parametroch
    const suggestionParam = encodeURIComponent(JSON.stringify([suggestion.taxiService]));
    navigate(`/admin/edit/${suggestion.citySlug}?suggestions=${suggestionParam}&suggestionIds=${suggestionId}`);
  };

  const handleReject = async (suggestionId: string) => {
    setProcessingIds((prev) => new Set(prev).add(suggestionId));

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/suggestions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          suggestionId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Úspech',
          description: 'Návrh bol zamietnutý',
        });
        await loadSuggestions();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa zamietnuť návrh',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    }
  };

  // NOVÁ FUNKCIA: Bulk schválenie - presmerovanie s viacerými návrhmi
  const handleBulkApprove = async (citySlug: string) => {
    const suggestions = groupedSuggestions[citySlug]?.suggestions || [];
    
    if (suggestions.length === 0) return;

    const confirmed = confirm(
      `Naozaj chcete schváliť všetkých ${suggestions.length} návrhov pre mesto ${groupedSuggestions[citySlug].cityName}?`
    );

    if (!confirmed) return;

    // Presmeruj na AdminEditCity so všetkými návrhmi
    const taxiServices = suggestions.map((s) => s.taxiService);
    const suggestionIds = suggestions.map((s) => s.id).join(',');
    const suggestionParam = encodeURIComponent(JSON.stringify(taxiServices));
    
    navigate(`/admin/edit/${citySlug}?suggestions=${suggestionParam}&suggestionIds=${suggestionIds}`);
  };

  const startEdit = (suggestion: Suggestion) => {
    setEditingId(suggestion.id);
    setEditForm({
      name: suggestion.taxiService.name,
      phone: suggestion.taxiService.phone || '',
      website: suggestion.taxiService.website || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm || !suggestionsData) return;

    // Nájdi návrh a uprav ho lokálne
    const updatedSuggestions = suggestionsData.suggestions.map((s) => {
      if (s.id === editingId) {
        return {
          ...s,
          taxiService: {
            ...s.taxiService,
            name: editForm.name,
            phone: editForm.phone || null,
            website: editForm.website || null,
          }
        };
      }
      return s;
    });

    // Ulož lokálne zmeny
    setSuggestionsData({
      ...suggestionsData,
      suggestions: updatedSuggestions
    });

    // Reload groupedSuggestions
    await loadSuggestions();

    setEditingId(null);
    setEditForm(null);

    toast({
      title: 'Upravené',
      description: 'Návrh bol lokálne upravený. Nezabudnite ho schváliť.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítavam návrhy...</p>
        </div>
      </div>
    );
  }

  const totalPending = Object.values(groupedSuggestions).reduce(
    (sum, group) => sum + group.suggestions.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/admin/dashboard')} variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Späť
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Návrhy taxislužieb</h1>
                <p className="text-sm text-gray-600">
                  {totalPending} čakajúcich návrhov
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {totalPending === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <p className="text-lg">Žiadne čakajúce návrhy</p>
                <p className="text-sm mt-2">
                  Prejdite na úpravu mesta a kliknite na "Nájsť nové taxislužby"
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSuggestions).map(([citySlug, group]) => (
              <Card key={citySlug}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{group.cityName}</CardTitle>
                    <Button
                      onClick={() => handleBulkApprove(citySlug)}
                      variant="default"
                      size="sm"
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      Schváliť všetky ({group.suggestions.length})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-4 border rounded-lg bg-gray-50 space-y-3"
                      >
                        {editingId === suggestion.id && editForm ? (
                          <div className="space-y-3">
                            <div>
                              <Label>Názov</Label>
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Názov taxislužby"
                              />
                            </div>
                            <div>
                              <Label>Telefón</Label>
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="+421 XXX XXX XXX"
                              />
                            </div>
                            <div>
                              <Label>Webová stránka</Label>
                              <Input
                                value={editForm.website}
                                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                placeholder="www.example.com"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={saveEdit} size="sm">
                                Uložiť
                              </Button>
                              <Button onClick={cancelEdit} variant="outline" size="sm">
                                Zrušiť
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {suggestion.taxiService.name}
                                </h3>
                                {suggestion.taxiService.phone && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    📞 {suggestion.taxiService.phone}
                                  </p>
                                )}
                                {suggestion.taxiService.website && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    🌐 {suggestion.taxiService.website}
                                  </p>
                                )}
                                {suggestion.taxiService.address && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    📍 {suggestion.taxiService.address}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  Pridané: {new Date(suggestion.timestamp).toLocaleString('sk-SK')}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  onClick={() => startEdit(suggestion)}
                                  variant="outline"
                                  size="sm"
                                  disabled={processingIds.has(suggestion.id)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleApprove(suggestion.id)}
                                  variant="default"
                                  size="sm"
                                  disabled={processingIds.has(suggestion.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleReject(suggestion.id)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={processingIds.has(suggestion.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}