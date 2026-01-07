'use client';

import { useState } from 'react';
import { UserCheck, X, Send, Loader2 } from 'lucide-react';

interface OwnerClaimButtonProps {
  serviceName: string;
  servicePhone?: string;
  cityName: string;
  citySlug: string;
}

export function OwnerClaimButton({
  serviceName,
  servicePhone,
  cityName,
  citySlug
}: OwnerClaimButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/owner-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName,
          servicePhone,
          cityName,
          citySlug,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Nepodarilo sa odoslať žiadosť');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({ ownerName: '', ownerPhone: '', ownerEmail: '', message: '' });
      }, 2000);
    } catch {
      setError('Nastala chyba. Skúste to znova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-yellow transition-colors"
      >
        <UserCheck className="h-3 w-3" />
        <span>Ste majiteľ?</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                Ste majiteľ taxislužby?
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Žiadosť odoslaná!
                  </h4>
                  <p className="text-gray-600">
                    Ozveme sa vám čo najskôr.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Taxislužba:</strong> {serviceName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Mesto:</strong> {cityName}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Vyplňte formulár a my vás budeme kontaktovať ohľadom úpravy údajov vašej taxislužby.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vaše meno *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow"
                        placeholder="Ján Novák"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefón *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.ownerPhone}
                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow"
                        placeholder="+421 9XX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow"
                        placeholder="vas@email.sk"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Čo chcete upraviť?
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-yellow focus:border-primary-yellow resize-none"
                        placeholder="Napr. zmena telefónneho čísla, názvu, pridanie loga..."
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-yellow hover:bg-primary-yellow/90 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Odosielam...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Odoslať žiadosť
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
