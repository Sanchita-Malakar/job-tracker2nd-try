// ============================================================
//  app/api/applications/[id]/files/route.ts
//  GET    → list file metadata for one application
//  POST   → upload file to Supabase Storage + save metadata
// ============================================================

// app/api/applications/[id]/files/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("app_files")
    .select("*")
    .eq("application_id", Number(id))
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const safeName    = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${id}/${Date.now()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from("app-files")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const fileType = file.type.includes("pdf")
    ? "pdf"
    : file.type.startsWith("image/")
    ? "image"
    : "doc";

  const { data, error: dbErr } = await supabase
    .from("app_files")
    .insert({
      application_id: Number(id),
      user_id:        user.id,
      name:           file.name,
      storage_path:   storagePath,
      file_type:      fileType,
      size_bytes:     file.size,
    })
    .select()
    .single();

  if (dbErr) {
    await supabase.storage.from("app-files").remove([storagePath]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}