'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OwnershipState {
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  userId: string | null;
  userEmail: string | null;
}

/**
 * Client-side hook for checking user ownership/admin status.
 * Safe to use in ISR/static pages - runs after hydration.
 *
 * Uses server-side API to check superadmin status because
 * SUPERADMIN_EMAILS env var is not available on client.
 */
export function useOwnership(partnerSlug?: string) {
  const [state, setState] = useState<OwnershipState>({
    isLoading: true,
    isAdmin: false,
    isOwner: false,
    userId: null,
    userEmail: null,
  });

  useEffect(() => {
    async function checkOwnership() {
      try {
        // Check superadmin status via server API
        // This is necessary because SUPERADMIN_EMAILS is server-only
        const adminResponse = await fetch('/api/auth/check-superadmin');
        const adminData = await adminResponse.json();

        const userIsAdmin = adminData.isAdmin === true;
        const userId = adminData.userId || null;
        const userEmail = adminData.email || null;

        // If not logged in
        if (!userId) {
          setState({
            isLoading: false,
            isAdmin: false,
            isOwner: false,
            userId: null,
            userEmail: null,
          });
          return;
        }

        // If no partnerSlug provided, just return admin status
        if (!partnerSlug) {
          setState({
            isLoading: false,
            isAdmin: userIsAdmin,
            isOwner: false,
            userId,
            userEmail,
          });
          return;
        }

        // Check partner ownership
        const supabase = createClient();
        const { data: partner } = await supabase
          .from('partners')
          .select('id, user_id, slug')
          .eq('slug', partnerSlug)
          .single();

        const isOwner = partner?.user_id === userId || userIsAdmin;

        setState({
          isLoading: false,
          isAdmin: userIsAdmin,
          isOwner,
          userId,
          userEmail,
        });
      } catch (error) {
        console.error('[useOwnership] Error:', error);
        setState({
          isLoading: false,
          isAdmin: false,
          isOwner: false,
          userId: null,
          userEmail: null,
        });
      }
    }

    checkOwnership();
  }, [partnerSlug]);

  return state;
}
