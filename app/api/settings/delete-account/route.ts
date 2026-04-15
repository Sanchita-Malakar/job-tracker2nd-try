// ============================================================
//  app/api/settings/delete-account/route.ts
//  DELETE → permanently removes all user data and auth account
//
//  Deletion order (respects FK constraints):
//  1. Storage files (Supabase Storage bucket)
//  2. app_files rows
//  3. note_history rows
//  4. reminders rows
//  5. tasks rows
//  6. applications rows  (cascades to above if ON DELETE CASCADE set)
//  7. users row
//  8. auth.users row (via admin API — requires SERVICE_ROLE_KEY)
// ============================================================

import { NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;

  try {
    // 1. Remove files from Supabase Storage
    const { data: files } = await supabase
      .from("app_files")
      .select("storage_path")
      .eq("user_id", uid);

    if (files && files.length > 0) {
      const paths = files.map((f: { storage_path: string }) => f.storage_path);
      await supabase.storage.from("app-files").remove(paths);
    }

    // 2-7. Delete DB rows — cascade handles children if set up,
    //      but we delete explicitly in order to be safe
    await supabase.from("app_files")    .delete().eq("user_id", uid);
    await supabase.from("note_history") .delete().eq("user_id", uid);
    await supabase.from("reminders")    .delete().eq("user_id", uid);
    await supabase.from("tasks")        .delete().eq("user_id", uid);
    await supabase.from("applications") .delete().eq("user_id", uid);
    await supabase.from("users")        .delete().eq("id",      uid);

    // 8. Delete from auth.users — requires SERVICE_ROLE_KEY (admin)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteAuthErr) {
      console.error("[delete-account] Failed to delete auth user:", deleteAuthErr);
      // Don't throw — profile data is already gone, auth cleanup is best-effort
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-account] Error:", err);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}