'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Crown, Star, AlertTriangle } from 'lucide-react';

interface RevenueData {
  mrr: number;
  subscriptions: {
    total: number;
    premium: number;
    partner: number;
  };
  expiring: {
    sevenDays: Subscription[];
    thirtyDays: Subscription[];
  };
  history: MonthlyData[];
  metrics: {
    newThisMonth: number;
    canceledThisMonth: number;
    churnRate: number;
  };
}

interface Subscription {
  id: string;
  taxi_service_name: string;
  city_slug: string;
  plan_type: string;
  current_period_end: string;
  customer_email: string;
}

interface MonthlyData {
  month: string;
  mrr: number;
  premium_count: number;
  partner_count: number;
}

export function RevenueClient() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch('/api/admin/revenue');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Nepodarilo sa nacitat data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const mrrChange = data.history.length >= 2
    ? ((data.history[data.history.length - 1]?.mrr || 0) - (data.history[data.history.length - 2]?.mrr || 0))
    : 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR Card */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Monthly Recurring Revenue</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-700">
              {data.mrr.toFixed(2)} EUR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {mrrChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={mrrChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {mrrChange >= 0 ? '+' : ''}{mrrChange.toFixed(2)} EUR vs minuly mesiac
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Premium Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              Premium predplatne
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{data.subscriptions.premium}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(data.subscriptions.premium * 3.99).toFixed(2)} EUR/mesiac
            </p>
          </CardContent>
        </Card>

        {/* Partner Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Partner predplatne
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{data.subscriptions.partner}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(data.subscriptions.partner * 8.99).toFixed(2)} EUR/mesiac
            </p>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card className={data.metrics.churnRate > 5 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Churn Rate
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {data.metrics.churnRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              +{data.metrics.newThisMonth} novych, -{data.metrics.canceledThisMonth} zrusenych
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Trend (12 mesiacov)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)} EUR`, 'MRR']}
                  labelFormatter={(label) => `Mesiac: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscriptions Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Pocet predplatnych</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="premium_count" name="Premium" fill="#8b5cf6" />
                <Bar dataKey="partner_count" name="Partner" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Subscriptions Alert */}
      {data.expiring.thirtyDays.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Konciace predplatne
            </CardTitle>
            <CardDescription>
              Tieto predplatne konci v najblizsich 30 dnoch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 7 days */}
              {data.expiring.sevenDays.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">
                    Do 7 dni ({data.expiring.sevenDays.length})
                  </h4>
                  <div className="grid gap-2">
                    {data.expiring.sevenDays.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-200"
                      >
                        <div>
                          <p className="font-medium">{sub.taxi_service_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sub.city_slug} | {sub.customer_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.plan_type === 'partner'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {sub.plan_type.toUpperCase()}
                          </span>
                          <p className="text-sm text-red-600 mt-1">
                            {new Date(sub.current_period_end).toLocaleDateString('sk-SK')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8-30 days */}
              {data.expiring.thirtyDays.filter(
                (s) => !data.expiring.sevenDays.find((ss) => ss.id === s.id)
              ).length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">
                    8-30 dni ({data.expiring.thirtyDays.length - data.expiring.sevenDays.length})
                  </h4>
                  <div className="grid gap-2">
                    {data.expiring.thirtyDays
                      .filter((s) => !data.expiring.sevenDays.find((ss) => ss.id === s.id))
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="flex justify-between items-center p-3 bg-white rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{sub.taxi_service_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {sub.city_slug} | {sub.customer_email}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              sub.plan_type === 'partner'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {sub.plan_type.toUpperCase()}
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(sub.current_period_end).toLocaleDateString('sk-SK')}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {data.subscriptions.total === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Zatial ziadne predplatne. Data sa objavia po prvej platbe cez Stripe.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
