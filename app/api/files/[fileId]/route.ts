// ============================================================
//  app/api/files/[fileId]/route.ts
//  GET    → generate a 60-second signed URL for viewing/download
//  DELETE → remove file from Storage + delete metadata row
// ============================================================


import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params { params: { fileId: string } }

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: fileMeta, error: metaErr } = await supabase
    .from("app_files")
    .select("storage_path, name")
    .eq("id", Number(params.fileId))
    .eq("user_id", user.id)
    .single();

  if (metaErr || !fileMeta) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const { data: signed, error: signErr } = await supabase.storage
    .from("app-files")
    .createSignedUrl(fileMeta.storage_path, 60);

  if (signErr || !signed) return NextResponse.json({ error: "Could not generate URL" }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl, name: fileMeta.name });
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: fileMeta, error: metaErr } = await supabase
    .from("app_files")
    .select("storage_path")
    .eq("id", Number(params.fileId))
    .eq("user_id", user.id)
    .single();

  if (metaErr || !fileMeta) return NextResponse.json({ error: "File not found" }, { status: 404 });

  await supabase.storage.from("app-files").remove([fileMeta.storage_path]);

  const { error } = await supabase
    .from("app_files")
    .delete()
    .eq("id", Number(params.fileId))
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}