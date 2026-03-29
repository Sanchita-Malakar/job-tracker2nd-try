// ============================================================
//  app/api/applications/[id]/reminders/route.ts
//  GET  → list all reminders for one application
//  POST → create a new reminder for one application
// ============================================================

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ReminderType } from "@/types";

interface Params { params: { id: string } }

const VALID_TYPES: ReminderType[] = ["interview", "deadline", "followup"];

// ── GET — fetch reminders for an application ─────────────────
export async function GET(_req: Request, { params }: Params) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("application_id", Number(params.id))
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ── POST — create a reminder ──────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, date, time, type } = body;

  // Validate required fields
  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!date?.trim()) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  if (!time?.trim()) {
    return NextResponse.json({ error: "time is required" }, { status: 400 });
  }

  // Validate type against the union — default to "followup" if omitted
  const resolvedType: ReminderType =
    VALID_TYPES.includes(type) ? type : "followup";

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      application_id: Number(params.id),
      user_id:        user.id,
      title:          title.trim(),
      date:           date.trim(),   // "20 Mar"
      time:           time.trim(),   // "11:00 AM"
      type:           resolvedType,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}