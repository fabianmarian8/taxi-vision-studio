import { createClientSafe } from '@/lib/supabase/server';
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
    // createClientSafe returns null during static generation
    const supabase = await createClientSafe();
    if (!supabase) {
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
