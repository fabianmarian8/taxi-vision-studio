import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Nastaví audit kontext pre aktuálnu databázovú session.
 * Volať PRED akýmkoľvek INSERT/UPDATE/DELETE, aby trigger zachytil user info.
 *
 * Teraz používa session variables namiesto závislosti na auth.uid(),
 * čo umožňuje fungovanie aj pri service role.
 */
export async function setAuditContext(
  supabase: SupabaseClient,
  userId: string | null,
  userEmail: string | null,
  ipAddress?: string | null
): Promise<void> {
  try {
    await supabase.rpc('set_audit_context', {
      p_user_id: userId,
      p_user_email: userEmail,
      p_ip_address: ipAddress || null
    });
  } catch (error) {
    // Don't fail the operation if audit context fails
    console.error('[setAuditContext] Error:', error);
  }
}

/**
 * Helper pre nastavenie audit contextu z aktuálneho auth usera.
 * Pre jednoduché použitie v API endpointoch.
 */
export async function setAuditContextFromAuth(
  supabase: SupabaseClient,
  ipAddress?: string | null
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await setAuditContext(supabase, user.id, user.email || null, ipAddress);
    }
  } catch (error) {
    console.error('[setAuditContextFromAuth] Error:', error);
  }
}