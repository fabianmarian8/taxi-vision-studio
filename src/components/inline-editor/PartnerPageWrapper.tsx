'use client';

import { ReactNode, useState, useEffect } from 'react';
import { InlineEditorProvider, type DraftData } from './InlineEditorProvider';
import { createClient } from '@/lib/supabase/client';
import type { PlanTier } from '@/lib/tier-config';

interface PartnerPageWrapperProps {
  children: ReactNode;
  /** @deprecated Use partnerSlug instead - ownership is now checked client-side */
  isOwner?: boolean;
  initialData: Partial<DraftData>;
  partnerId?: string | null;
  draftId?: string | null;
  partnerSlug?: string;
  citySlug?: string;
  planTier?: PlanTier;
}

/**
 * Klientský wrapper pre partner stránky
 * Obaľuje obsah do InlineEditorProvider ak je používateľ vlastníkom
 * Ownership sa kontroluje client-side pre kompatibilitu s ISR
 */
export function PartnerPageWrapper({
  children,
  isOwner: serverIsOwner = false,
  initialData,
  partnerId: initialPartnerId = null,
  draftId: initialDraftId = null,
  partnerSlug,
  citySlug,
  planTier,
}: PartnerPageWrapperProps) {
  const [ownershipState, setOwnershipState] = useState({
    isOwner: serverIsOwner,
    partnerId: initialPartnerId,
    draftId: initialDraftId,
  });

  useEffect(() => {
    // Skip if no partnerSlug to check
    if (!partnerSlug) return;

    async function checkOwnership() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          return;
        }

        const user = session.user;

        // Check superadmin via server API (SUPERADMIN_EMAILS is server-only env var)
        let userIsAdmin = false;
        try {
          const adminResponse = await fetch('/api/auth/check-superadmin');
          const adminData = await adminResponse.json();
          userIsAdmin = adminData.isAdmin === true;
        } catch {
          // Silently fail — non-admin is the safe default
        }

        // Fetch partner data with drafts
        const { data: partner } = await supabase
          .from('partners')
          .select(`
            id,
            user_id,
            slug,
            partner_drafts (
              id,
              status,
              updated_at
            )
          `)
          .eq('slug', partnerSlug)
          .single();

        if (!partner) return;

        const isOwner = partner.user_id === user.id || userIsAdmin;

        if (isOwner) {
          // Find latest draft
          const drafts = (partner.partner_drafts || []) as Array<{ id: string; status: string; updated_at: string | null }>;
          let latestDraft = drafts
            .filter((d) => d.status === 'draft')
            .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0];

          if (!latestDraft) {
            latestDraft = drafts
              .filter((d) => d.status === 'approved')
              .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0];
          }

          setOwnershipState({
            isOwner: true,
            partnerId: partner.id,
            draftId: latestDraft?.id || null,
          });
        }
      } catch (error) {
        console.error('[PartnerPageWrapper] Ownership check error:', error);
      }
    }

    checkOwnership();
  }, [partnerSlug]);

  return (
    <InlineEditorProvider
      isOwner={ownershipState.isOwner}
      initialData={initialData}
      partnerId={ownershipState.partnerId}
      draftId={ownershipState.draftId}
      partnerSlug={partnerSlug}
      citySlug={citySlug}
      planTier={planTier}
    >
      {children}
    </InlineEditorProvider>
  );
}
