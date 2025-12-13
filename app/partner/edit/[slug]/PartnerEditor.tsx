'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Partner, PartnerDraft } from '@/lib/supabase/types';

interface Props {
  partner: Partner & { partner_drafts: PartnerDraft[] };
  initialDraft: PartnerDraft | null;
  userEmail: string;
}

interface FormData {
  company_name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  banner_title: string;
  banner_subtitle: string;
  services: string[];
  social_facebook: string;
  social_instagram: string;
}

export function PartnerEditor({ partner, initialDraft, userEmail }: Props) {
  const [formData, setFormData] = useState<FormData>({
    company_name: initialDraft?.company_name || partner.name || '',
    description: initialDraft?.description || '',
    phone: initialDraft?.phone || '',
    email: initialDraft?.email || '',
    website: initialDraft?.website || '',
    hero_image_url: initialDraft?.hero_image_url || '',
    hero_title: initialDraft?.hero_title || '',
    hero_subtitle: initialDraft?.hero_subtitle || '',
    banner_title: initialDraft?.banner_title || '',
    banner_subtitle: initialDraft?.banner_subtitle || '',
    services: (initialDraft?.services as string[]) || [],
    social_facebook: initialDraft?.social_facebook || '',
    social_instagram: initialDraft?.social_instagram || '',
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'social'>('general');

  const handleChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleServiceToggle = useCallback((service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  }, []);

  const saveDraft = async () => {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    const draftData = {
      partner_id: partner.id,
      status: 'draft' as const,
      ...formData,
      services: formData.services,
    };

    let result;
    if (initialDraft?.id) {
      result = await supabase
        .from('partner_drafts')
        .update(draftData)
        .eq('id', initialDraft.id);
    } else {
      result = await supabase.from('partner_drafts').insert(draftData);
    }

    if (result.error) {
      setMessage({ type: 'error', text: 'Chyba pri ukladaní: ' + result.error.message });
    } else {
      setMessage({ type: 'success', text: 'Zmeny boli uložené ako rozpracované.' });
    }

    setSaving(false);
  };

  const submitForApproval = async () => {
    setSubmitting(true);
    setMessage(null);

    const supabase = createClient();

    const draftData = {
      partner_id: partner.id,
      status: 'pending' as const,
      ...formData,
      services: formData.services,
      submitted_at: new Date().toISOString(),
    };

    let result;
    if (initialDraft?.id) {
      result = await supabase
        .from('partner_drafts')
        .update(draftData)
        .eq('id', initialDraft.id);
    } else {
      result = await supabase.from('partner_drafts').insert(draftData);
    }

    if (result.error) {
      setMessage({ type: 'error', text: 'Chyba pri odosielaní: ' + result.error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Zmeny boli odoslané na schválenie. O výsledku vás budeme informovať emailom.',
      });
    }

    setSubmitting(false);
  };

  const availableServices = [
    'Letisko',
    'Nonstop',
    'Rozvoz jedla',
    'Kuriérska služba',
    'VIP preprava',
    'Platba kartou',
    'Klimatizácia',
    'Detská sedačka',
    'Preprava zvierat',
    'Bezbariérová preprava',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/partner"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Späť
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg font-semibold text-gray-900">{partner.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Ukladám...' : 'Uložiť rozpracované'}
              </button>
              <button
                onClick={submitForApproval}
                disabled={submitting}
                className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Odosielam...' : 'Odoslať na schválenie'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Main content with split view */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'general', label: 'Základné info' },
                  { id: 'hero', label: 'Hero sekcia' },
                  { id: 'social', label: 'Sociálne siete' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Názov taxislužby
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Popis
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Krátky popis vašej taxislužby..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefón
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+421 xxx xxx xxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webová stránka
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Služby
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableServices.map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleServiceToggle(service)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            formData.services.includes(service)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hero obrázok (URL)
                    </label>
                    <input
                      type="url"
                      value={formData.hero_image_url}
                      onChange={(e) => handleChange('hero_image_url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Odporúčaná veľkosť: 1920x1080px
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nadpis
                    </label>
                    <input
                      type="text"
                      value={formData.hero_title}
                      onChange={(e) => handleChange('hero_title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Vaša spoľahlivá taxislužba"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Podnadpis
                    </label>
                    <input
                      type="text"
                      value={formData.hero_subtitle}
                      onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Profesionálna preprava 24/7"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Banner v zozname</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Názov v banneri
                        </label>
                        <input
                          type="text"
                          value={formData.banner_title}
                          onChange={(e) => handleChange('banner_title', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Podtitul v banneri
                        </label>
                        <input
                          type="text"
                          value={formData.banner_subtitle}
                          onChange={(e) => handleChange('banner_subtitle', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        facebook.com/
                      </span>
                      <input
                        type="text"
                        value={formData.social_facebook}
                        onChange={(e) => handleChange('social_facebook', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="vase-taxi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        value={formData.social_instagram}
                        onChange={(e) => handleChange('social_instagram', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="vase_taxi"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Náhľad zmien
              </h3>
            </div>
            <div className="p-6">
              {/* Hero Preview */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Hero sekcia</h4>
                <div
                  className="relative rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800 aspect-video"
                  style={
                    formData.hero_image_url
                      ? { backgroundImage: `url(${formData.hero_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : {}
                  }
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-xl font-bold mb-1">
                        {formData.hero_title || formData.company_name || 'Názov taxislužby'}
                      </h2>
                      <p className="text-sm opacity-90">
                        {formData.hero_subtitle || 'Podnadpis'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Preview */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Základné info</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-gray-900">{formData.company_name || 'Názov'}</p>
                  {formData.description && (
                    <p className="text-sm text-gray-600">{formData.description}</p>
                  )}
                  {formData.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tel:</span> {formData.phone}
                    </p>
                  )}
                  {formData.email && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {formData.email}
                    </p>
                  )}
                  {formData.website && (
                    <p className="text-sm text-purple-600">{formData.website}</p>
                  )}
                </div>
              </div>

              {/* Services Preview */}
              {formData.services.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Služby</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.services.map((service) => (
                      <span
                        key={service}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Preview */}
              {(formData.social_facebook || formData.social_instagram) && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Sociálne siete</h4>
                  <div className="flex gap-3">
                    {formData.social_facebook && (
                      <span className="text-sm text-blue-600">Facebook: /{formData.social_facebook}</span>
                    )}
                    {formData.social_instagram && (
                      <span className="text-sm text-pink-600">Instagram: @{formData.social_instagram}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
