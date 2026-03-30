// ============================================================
//  lib/supabase/client.ts
//  Browser-side Supabase client.
//  Use this in "use client" components (page.tsx, Drawer.tsx, etc.)
//  Uses cookies so the session persists across page refreshes.
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}