// app/api/notifications/route.ts
// ============================================================
//  GET  → returns upcoming reminders + recent status changes
//  POST → mark notification as read (stores in localStorage
//         on client — no DB table needed for basic read state)
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface Notification {
  id:        string;   // "reminder-{id}" or "status-{id}"
  type:      "reminder" | "status_change" | "offer" | "rejected";
  text:      string;
  subtext:   string;   // company + role
  time:      string;   // human-readable "2h ago"
  color:     string;
  urgent:    boolean;  // fires within 2 hours
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs  / 24);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function timeUntil(dateStr: string, timeStr: string): string {
  // dateStr = "15 Apr", timeStr = "10:30 AM"
  try {
    const dt   = new Date(`${dateStr} ${new Date().getFullYear()} ${timeStr}`);
    const diff = dt.getTime() - Date.now();
    if (diff < 0) return "past";
    const mins = Math.floor(diff / 60_000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs  / 24);
    if (mins < 60)  return `in ${mins}m`;
    if (hrs  < 24)  return `in ${hrs}h`;
    return `in ${days}d`;
  } catch {
    return "";
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications: Notification[] = [];

  // ── 1. Upcoming reminders (next 48 hours) ───────────────
  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, title, date, time, type, application_id, applications(company, role)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const now  = Date.now();
  const in48 = now + 48 * 60 * 60 * 1000;

  (reminders ?? []).forEach((r: any) => {
    try {
      const dt     = new Date(`${r.date} ${new Date().getFullYear()} ${r.time}`);
      const dtMs   = dt.getTime();
      if (dtMs < now || dtMs > in48) return; // skip past or far future

      const until  = timeUntil(r.date, r.time);
      const urgent = dtMs - now < 2 * 60 * 60 * 1000; // within 2 hours

      const typeIcon: Record<string, string> = {
        interview: "🎙",
        deadline:  "⏰",
        followup:  "📧",
      };

      notifications.push({
        id:      `reminder-${r.id}`,
        type:    "reminder",
        text:    `${typeIcon[r.type] ?? "🔔"} ${r.title} — ${r.date} at ${r.time}`,
        subtext: `${r.applications?.company ?? ""} · ${until}`,
        time:    r.time,
        color:   urgent ? "#f87171" : "#fbbf24",
        urgent,
      });
    } catch { /* skip malformed */ }
  });

  // ── 2. Recent status changes (last 7 days) ──────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentApps } = await supabase
    .from("applications")
    .select("id, company, role, status, updated_at")
    .eq("user_id", user.id)
    .neq("status", "Applied")       // "Applied" = no change yet
    .gte("updated_at", sevenDaysAgo)
    .order("updated_at", { ascending: false })
    .limit(5);

  const statusConfig: Record<string, { color: string; icon: string; text: string }> = {
    OA:        { color: "#22d3ee", icon: "📋", text: "Online Assessment received" },
    Interview: { color: "#fb923c", icon: "🎯", text: "Interview scheduled"        },
    Offer:     { color: "#34d399", icon: "🎉", text: "Offer received!"            },
    Rejected:  { color: "#f87171", icon: "📭", text: "Application rejected"       },
  };

  (recentApps ?? []).forEach((app: any) => {
    const cfg = statusConfig[app.status];
    if (!cfg) return;

    notifications.push({
      id:      `status-${app.id}`,
      type:    app.status === "Offer" ? "offer" : app.status === "Rejected" ? "rejected" : "status_change",
      text:    `${cfg.icon} ${cfg.text}`,
      subtext: `${app.company} — ${app.role}`,
      time:    timeAgo(app.updated_at),
      color:   cfg.color,
      urgent:  app.status === "Offer",
    });
  });

  // Sort: urgent first, then by recency
  notifications.sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return 0;
  });

  return NextResponse.json({
    notifications: notifications.slice(0, 8), // max 8
    unread: notifications.length,
  });
}