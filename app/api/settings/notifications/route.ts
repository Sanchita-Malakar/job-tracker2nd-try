// ============================================================
//  app/api/settings/notifications/route.ts
//  PATCH → save notification preferences to user profile
//
//  First run this migration in Supabase SQL Editor:
//
//  ALTER TABLE public.users
//    ADD COLUMN IF NOT EXISTS notif_reminders  boolean NOT NULL DEFAULT true,
//    ADD COLUMN IF NOT EXISTS notif_weekly     boolean NOT NULL DEFAULT false,
//    ADD COLUMN IF NOT EXISTS notif_tips       boolean NOT NULL DEFAULT true;
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const { error } = await supabase
    .from("users")
    .update({
      notif_reminders: body.reminder_emails ?? true,
      notif_weekly:    body.weekly_digest   ?? false,
      notif_tips:      body.tips            ?? true,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}