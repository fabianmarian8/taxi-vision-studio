/**
 * Superadmin utilities
 * Centralized superadmin check for the entire application
 *
 * Configure via environment variable:
 * SUPERADMIN_EMAILS=email1@example.com,email2@example.com
 */

/**
 * Get superadmin emails from environment variable
 * Cached after first call for performance
 */
let cachedEmails: string[] | null = null;

function getSuperadminEmails(): string[] {
  if (cachedEmails !== null) {
    return cachedEmails;
  }

  const envValue = process.env.SUPERADMIN_EMAILS;
  if (!envValue) {
    console.warn('SUPERADMIN_EMAILS not configured - no superadmins will have access');
    cachedEmails = [];
    return cachedEmails;
  }

  cachedEmails = envValue.split(',').map(email => email.trim().toLowerCase());
  return cachedEmails;
}

/**
 * Check if email belongs to a superadmin
 */
export function isSuperadmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const superadminEmails = getSuperadminEmails();
  return superadminEmails.includes(email.toLowerCase());
}
