// ============================================================
//  app/api/applications/[id]/reminders/route.ts
//  GET  → list all reminders for one application
//  POST → create a new reminder for one application
// ============================================================

// app/api/applications/[id]/reminders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReminderType } from "@/types";

interface Params { params: Promise<{ id: string }> }

const VALID_TYPES: ReminderType[] = ["interview", "deadline", "followup"];

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("application_id", Number(id))
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, date, time, type } = body;

  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!date?.trim())  return NextResponse.json({ error: "date is required" },  { status: 400 });
  if (!time?.trim())  return NextResponse.json({ error: "time is required" },  { status: 400 });

  const resolvedType: ReminderType = VALID_TYPES.includes(type) ? type : "followup";

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      application_id: Number(id),
      user_id:        user.id,
      title:          title.trim(),
      date:           date.trim(),
      time:           time.trim(),
      type:           resolvedType,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}