// ============================================================
//  app/api/applications/[id]/files/route.ts
//
//  FIXES APPLIED:
//  1. Detailed error logging so 500s are debuggable
//  2. Bucket name constant — change BUCKET_NAME if yours differs
//  3. File path prefixed with user_id so RLS storage policies work
//     (most Supabase storage policies check the first path segment)
//  4. Returns uploaded_at in response so Drawer can show it
//  5. GET returns full file list ordered newest first
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

// ── Change this if your Supabase Storage bucket has a different name ──
const BUCKET_NAME = "app-files";

// GET /api/applications/:id/files
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("app_files")
    .select("id, name, file_type, size_bytes, uploaded_at, storage_path")
    .eq("application_id", Number(id))
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("[GET /files] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

// POST /api/applications/:id/files
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    console.error("[POST /files] Failed to parse formData:", err);
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // FIX 3: prefix with user_id so storage RLS works
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${user.id}/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // ── Upload to Supabase Storage ──────────────────────────
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (storageError) {
    console.error("[POST /files] Storage upload error:", storageError);
    return NextResponse.json(
      { error: `Storage error: ${storageError.message}` },
      { status: 500 }
    );
  }

  // ── Detect file_type ────────────────────────────────────
  let fileType = "other";
  if (file.type === "application/pdf" || ext === "pdf") fileType = "pdf";
  else if (file.type.startsWith("image/")) fileType = "image";
  else if (["doc", "docx"].includes(ext)) fileType = "doc";

  // ── Insert DB record ────────────────────────────────────
  const { data: row, error: dbError } = await supabase
    .from("app_files")
    .insert({
      application_id: Number(id),
      user_id:        user.id,
      name:           file.name,
      file_type:      fileType,
      size_bytes:     file.size,
      storage_path:   storagePath,
    })
    .select("id, name, file_type, size_bytes, uploaded_at, storage_path")
    .single();

  if (dbError) {
    console.error("[POST /files] DB insert error:", dbError);
    // Clean up storage on DB failure
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(row, { status: 201 });
}