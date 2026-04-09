'use client';

import { ReactNode, useState, useEffect } from 'react';
import { InlineEditorProvider, type DraftData } from './InlineEditorProvider';
import type { PlanTier } from '@/lib/tier-config';

interface PartnerPageWrapperProps {
  children: ReactNode;
  /** @deprecated Server-side ownership not used — session bootstrap handles this */
  isOwner?: boolean;
  initialData: Partial<DraftData>;
  partnerId?: string | null;
  draftId?: string | null;
  partnerSlug?: string;
  citySlug?: string;
  planTier?: PlanTier;
}

interface SessionState {
  status: 'loading' | 'ready';
  isOwner: boolean;
  partnerId: string | null;
  draftId: string | null;
  planTier: PlanTier | undefined;
}

/**
 * Klientský wrapper pre partner stránky.
 * Volá server bootstrap endpoint pre ownership + draft resolution.
 * Editor sa mountne až keď server odpovie — žiadne race conditions.
 */
export function PartnerPageWrapper({
  children,
  initialData,
  partnerSlug,
  citySlug,
  planTier: serverPlanTier,
}: PartnerPageWrapperProps) {
  const [session, setSession] = useState<SessionState>({
    status: 'loading',
    isOwner: false,
    partnerId: null,
    draftId: null,
    planTier: serverPlanTier,
  });

  useEffect(() => {
    if (!partnerSlug) {
      setSession(s => ({ ...s, status: 'ready' }));
      return;
    }

    async function bootstrap() {
      try {
        const response = await fetch(`/api/partner/inline-edit/session/${encodeURIComponent(partnerSlug!)}`);
        const data = await response.json();

        if (data.isOwner) {
          setSession({
            status: 'ready',
            isOwner: true,
            partnerId: data.partnerId,
            draftId: data.draftId,
            planTier: data.planTier || serverPlanTier,
          });
        } else {
          setSession(s => ({ ...s, status: 'ready', isOwner: false }));
        }
      } catch (error) {
        console.error('[PartnerPageWrapper] Session bootstrap error:', error);
        setSession(s => ({ ...s, status: 'ready', isOwner: false }));
      }
    }

    bootstrap();
  }, [partnerSlug, serverPlanTier]);

  // Always render children — editor overlay is conditional on session.isOwner
  return (
    <InlineEditorProvider
      isOwner={session.status === 'ready' ? session.isOwner : false}
      initialData={initialData}
      partnerId={session.partnerId}
      draftId={session.draftId}
      partnerSlug={partnerSlug}
      citySlug={citySlug}
      planTier={session.planTier}
    >
      {children}
    </InlineEditorProvider>
  );
}
