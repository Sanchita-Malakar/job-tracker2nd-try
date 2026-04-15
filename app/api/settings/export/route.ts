// ============================================================
//  app/api/settings/export/route.ts
//  GET → returns a CSV file of all the user's applications
//        with their tasks, notes, and reminders included
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCsv(val: unknown): string {
  const str = String(val ?? "").replace(/"/g, '""');
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str}"`
    : str;
}

function row(cols: unknown[]): string {
  return cols.map(escapeCsv).join(",");
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all applications
  const { data: apps } = await supabase
    .from("applications")
    .select("id, company, role, status, date, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch all tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("application_id, text, done, due_date")
    .eq("user_id", user.id);

  // Fetch all reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("application_id, title, date, time, type")
    .eq("user_id", user.id);

  // Group tasks and reminders by application_id
  const tasksByApp: Record<number, string[]> = {};
  (tasks ?? []).forEach(t => {
    if (!tasksByApp[t.application_id]) tasksByApp[t.application_id] = [];
    tasksByApp[t.application_id].push(`${t.done ? "[done]" : "[todo]"} ${t.text}${t.due_date ? ` (due ${t.due_date})` : ""}`);
  });

  const remindersByApp: Record<number, string[]> = {};
  (reminders ?? []).forEach(r => {
    if (!remindersByApp[r.application_id]) remindersByApp[r.application_id] = [];
    remindersByApp[r.application_id].push(`${r.title} — ${r.date} ${r.time} [${r.type}]`);
  });

  // Build CSV
  const lines: string[] = [];

  // Header
  lines.push(row([
    "Company", "Role", "Status", "Date Applied",
    "Notes", "Tasks", "Reminders", "Created At",
  ]));

  // Data rows
  (apps ?? []).forEach(app => {
    const appTasks     = (tasksByApp[app.id]     ?? []).join(" | ");
    const appReminders = (remindersByApp[app.id] ?? []).join(" | ");
    lines.push(row([
      app.company,
      app.role,
      app.status,
      app.date ?? "",
      app.notes ?? "",
      appTasks,
      appReminders,
      new Date(app.created_at).toLocaleDateString("en-GB"),
    ]));
  });

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="job-tracker-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}