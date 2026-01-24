'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSuperadmin } from '@/lib/superadmin';

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
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setState({
            isLoading: false,
            isAdmin: false,
            isOwner: false,
            userId: null,
            userEmail: null,
          });
          return;
        }

        const user = session.user;
        const userIsAdmin = isSuperadmin(user.email);

        // If no partnerSlug provided, just check admin status
        if (!partnerSlug) {
          setState({
            isLoading: false,
            isAdmin: userIsAdmin,
            isOwner: false,
            userId: user.id,
            userEmail: user.email || null,
          });
          return;
        }

        // Check partner ownership
        const { data: partner } = await supabase
          .from('partners')
          .select('id, user_id, slug')
          .eq('slug', partnerSlug)
          .single();

        const isOwner = partner?.user_id === user.id || userIsAdmin;

        setState({
          isLoading: false,
          isAdmin: userIsAdmin,
          isOwner,
          userId: user.id,
          userEmail: user.email || null,
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
