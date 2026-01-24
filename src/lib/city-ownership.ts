import { isSuperadmin } from '@/lib/superadmin';

export interface CityOwnershipResult {
  isAdmin: boolean;
  userId: string | null;
  userEmail: string | null;
}

/**
 * Check if the current user is a superadmin who can edit city pages.
 *
 * NOTE: For ISR/static pages, this always returns default (not admin).
 * Server-side auth checks are not possible in static pages.
 * Use client-side checks if admin features are needed.
 */
export async function checkCityEditAccess(): Promise<CityOwnershipResult> {
  // For static/ISR pages, always return default (not admin)
  // Server-side auth would cause "static to dynamic" errors
  return {
    isAdmin: false,
    userId: null,
    userEmail: null,
  };
}
