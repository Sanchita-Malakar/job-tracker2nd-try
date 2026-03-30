// ============================================================
//  app/api/applications/route.ts
//  GET  /api/applications        → list all for logged-in user
//  POST /api/applications        → create new application
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToApplication } from "@/types";
import type { ApplicationRow } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as ApplicationRow[]).map(rowToApplication));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { company, role, status, date, notes } = body;

  if (!company || !role) {
    return NextResponse.json({ error: "company and role are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company,
      role,
      status: status ?? "Applied",
      date: date ?? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      notes: notes ?? "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToApplication(data as ApplicationRow), { status: 201 });
}