// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, company, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!apps || apps.length === 0) {
    return NextResponse.json({
      total: 0, appsPerWeek: 0, offerRate: 0,
      interviewRate: 0, avgResponseDays: 0,
      funnel: {}, weeklyData: [], topCompanies: [],
    });
  }

  const total = apps.length;

  // ── Apps per week ────────────────────────────────────────
  const firstDate    = new Date(apps[0].created_at);
  const weeksElapsed = Math.max(1, (Date.now() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const appsPerWeek  = +(total / weeksElapsed).toFixed(1);

  // ── Funnel ───────────────────────────────────────────────
  const funnel = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const interviewRate = Math.round(
    ((funnel.Interview ?? 0) + (funnel.Offer ?? 0)) / total * 100
  );
  const offerRate = Math.round((funnel.Offer ?? 0) / total * 100);

  // ── Avg response time ────────────────────────────────────
  // "responded" = any status other than Applied
  const respondedApps = apps.filter(a => a.status !== "Applied" && a.updated_at);
  let avgResponseDays = 0;
  if (respondedApps.length > 0) {
    const totalDays = respondedApps.reduce((sum, a) => {
      const created = new Date(a.created_at).getTime();
      const updated = new Date(a.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgResponseDays = +(totalDays / respondedApps.length).toFixed(1);
  }

  // ── Weekly buckets ───────────────────────────────────────
  const weeklyMap: Record<string, number> = {};
  apps.forEach(a => {
    const d         = new Date(a.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key       = weekStart.toISOString().slice(0, 10);
    weeklyMap[key]  = (weeklyMap[key] ?? 0) + 1;
  });
  const weeklyData = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  // ── Top companies by response rate ───────────────────────
  const companyMap: Record<string, { total: number; responded: number }> = {};
  apps.forEach(a => {
    if (!companyMap[a.company]) companyMap[a.company] = { total: 0, responded: 0 };
    companyMap[a.company].total++;
    if (a.status !== "Applied") companyMap[a.company].responded++;
  });
  const topCompanies = Object.entries(companyMap)
    .map(([company, stats]) => ({ company, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return NextResponse.json({
    total, appsPerWeek, offerRate, interviewRate,
    avgResponseDays, funnel, weeklyData, topCompanies,
  });
}