/**
 * Superadmin utilities
 * Centralized superadmin check for the entire application
 */

// Superadmin emails - can access ALL partner/admin features
export const SUPERADMIN_EMAILS = [
  'fabianmarian8@gmail.com',
  'fabianmarian8@users.noreply.github.com',
];

/**
 * Check if email belongs to a superadmin
 */
export function isSuperadmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.includes(email.toLowerCase());
}
