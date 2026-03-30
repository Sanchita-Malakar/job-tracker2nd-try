// ============================================================
//  app/api/applications/[id]/route.ts
//  PATCH  /api/applications/:id  → update status / notes
//  DELETE /api/applications/:id  → delete application + cascade
// ============================================================

// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToApplication } from "@/types";
import type { ApplicationRow } from "@/types";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["status", "notes", "company", "role", "date"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", Number(id))
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToApplication(data as ApplicationRow));
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Delete storage files first
  const { data: files } = await supabase
    .from("app_files")
    .select("storage_path")
    .eq("application_id", Number(id))
    .eq("user_id", user.id);

  if (files && files.length > 0) {
    const paths = files.map((f: { storage_path: string }) => f.storage_path);
    await supabase.storage.from("app-files").remove(paths);
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", Number(id))
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}