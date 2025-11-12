import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X, Edit2, Search } from 'lucide-react';

interface TaxiServiceSuggestion {
  id: string;
  citySlug: string;
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<TaxiServiceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login'); return; }
    loadSuggestions();
  }, [navigate]);

  const normalize = (raw: any): TaxiServiceSuggestion | null => {
    const id = String(raw?.id ?? raw?._id ?? raw?.uid ?? '');
    const citySlug = String(raw?.citySlug ?? raw?.city ?? '');
    const name = String(raw?.name ?? raw?.title ?? raw?.company ?? '').trim();
    const website = raw?.website ?? raw?.url ?? raw?.link ?? undefined;
    const phone = raw?.phone ?? raw?.phoneNumber ?? raw?.tel ?? undefined;
    const address = raw?.address ?? raw?.formatted_address ?? raw?.addr ?? undefined;
    const createdAt = raw?.createdAt ?? raw?.created_at ?? undefined;
    if (!id || !citySlug) return null;
    return { id, citySlug, name, website, phone, address, createdAt };
  };

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/suggestions', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!(response.status >= 200 && response.status < 300)) throw new Error('Load failed');
      const data = await response.json();
      const items = Array.isArray(data?.suggestions) ? data.suggestions : Array.isArray(data) ? data : [];
      const normalized = items
        .map(normalize)
        .filter((x): x is TaxiServiceSuggestion => Boolean(x));
      setSuggestions(normalized);
    } catch {
      toast({ title: 'Chyba', description: 'Nepodarilo sa načítať návrhy', variant: 'destructive' });
      setSuggestions([]);
    } finally { setIsLoading(false); }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/suggestions-manage', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'delete', suggestionId }) });
      if (!(response.status >= 200 && response.status < 300)) throw new Error('Reject failed');
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      toast({ title: 'Úspech', description: 'Návrh bol zamietnutý' });
    } catch {
      toast({ title: 'Chyba', description: 'Nepodarilo sa zamietnuť návrh', variant: 'destructive' });
    }
  };

  const grouped = suggestions.reduce((acc: Record<string, TaxiServiceSuggestion[]>, s) => {
    (acc[s.citySlug] ||= []).push(s);
    return acc;
  }, {});

  const display = (items: TaxiServiceSuggestion[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(s => [s.name, s.website, s.phone, s.address].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  };

  const approveCity = (citySlug: string) => {
    const items = grouped[citySlug] || [];
    const suggestionIds = items.map(s => s.id).join(',');
    const payload = encodeURIComponent(JSON.stringify(items.map(({ name, website, phone }) => ({ name, website, phone }))));
    navigate(`/admin/city/${citySlug}?suggestions=${payload}&suggestionIds=${suggestionIds}`);
  };

  if (isLoading) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Načítavam návrhy...</p></div></div>);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button onClick={() => navigate('/admin/dashboard')} variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Späť</Button>
            <div className="flex items-center gap-2">
              <Input placeholder="Filtrovať" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">Návrhy taxislužieb</h1>
        <p className="text-sm text-gray-600 mb-6">{suggestions.length} čakajúcich návrhov</p>

        {Object.entries(grouped).map(([city, items]) => {
          const list = display(items);
          return (
            <div key={city} className="mb-8 border rounded-xl bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="font-semibold">{city}</h2>
                <Button size="sm" onClick={() => approveCity(city)}>Schváliť všetky ({list.length})</Button>
              </div>
              <div className="divide-y">
                {list.map((s) => (
                  <div key={s.id} className="p-4 flex items-start justify-between">
                    <div>
                      <div className="font-medium">{s.name || '—'}</div>
                      {s.phone && <div className="text-sm text-gray-600">{s.phone}</div>}
                      {s.website && <div className="text-sm text-blue-700">{s.website}</div>}
                      {s.address && <div className="text-xs text-gray-500">{s.address}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => approveCity(s.citySlug)} title="Schváliť a upraviť"><Check className="w-4 h-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => navigate('/admin/city/' + s.citySlug)} title="Upraviť mesto"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleReject(s.id)} title="Zamietnuť"><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
