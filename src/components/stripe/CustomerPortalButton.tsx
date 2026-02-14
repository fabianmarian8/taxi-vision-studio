'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CustomerPortalButtonProps {
  customerId: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CustomerPortalButton({
  customerId,
  className,
  variant = 'outline'
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodarilo sa otvoriť portál';
      console.error('Portal error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        disabled={loading || !customerId}
        variant={variant}
        className={className}
      >
        {loading ? 'Načítavam...' : 'Spravovať predplatné'}
      </Button>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}