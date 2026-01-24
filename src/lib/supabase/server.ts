import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Anonymous Supabase client for read-only operations during SSG/ISR.
 * Does NOT use cookies - safe for static generation.
 * Only use for public data that doesn't require auth.
 */
export function createAnonymousClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Safe client creation for static/ISR pages.
 * ALWAYS returns null to prevent static-to-dynamic errors.
 *
 * Ownership checks should be done client-side for ISR pages.
 * This function exists to maintain backwards compatibility.
 */
export async function createClientSafe() {
  // Always return null for static/ISR pages
  // Calling cookies() during ISR revalidation causes "static to dynamic" errors
  // See: https://nextjs.org/docs/messages/app-static-to-dynamic-error
  return null;
}
