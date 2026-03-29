// ============================================================
//  app/api/reminders/[reminderId]/route.ts
//  DELETE → remove a single reminder
//  PATCH  → update title / date / time / type
// ============================================================

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ReminderType } from "@/types";

interface Params { params: { reminderId: string } }

const VALID_TYPES: ReminderType[] = ["interview", "deadline", "followup"];

// ── DELETE ───────────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", Number(params.reminderId))
    .eq("user_id", user.id);   // RLS double-check — user can only delete own rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── PATCH — update any reminder field ────────────────────────
// Useful when the user edits a reminder from the Drawer later.
export async function PATCH(req: Request, { params }: Params) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Only allow known fields to be patched
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.date  !== undefined) patch.date  = String(body.date).trim();
  if (body.time  !== undefined) patch.time  = String(body.time).trim();
  if (body.type  !== undefined && VALID_TYPES.includes(body.type)) {
    patch.type = body.type as ReminderType;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reminders")
    .update(patch)
    .eq("id", Number(params.reminderId))
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}