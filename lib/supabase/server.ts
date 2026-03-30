// ============================================================
//  lib/supabase/server.ts
//  Server-side Supabase client.
//  Use this in API routes (route.ts files) and Server Components.
//  Reads the session cookie from the incoming request.
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies
            // can't be mutated — middleware handles refresh instead.
          }
        },
      },
    }
  );
}