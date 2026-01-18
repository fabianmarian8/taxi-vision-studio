import { createClient } from '@/lib/supabase/server';
import { isSuperadmin } from '@/lib/superadmin';

export interface CityOwnershipResult {
  isAdmin: boolean;
  userId: string | null;
  userEmail: string | null;
}

/**
 * Check if the current user is a superadmin who can edit city pages
 */
export async function checkCityEditAccess(): Promise<CityOwnershipResult> {
  const defaultResult: CityOwnershipResult = {
    isAdmin: false,
    userId: null,
    userEmail: null,
  };

  try {
    // During static generation, cookies() will throw - return default
    let supabase;
    try {
      supabase = await createClient();
    } catch {
      // Static generation - no cookies available
      return defaultResult;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return defaultResult;
    }

    // Check if user is superadmin
    const userIsSuperadmin = isSuperadmin(user.email);

    return {
      isAdmin: userIsSuperadmin,
      userId: user.id,
      userEmail: user.email || null,
    };

  } catch (error) {
    console.error('[checkCityEditAccess] Error:', error);
    return defaultResult;
  }
}
