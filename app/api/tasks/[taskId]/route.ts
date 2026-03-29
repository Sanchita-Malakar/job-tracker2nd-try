// ============================================================
//  app/api/tasks/[taskId]/route.ts
//  PATCH  → toggle done / update text
//  DELETE → remove task
// ============================================================

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params { params: { taskId: string } }

export async function PATCH(req: Request, { params }: Params) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ("done" in body) patch.done = body.done;
  if ("text" in body) patch.text = body.text;
  if ("due_date" in body) patch.due_date = body.due_date;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", Number(params.taskId))
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", Number(params.taskId))
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}