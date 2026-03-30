// ============================================================
//  app/auth/callback/route.ts
//
//  When a user clicks the confirmation link in their email,
//  Supabase redirects them to:
//    https://yourapp.com/auth/callback?code=XXXX
//
//  This route exchanges that one-time code for a real session
//  cookie, then redirects to the dashboard.
//
//  You MUST add this URL to Supabase Dashboard →
//  Authentication → URL Configuration → Redirect URLs:
//    http://localhost:3000/auth/callback
//    https://yourdomain.com/auth/callback
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";    // where to go after auth

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to dashboard (or wherever `next` points)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed → redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}