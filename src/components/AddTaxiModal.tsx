'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Building2 } from 'lucide-react';

interface AddTaxiModalProps {
  isOpen: boolean;
  onClose: () => void;
  citySlug: string;
  cityName: string;
}

export function AddTaxiModal({ isOpen, onClose, citySlug, cityName }: AddTaxiModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      citySlug,
      cityName,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      description: formData.get('description') as string,
      ico: formData.get('ico') as string,
    };

    try {
      const response = await fetch('/api/taxi-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        form.reset();
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2500);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Nastala chyba pri odosielaní');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Nepodarilo sa odoslať návrh');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-black pr-6 flex items-center gap-2">
            <Plus className="h-6 w-6 text-emerald-600" />
            Pridať taxislužbu
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Chýba tu taxislužba z <strong>{cityName}</strong>? Navrhnite ju a my ju pridáme po overení.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">
              Názov taxislužby *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="napr. Taxi Express"
              required
              minLength={2}
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-bold">
              Telefónne číslo *
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+421 9XX XXX XXX"
              required
              minLength={9}
              maxLength={20}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold">
              Popis služby <span className="text-gray-400 font-normal">(voliteľné)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Krátky popis taxislužby, služby ktoré ponúka..."
              rows={3}
              maxLength={2000}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ico" className="font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              IČO *
            </Label>
            <Input
              id="ico"
              name="ico"
              type="text"
              placeholder="12345678"
              required
              minLength={6}
              maxLength={20}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              IČO slúži na overenie taxislužby. Neuverejňujeme ho.
            </p>
          </div>

          {submitStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg font-medium">
              ✓ Ďakujeme! Návrh bol odoslaný na schválenie.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-medium">
              ✗ {errorMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:flex-1 font-bold h-11"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 font-bold h-11 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Odosielam...
                </>
              ) : (
                'Odoslať návrh'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Tlačidlo pre otvorenie modalu - používa sa v CityPage
interface AddTaxiButtonProps {
  citySlug: string;
  cityName: string;
}

export function AddTaxiButton({ citySlug, cityName }: AddTaxiButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 px-4 text-sm text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-dashed border-gray-200 hover:border-emerald-300"
      >
        <Plus className="h-4 w-4" />
        Chýba tu taxislužba? Pridajte ju
      </button>

      <AddTaxiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        citySlug={citySlug}
        cityName={cityName}
      />
    </>
  );
}
