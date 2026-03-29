// ============================================================
//  lib/supabase.ts
//  Two clients:
//   • supabase      — uses ANON key, safe for browser & server components
//   • supabaseAdmin — uses SERVICE ROLE key, server-side API routes ONLY
//                     NEVER import supabaseAdmin in client components
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

// ── Browser / server component client (respects RLS) ─────────
export const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ── Admin client (bypasses RLS — server API routes only) ──────
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});