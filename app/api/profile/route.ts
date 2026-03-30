// app/api/profile/route.ts
// GET  → fetch current user's profile
// PATCH → update profile fields (name, college, department, year_level, university)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, batch, college, university, department, year_level, created_at")
    .eq("id", user.id)
    .single();

  // If row not found yet (e.g. trigger hasn't run), return minimal info from auth
  if (error && error.code === "PGRST116") {
    return NextResponse.json({
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.name ?? "",
      batch: "",
      college: "",
      university: "",
      department: "",
      year_level: "",
    });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["name", "batch", "college", "university", "department", "year_level"] as const;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  // Upsert in case the row doesn't exist yet
  const { data, error } = await supabase
    .from("users")
    .upsert({ id: user.id, email: user.email, ...patch }, { onConflict: "id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}