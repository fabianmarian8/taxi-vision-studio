'use client';

import { useOwnership } from '@/hooks/useOwnership';
import { DeleteTaxiButton } from '@/components/admin/DeleteTaxiButton';

interface AdminControlsProps {
  serviceName: string;
  citySlug: string;
}

/**
 * Client-side admin controls that appear after hydration.
 * Shows delete button only for superadmins.
 */
export function AdminControls({ serviceName, citySlug }: AdminControlsProps) {
  const { isLoading, isAdmin } = useOwnership();

  // Don't render anything while loading or if not admin
  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <DeleteTaxiButton
      serviceName={serviceName}
      citySlug={citySlug}
    />
  );
}
