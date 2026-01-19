'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditLogEntry {
  id: number;
  table_schema: string;
  table_name: string;
  operation: string;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: Record<string, unknown> | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [filterTable, setFilterTable] = useState<string>('');
  const [filterOperation, setFilterOperation] = useState<string>('');
  const limit = 25;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (filterTable) params.set('table', filterTable);
      if (filterOperation) params.set('operation', filterOperation);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError('Chyba pri načítaní dát');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [offset, filterTable, filterOperation]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const operationColors: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  const formatChangedFields = (changed: Record<string, unknown> | null) => {
    if (!changed) return null;
    return Object.entries(changed).map(([key, value]) => (
      <div key={key} className="text-xs">
        <span className="font-medium">{key}:</span>{' '}
        <span className="text-gray-600">{JSON.stringify(value)}</span>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              ← Späť
            </Link>
            <h1 className="text-2xl font-bold">Audit Log</h1>
          </div>
          <Button onClick={() => fetchLogs()} variant="outline" size="sm">
            Obnoviť
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterTable}
            onChange={(e) => { setFilterTable(e.target.value); setOffset(0); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Všetky tabuľky</option>
            <option value="partners">partners</option>
            <option value="partner_drafts">partner_drafts</option>
          </select>
          <select
            value={filterOperation}
            onChange={(e) => { setFilterOperation(e.target.value); setOffset(0); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Všetky operácie</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <span className="text-sm text-muted-foreground self-center">
            Celkom: {total} záznamov
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Načítavam...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Žiadne záznamy v audit logu
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card
                key={log.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${operationColors[log.operation]}`}>
                          {log.operation}
                        </span>
                        <span className="text-sm font-medium">{log.table_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.user_email || 'Neznámy používateľ'}
                        {log.ip_address && <span className="ml-2 text-xs">({log.ip_address})</span>}
                      </div>
                      {log.changed_fields && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-h-20 overflow-hidden">
                          {formatChangedFields(log.changed_fields)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              variant="outline"
              size="sm"
            >
              ← Predchádzajúce
            </Button>
            <span className="self-center text-sm text-muted-foreground">
              {offset + 1} - {Math.min(offset + limit, total)} z {total}
            </span>
            <Button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              variant="outline"
              size="sm"
            >
              Ďalšie →
            </Button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-sm font-medium ${operationColors[selectedLog.operation]}`}>
                        {selectedLog.operation}
                      </span>
                      {selectedLog.table_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(selectedLog.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Používateľ</p>
                    <p className="text-sm font-medium">{selectedLog.user_email || 'Neznámy'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IP Adresa</p>
                    <p className="text-sm font-medium">{selectedLog.ip_address || 'Neznáma'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="text-sm font-mono text-xs">{selectedLog.user_id || '-'}</p>
                  </div>
                </div>

                {/* Changed Fields */}
                {selectedLog.changed_fields && Object.keys(selectedLog.changed_fields).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Zmenené polia</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.changed_fields, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Old Data */}
                {selectedLog.old_data && (
                  <div>
                    <h4 className="font-medium mb-2">Pôvodné dáta</h4>
                    <div className="bg-red-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* New Data */}
                {selectedLog.new_data && (
                  <div>
                    <h4 className="font-medium mb-2">Nové dáta</h4>
                    <div className="bg-green-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
