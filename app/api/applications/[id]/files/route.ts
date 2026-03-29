// ============================================================
//  app/api/applications/[id]/files/route.ts
//  GET    → list file metadata for one application
//  POST   → upload file to Supabase Storage + save metadata
// ============================================================

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface Params { params: { id: string } }

// ── GET — list files for an application ──────────────────────
export async function GET(_req: Request, { params }: Params) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("app_files")
    .select("*")
    .eq("application_id", Number(params.id))
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── POST — upload file ────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Max 10 MB guard
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  // Storage path: userId/applicationId/timestamp-filename
  // The userId prefix is used by Storage RLS to scope access
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${params.id}/${Date.now()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from("app-files")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // Detect a friendly type label
  const fileType = file.type.includes("pdf")
    ? "pdf"
    : file.type.startsWith("image/")
    ? "image"
    : "doc";

  // Save metadata to DB
  const { data, error: dbErr } = await supabase
    .from("app_files")
    .insert({
      application_id: Number(params.id),
      user_id: user.id,
      name: file.name,
      storage_path: storagePath,
      file_type: fileType,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (dbErr) {
    // Rollback the storage upload if DB insert fails
    await supabase.storage.from("app-files").remove([storagePath]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}