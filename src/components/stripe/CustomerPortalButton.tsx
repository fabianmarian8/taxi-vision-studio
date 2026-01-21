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

  const handleClick = async () => {
    setLoading(true);
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
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Portal error:', error);
      // In a real app, you might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || !customerId}
      variant={variant}
      className={className}
    >
      {loading ? 'Načítavam...' : 'Spravovať predplatné'}
    </Button>
  );
}