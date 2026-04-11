// ============================================================
//  app/api/applications/[id]/note-history/route.ts
//
//  NEW FILE — required by Drawer.tsx note history feature
//
//  GET  → return all saved note snapshots for this application
//         ordered newest first
//  POST → insert a new snapshot (called alongside PATCH /app on Save)
//
//  Required Supabase migration (run once in SQL editor):
//  ─────────────────────────────────────────────────────
//  CREATE TABLE note_history (
//    id             bigint generated always as identity primary key,
//    application_id bigint  not null references applications(id) on delete cascade,
//    user_id        uuid    not null references auth.users(id)    on delete cascade,
//    content        text    not null,
//    saved_at       timestamptz not null default now()
//  );
//  CREATE INDEX ON note_history (application_id, user_id, saved_at DESC);
//  ALTER TABLE note_history ENABLE ROW LEVEL SECURITY;
//  CREATE POLICY "Users manage own note history"
//    ON note_history FOR ALL USING (auth.uid() = user_id);
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

// GET /api/applications/:id/note-history
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("note_history")
    .select("id, content, saved_at")
    .eq("application_id", Number(id))
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/applications/:id/note-history
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("note_history")
    .insert({
      application_id: Number(id),
      user_id: user.id,
      content,
    })
    .select("id, content, saved_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}