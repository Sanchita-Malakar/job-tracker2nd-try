// ============================================================
//  app/api/files/[fileId]/route.ts
//
//  GET    → return a short-lived signed URL to view/download the file
//  DELETE → remove DB record + storage object
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ fileId: string }> }

const BUCKET_NAME = "app-files"; // must match files/route.ts

// GET /api/files/:fileId  → signed URL
export async function GET(_req: Request, { params }: Params) {
  const { fileId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: file, error: fetchErr } = await supabase
    .from("app_files")
    .select("storage_path, name")
    .eq("id", Number(fileId))
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(file.storage_path, 60 * 60); // 1-hour expiry

  if (signErr || !signed) {
    console.error("[GET /files/:id] Signed URL error:", signErr);
    return NextResponse.json({ error: "Could not generate file URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, name: file.name });
}

// DELETE /api/files/:fileId
export async function DELETE(_req: Request, { params }: Params) {
  const { fileId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch storage_path before deleting
  const { data: file, error: fetchErr } = await supabase
    .from("app_files")
    .select("storage_path")
    .eq("id", Number(fileId))
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Remove from storage first
  const { error: storageErr } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([file.storage_path]);

  if (storageErr) {
    console.error("[DELETE /files/:id] Storage remove error:", storageErr);
    // Continue to delete DB record even if storage fails
  }

  const { error: dbErr } = await supabase
    .from("app_files")
    .delete()
    .eq("id", Number(fileId))
    .eq("user_id", user.id);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}