import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PartnerEditor } from './PartnerEditor';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PartnerEditPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/partner/login');
  }

  // Get partner by slug
  const { data: partner, error } = await supabase
    .from('partners')
    .select(`
      *,
      partner_drafts (*)
    `)
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single();

  if (error || !partner) {
    notFound();
  }

  // Get the latest draft or create default data
  const latestDraft = partner.partner_drafts?.[0] || null;

  return (
    <PartnerEditor
      partner={partner}
      initialDraft={latestDraft}
      userEmail={user.email || ''}
    />
  );
}
