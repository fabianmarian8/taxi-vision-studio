import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Search, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaxiResult {
  name: string;
  url: string;
  phone: string;
}

const SLOVAK_CITIES = [
  'Bratislava',
  'Košice', 
  'Prešov',
  'Žilina',
  'Banská Bystrica',
  'Nitra',
  'Trnava',
  'Martin',
  'Trenčín',
  'Poprad',
  'Prievidza',
  'Zvolen',
];

export default function TaxiScraperTool() {
  const [city, setCity] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TaxiResult[]>([]);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!city) {
      toast({
        title: 'Chyba',
        description: 'Prosím vyber mesto',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/taxi-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city, limit }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Chyba pri vyhľadávaní');
      }

      if (data.success) {
        setResults(data.results);
        toast({
          title: 'Úspech!',
          description: `Našlo sa ${data.count} taxislužieb v meste ${city}`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodarilo sa vyhľadať taxislužby';
      setError(errorMessage);
      toast({
        title: 'Chyba',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const csv = [
      ['Názov', 'Web', 'Telefón'],
      ...results.map(r => [r.name, r.url, r.phone])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taxisluzby-${city}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Export úspešný',
      description: 'CSV súbor bol stiahnutý',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Search className="w-8 h-8" />
            Automatické Vyhľadávanie Taxislužieb
          </CardTitle>
          <CardDescription>
            Nájdi a overte taxislužby v akomkoľvek slovenskom meste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulár */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mesto</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyber mesto" />
                </SelectTrigger>
                <SelectContent>
                  {SLOVAK_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Počet výsledkov (1-20)</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={limit}
                onChange={(e) => setLimit(Math.min(20, Math.max(1, parseInt(e.target.value) || 10)))}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading || !city}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vyhľadávam...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Vyhľadať
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Prehľadávam Google výsledky...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 border border-destructive bg-destructive/10 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">
                    Nájdené taxislužby ({results.length})
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Názov</TableHead>
                      <TableHead className="w-[35%]">Webstránka</TableHead>
                      <TableHead className="w-[25%]">Telefón</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.name}</TableCell>
                        <TableCell>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {new URL(result.url).hostname.replace('www.', '')}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`tel:${result.phone}`}
                            className="text-primary hover:underline"
                          >
                            {result.phone}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Vyber mesto a klikni na "Vyhľadať" pre zobrazenie výsledkov</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
