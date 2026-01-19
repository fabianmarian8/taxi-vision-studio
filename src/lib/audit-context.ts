import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Nastaví audit kontext pre aktuálnu databázovú session.
 * Volať PRED akýmkoľvek INSERT/UPDATE/DELETE, aby trigger zachytil user info.
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
