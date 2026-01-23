'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, X, Clock, Building2, Phone, MapPin, FileText, Loader2 } from 'lucide-react';

interface TaxiSubmission {
  id: string;
  city_slug: string;
  city_name: string;
  name: string;
  phone: string;
  description: string | null;
  ico: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
}

export default function TaxiSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<TaxiSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSubmissions = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/taxi-submissions?status=${status}`);
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/taxi-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });

      if (response.ok) {
        // Refresh list
        fetchSubmissions(activeTab);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setProcessingId(null);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Späť
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Návrhy taxislužieb</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {(['pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? tab === 'pending'
                      ? 'border-amber-500 text-amber-600'
                      : tab === 'approved'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-red-500 text-red-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'pending' && '⏳ Čakajúce'}
                {tab === 'approved' && '✓ Schválené'}
                {tab === 'rejected' && '✗ Odmietnuté'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Žiadne návrhy v tejto kategórii</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {submission.name}
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-normal ${
                            submission.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : submission.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {submission.status}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pridané: {formatDate(submission.created_at)}
                      </p>
                    </div>
                    {submission.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleAction(submission.id, 'rejected')}
                          disabled={processingId === submission.id}
                        >
                          {processingId === submission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Odmietnuť
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAction(submission.id, 'approved')}
                          disabled={processingId === submission.id}
                        >
                          {processingId === submission.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Schváliť
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        <Link
                          href={`/taxi/${submission.city_slug}`}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                        >
                          {submission.city_name}
                        </Link>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${submission.phone}`} className="text-blue-600 hover:underline">
                        {submission.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>IČO: {submission.ico}</span>
                    </div>
                    {submission.description && (
                      <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span>{submission.description}</span>
                      </div>
                    )}
                  </div>

                  {submission.reviewed_at && (
                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                      Spracované: {formatDate(submission.reviewed_at)}
                      {submission.reviewed_by && ` (${submission.reviewed_by})`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
