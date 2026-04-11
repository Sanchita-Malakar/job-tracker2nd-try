// ============================================================
//  app/api/applications/route.ts
//
//  GET  → list all applications for the logged-in user
//  POST → create a new application (saves to Supabase)
//
//  FIX: This route is what AddApplicationModal calls.
//  Previously applications were only in local React state.
//  Now they are persisted so file uploads, tasks, notes etc.
//  can reference a real application_id with a valid FK.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToApplication } from "@/types";
import type { ApplicationRow } from "@/types";

// GET /api/applications — returns all apps for logged-in user
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/applications]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(row => rowToApplication(row as ApplicationRow)));
}

// POST /api/applications — create a new application
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { company, role, status, date, notes } = body;

  if (!company?.trim()) return NextResponse.json({ error: "company is required" }, { status: 400 });
  if (!role?.trim())    return NextResponse.json({ error: "role is required" },    { status: 400 });

  const validStatuses = ["Applied", "OA", "Interview", "Offer", "Rejected"];
  const resolvedStatus = validStatuses.includes(status) ? status : "Applied";

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company: company.trim(),
      role:    role.trim(),
      status:  resolvedStatus,
      date:    date ?? null,
      notes:   notes?.trim() ?? '',
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/applications]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(rowToApplication(data as ApplicationRow), { status: 201 });
}