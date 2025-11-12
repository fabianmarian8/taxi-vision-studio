import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [originalServices, setOriginalServices] = useState<TaxiService[]>([]);
  const [taxiServices, setTaxiServices] = useState<TaxiService[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login'); return; }
    loadCityData();
  }, [citySlug, navigate]);

  // Po návrate z AdminSuggestions pridaj návrhy z URL parametrov
  useEffect(() => {
    if (!city) return;
    const params = new URLSearchParams(window.location.search);
    const suggestionsParam = params.get('suggestions');
    const suggestionIdsParam = params.get('suggestionIds');
    if (suggestionsParam) {
      try {
        const newServices: TaxiService[] = JSON.parse(decodeURIComponent(suggestionsParam));
        const updated = [...taxiServices, ...newServices];
        setTaxiServices(updated);
        checkForChanges(updated);
        if (suggestionIdsParam) { sessionStorage.setItem('pendingSuggestionIds', suggestionIdsParam); }
        toast({ title: '✅ Návrhy pridané lokálne', description: 'Pridaných ' + newServices.length + ' návrhov. Skontrolujte a uložte.' });
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        toast({ title: 'Chyba', description: 'Nepodarilo sa načítať návrhy z URL', variant: 'destructive' });
      }
    }
  }, [city, taxiServices.length]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadCityData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin-data', { headers: { 'Authorization': 'Bearer ' + token } });
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        const foundCity = data.cities.find((c: CityData) => c.slug === citySlug);
        if (!foundCity) { toast({ title: 'Chyba', description: 'Mesto nebolo nájdené', variant: 'destructive' }); navigate('/admin/dashboard'); return; }
        setCity(foundCity);
        const services = foundCity.taxiServices || [];
        setTaxiServices(services);
        setOriginalServices(JSON.parse(JSON.stringify(services)));
      } else { throw new Error('Nepodarilo sa načítať dáta'); }
    } catch {
      toast({ title: 'Chyba', description: 'Nepodarilo sa načítať dáta', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const checkForChanges = (services: TaxiService[]) => {
    const changed = JSON.stringify(services) !== JSON.stringify(originalServices);
    setHasUnsavedChanges(changed);
  };

  const handleAddService = () => {
    const updated = [...taxiServices, { name: '', website: '', phone: '' }];
    setTaxiServices(updated);
    checkForChanges(updated);
  };

  const handleRemoveService = (index: number) => {
    const updated = taxiServices.filter((_, i) => i !== index);
    setTaxiServices(updated);
    checkForChanges(updated);
  };

  const handleServiceChange = (index: number, field: keyof TaxiService, value: string) => {
    const updated = [...taxiServices];
    updated[index] = { ...updated[index], [field]: value };
    setTaxiServices(updated);
    checkForChanges(updated);
  };

  // Uložiť + publikovať + odstrániť návrhy zo zoznamu
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) { toast({ title: 'Info', description: 'Žiadne zmeny na uloženie' }); return; }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const saveRes = await fetch('/api/admin-data', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ citySlug: citySlug, taxiServices: taxiServices.filter(s => s.name.trim() !== '') }) });
      if (!(saveRes.status >= 200 && saveRes.status < 300)) throw new Error('Nepodarilo sa uložiť zmeny');
      const publishRes = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } });
      if (!(publishRes.status >= 200 && publishRes.status < 300)) { const errData: any = await publishRes.json().catch(() => ({})); throw new Error(errData.message || 'Nepodarilo sa publikovať zmeny'); }
      const pendingIds = sessionStorage.getItem('pendingSuggestionIds');
      if (pendingIds) {
        const ids = pendingIds.split(',').filter(Boolean);
        for (const id of ids) {
          try {
            await fetch('/api/suggestions', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ suggestionId: id }) });
          } catch (e) { /* ignore */ }
        }
        sessionStorage.removeItem('pendingSuggestionIds');
      }
      setOriginalServices(JSON.parse(JSON.stringify(taxiServices)));
      setHasUnsavedChanges(false);
      toast({ title: '✅ Uložené a publikované', description: 'Zmeny boli uložené a publikované. Deployment prebehne automaticky.' });
    } catch (e) {
      toast({ title: 'Chyba', description: (e as Error)?.message || 'Nepodarilo sa uložiť a publikovať', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleDiscardChanges = () => {
    if (!hasUnsavedChanges) return;
    if (confirm('Naozaj chcete zahodiť všetky neuložené zmeny?')) {
      setTaxiServices(JSON.parse(JSON.stringify(originalServices)));
      setHasUnsavedChanges(false);
      sessionStorage.removeItem('pendingSuggestionIds');
      toast({ title: 'Zmeny zahodené', description: 'Všetky neuložené zmeny boli zahodené' });
    }
  };

  const handleFindNewServices = async () => {
    if (!city) return;
    setIsScrapingInProgress(true);
    try {
      const scraperResponse = await fetch('/api/gbp-scraper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: city.name, limit: 15 }) });
      const scraperData = await scraperResponse.json();
      if (!(scraperResponse.status >= 200 && scraperResponse.status < 300)) { const errorMessage = scraperData.message || scraperData.error || 'Neznáma chyba API'; toast({ title: 'Chyba API', description: errorMessage, variant: 'destructive' }); setIsScrapingInProgress(false); return; }
      if (!scraperData.success || scraperData.count === 0) { toast({ title: 'Informácia', description: 'Nenašli sa žiadne nové taxislužby' }); setIsScrapingInProgress(false); return; }
      const token = localStorage.getItem('adminToken');
      const suggestionsResponse = await fetch('/api/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ action: 'add', citySlug: citySlug, suggestions: scraperData.results }) });
      if (!(suggestionsResponse.status >= 200 && suggestionsResponse.status < 300)) { const suggestionsData: any = await suggestionsResponse.json().catch(() => ({})); const errorMessage = suggestionsData.message || suggestionsData.error || 'Nepodarilo sa uložiť návrhy'; toast({ title: 'Chyba', description: errorMessage, variant: 'destructive' }); setIsScrapingInProgress(false); return; }
      const result = await suggestionsResponse.json();
      if (result.added === 0) { toast({ title: 'Informácia', description: 'Našlo sa ' + scraperData.count + ' výsledkov, ale všetky sú už v databáze (' + result.skipped + ' duplicít).' }); }
      else { toast({ title: 'Úspech', description: 'Našlo sa ' + scraperData.count + ' výsledkov. Pridaných ' + result.added + ' nových návrhov (' + result.skipped + ' duplicít preskočených).' }); navigate('/admin/suggestions'); }
    } catch (error) { toast({ title: 'Chyba', description: (error as Error)?.message || 'Nepodarilo sa nájsť nové taxislužby', variant: 'destructive' }); }
    finally { setIsScrapingInProgress(false); }
  };

  if (isLoading) { return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Načítavam dáta...</p></div></div>); }
  if (!city) { return null; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/admin/dashboard')} variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Späť</Button>
              <div><h1 className="text-2xl font-bold text-gray-900">{city.name}</h1><p className="text-sm text-gray-600">{city.region}</p></div>
            </div>
            {hasUnsavedChanges && (<div className="flex gap-2"><Button onClick={handleDiscardChanges} variant="outline" size="sm">Zahodiť zmeny</Button><Button onClick={handleSaveChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-700" size="sm">{isSaving ? 'Ukladám...' : 'Uložiť zmeny'}</Button></div>)}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasUnsavedChanges && (<Alert className="mb-6 bg-yellow-50 border-yellow-200"><AlertDescription className="flex items-center justify-between"><div><strong>⚠️ Máte neuložené zmeny</strong><p className="text-sm text-gray-600 mt-1">Zmeny sú uložené len lokálne. Kliknite na "Uložiť zmeny".</p></div></AlertDescription></Alert>)}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Taxislužby v meste {city.name}</span>
              <div className="flex gap-2">
                <Button onClick={handleFindNewServices} variant="outline" disabled={isScrapingInProgress}><Search className="w-4 h-4 mr-2" />{isScrapingInProgress ? 'Hľadám...' : 'Nájsť nové taxislužby'}</Button>
                <Button onClick={handleAddService}><Plus className="w-4 h-4 mr-2" />Pridať službu</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {taxiServices.length === 0 ? (<div className="text-center py-12 text-gray-500"><p>Žiadne taxislužby. Kliknite na "Pridať službu" pre pridanie novej.</p></div>) : (taxiServices.map((service, index) => (<div key={index} className="p-4 border rounded-lg space-y-4 bg-gray-50"><div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Taxislužba #{index + 1}</h3><Button variant="destructive" size="sm" onClick={() => handleRemoveService(index)}><Trash2 className="w-4 h-4" /></Button></div><div className="grid grid-cols-1 gap-4"><div className="space-y-2"><Label htmlFor={'name-' + index}>Názov *</Label><Input id={'name-' + index} value={service.name} onChange={(e) => handleServiceChange(index, 'name', e.target.value)} placeholder="Napr. Taxi XYZ" required /></div><div className="space-y-2"><Label htmlFor={'phone-' + index}>Telefón</Label><Input id={'phone-' + index} value={service.phone || ''} onChange={(e) => handleServiceChange(index, 'phone', e.target.value)} placeholder="+421 XXX XXX XXX" /></div><div className="space-y-2"><Label htmlFor={'website-' + index}>Webová stránka</Label><Input id={'website-' + index} value={service.website || ''} onChange={(e) => handleServiceChange(index, 'website', e.target.value)} placeholder="www.example.com alebo https://example.com" type="url" /><p className="text-xs text-gray-500">Môžete zadať s protokolom (https://) alebo bez neho (www.example.com)</p></div></div></div>)))}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"><h4 className="font-semibold text-blue-900 mb-2">💡 Ako to funguje?</h4><ul className="text-sm text-blue-800 space-y-1"><li>• Upravujte taxislužby lokálne vo vašom prehliadači</li><li>• Môžete upraviť viacero taxislužieb naraz</li><li>• Keď ste hotový, kliknite na "Uložiť zmeny"</li><li>• Zmeny sa automaticky publikujú a spustí sa nový deploy</li></ul></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
