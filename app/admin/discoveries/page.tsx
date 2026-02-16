'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft, Check, X, Clock, Phone, Globe, MapPin, Loader2,
  Search, ChevronLeft, ChevronRight, Ban, Play, ChevronDown,
} from 'lucide-react';

interface Discovery {
  id: string;
  discovery_hash: string;
  city_slug: string;
  city_name: string;
  region: string;
  name: string;
  phone: string | null;
  phone_normalized: string | null;
  website: string | null;
  address: string | null;
  source: string;
  source_url: string | null;
  search_query: string | null;
  confidence_score: number;
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'already_exists';
  is_nonstop: boolean;
  batch_id: string | null;
  discovered_at: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

type TabStatus = 'new' | 'approved' | 'rejected' | 'already_exists';

const TABS: { key: TabStatus; label: string; color: string }[] = [
  { key: 'new', label: 'Nove', color: 'amber' },
  { key: 'approved', label: 'Schvalene', color: 'emerald' },
  { key: 'rejected', label: 'Odmietnute', color: 'red' },
  { key: 'already_exists', label: 'Uz existuju', color: 'gray' },
];

export default function DiscoveriesPage() {
  const router = useRouter();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('new');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newCount, setNewCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [regionFilter, setRegionFilter] = useState('');
  const limit = 50;

  // Run Discovery panel state
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [allCities, setAllCities] = useState<{ name: string; slug: string; region: string; serviceCount: number }[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [selectedCitySlug, setSelectedCitySlug] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    cityName?: string;
    stats?: { newDiscoveries: number; duplicatesSkipped: number; braveApiCalls: number; errors: number };
    error?: string;
  } | null>(null);

  const fetchDiscoveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: String(page),
        limit: String(limit),
      });
      if (regionFilter) params.set('region', regionFilter);

      const response = await fetch(`/api/admin/discoveries?${params}`);
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      setDiscoveries(data.discoveries || []);
      setTotal(data.total || 0);
      setNewCount(data.newCount || 0);
    } catch (error) {
      console.error('Error fetching discoveries:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, regionFilter, router]);

  useEffect(() => {
    fetchDiscoveries();
  }, [fetchDiscoveries]);

  // Load cities for the run panel
  useEffect(() => {
    if (!showRunPanel || allCities.length > 0) return;
    fetch('/api/admin/cities')
      .then(res => res.json())
      .then(data => {
        if (data.cities) {
          setAllCities(
            data.cities.map((c: { name: string; slug: string; region: string; taxiServices?: unknown[] }) => ({
              name: c.name,
              slug: c.slug,
              region: c.region,
              serviceCount: c.taxiServices?.length || 0,
            }))
          );
        }
      })
      .catch(err => console.error('Failed to load cities:', err));
  }, [showRunPanel, allCities.length]);

  const handleRunDiscovery = async () => {
    if (!selectedCitySlug || isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    try {
      const response = await fetch('/api/admin/discovery-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citySlug: selectedCitySlug }),
      });
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setRunResult({ success: true, cityName: data.cityName, stats: data.stats });
        // Switch to "new" tab and refresh
        setActiveTab('new');
        fetchDiscoveries();
      } else {
        setRunResult({ success: false, error: data.error || 'Neznama chyba' });
      }
    } catch (error) {
      setRunResult({ success: false, error: error instanceof Error ? error.message : 'Chyba spojenia' });
    } finally {
      setIsRunning(false);
    }
  };

  const filteredCities = allCities.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [activeTab, regionFilter]);

  const handleAction = async (ids: string[], status: string) => {
    setProcessingIds(prev => new Set([...prev, ...ids]));
    try {
      const response = await fetch('/api/admin/discoveries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchDiscoveries();
      }
    } catch (error) {
      console.error('Error updating discovery:', error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === discoveries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(discoveries.map(d => d.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  const regions = [
    'Bratislavsky', 'Trnavsky', 'Trenciansky', 'Nitriansky',
    'Zilinsky', 'Banskobystricky', 'Presovsky', 'Kosicky',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Spat
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Discovery Agent</h1>
            {newCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {newCount} novych
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRunPanel(!showRunPanel)}
            className={showRunPanel ? 'border-blue-500 text-blue-600' : ''}
          >
            <Play className="h-4 w-4 mr-2" />
            Spustit vyhladavanie
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showRunPanel ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Run Discovery Panel */}
      {showRunPanel && (
        <div className="border-b bg-blue-50/50">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Hladat mesto</label>
                <input
                  type="text"
                  placeholder="Zadajte nazov..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm w-48"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Mesto</label>
                <select
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm w-72"
                  value={selectedCitySlug}
                  onChange={(e) => setSelectedCitySlug(e.target.value)}
                >
                  <option value="">-- Vyberte mesto --</option>
                  {filteredCities.map(c => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.serviceCount} taxisluzieb)
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleRunDiscovery}
                disabled={!selectedCitySlug || isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vyhladavam...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Spustit
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Zdroje: Brave Search + Azet.sk | Vysledky sa zobrazia v tabe &quot;Nove&quot;
            </p>

            {/* Result feedback */}
            {runResult?.success && runResult.stats && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-md text-sm border border-emerald-200">
                <strong>{runResult.cityName}</strong>: {runResult.stats.newDiscoveries} novych najdenych,{' '}
                {runResult.stats.duplicatesSkipped} duplikatov preskoceny
                {runResult.stats.errors > 0 && (
                  <span className="text-amber-700"> ({runResult.stats.errors} chyb)</span>
                )}
              </div>
            )}
            {runResult && !runResult.success && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                Vyhladavanie zlyhalo: {runResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? `border-${tab.color}-500 text-${tab.color}-600`
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {tab.key === 'new' && newCount > 0 && (
                  <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded">
                    {newCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Bulk actions */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Region filter */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1.5 bg-background"
            >
              <option value="">Vsetky regiony</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <span className="text-sm text-muted-foreground">
            {total} zaznamov
          </span>

          {/* Bulk actions */}
          {activeTab === 'new' && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium">{selectedIds.size} oznacenych</span>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleAction([...selectedIds], 'approved')}
              >
                <Check className="h-4 w-4 mr-1" />
                Schvalit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleAction([...selectedIds], 'rejected')}
              >
                <X className="h-4 w-4 mr-1" />
                Odmietnut
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction([...selectedIds], 'already_exists')}
              >
                <Ban className="h-4 w-4 mr-1" />
                Uz existuje
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : discoveries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ziadne zaznamy v tejto kategorii</p>
          </div>
        ) : (
          <>
            {/* Select all checkbox */}
            {activeTab === 'new' && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === discoveries.length && discoveries.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-muted-foreground">Oznacit vsetky</span>
              </div>
            )}

            <div className="grid gap-3">
              {discoveries.map((d) => (
                <Card key={d.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {activeTab === 'new' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(d.id)}
                            onChange={() => toggleSelect(d.id)}
                            className="h-4 w-4 mt-1 rounded"
                          />
                        )}
                        <div>
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            {d.name}
                            <span className={`text-xs px-2 py-0.5 rounded font-normal ${
                              d.confidence_score >= 0.8
                                ? 'bg-emerald-100 text-emerald-700'
                                : d.confidence_score >= 0.5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {Math.round(d.confidence_score * 100)}%
                            </span>
                            {d.is_nonstop && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                24/7
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-normal">
                              {d.source}
                            </span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(d.discovered_at)}
                          </p>
                        </div>
                      </div>
                      {activeTab === 'new' && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction([d.id], 'rejected')}
                            disabled={processingIds.has(d.id)}
                          >
                            {processingIds.has(d.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Odmietnut
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleAction([d.id], 'approved')}
                            disabled={processingIds.has(d.id)}
                          >
                            {processingIds.has(d.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Schvalit
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <Link
                          href={`/taxi/${d.city_slug}`}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                        >
                          {d.city_name}
                        </Link>
                        <span className="text-xs">({d.region})</span>
                      </div>
                      {d.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <a href={`tel:${d.phone}`} className="text-blue-600 hover:underline">
                            {d.phone}
                          </a>
                        </div>
                      )}
                      {d.website && (
                        <div className="flex items-center gap-2 text-muted-foreground overflow-hidden">
                          <Globe className="h-4 w-4 shrink-0" />
                          <a
                            href={d.website}
                            className="text-blue-600 hover:underline truncate"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {d.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        </div>
                      )}
                      {d.source_url && (
                        <div className="flex items-center gap-2 text-muted-foreground overflow-hidden">
                          <Search className="h-4 w-4 shrink-0" />
                          <a
                            href={d.source_url}
                            className="text-blue-600 hover:underline truncate"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            zdroj
                          </a>
                        </div>
                      )}
                    </div>

                    {d.reviewed_at && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        Spracovane: {formatDate(d.reviewed_at)}
                        {d.reviewed_by && ` (${d.reviewed_by})`}
                        {d.rejection_reason && (
                          <span className="ml-2 text-red-600">
                            Dovod: {d.rejection_reason}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
