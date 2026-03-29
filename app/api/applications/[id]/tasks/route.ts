// ============================================================
//  app/api/applications/[id]/tasks/route.ts
//  GET    → list tasks for one application
//  POST   → create task
// ============================================================

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("application_id", Number(params.id))
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Params) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, due_date } = await req.json();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      application_id: Number(params.id),
      user_id: user.id,
      text,
      due_date: due_date ?? null,
      done: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}