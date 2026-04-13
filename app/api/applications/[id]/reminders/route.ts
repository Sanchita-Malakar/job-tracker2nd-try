import { reminderQueue } from "@/lib/queue";
import { NextResponse } from "next/server";
import type { ReminderJobData } from "@/lib/queue";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, date, time, type } = body;

  // 1. Save to Supabase as before
  const { data: reminder, error } = await supabase
    .from("reminders")
    .insert({ application_id: Number(id), user_id: user.id, title, date, time, type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Calculate delay in milliseconds
  // date = "15 Apr", time = "10:30 AM"
  try {
    const reminderDate = new Date(
      `${date} ${new Date().getFullYear()} ${time}`
    );
    const notifyAt  = new Date(reminderDate.getTime() - 30 * 60 * 1000); // 30 min before
    //const delayMs   = notifyAt.getTime() - Date.now();
    const delayMs = 30_000;
    if (delayMs > 0) {
      // 3. Get user profile for email
      const { data: profile } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", user.id)
        .single();

      // 4. Get application info
      const { data: app } = await supabase
        .from("applications")
        .select("company, role")
        .eq("id", Number(id))
        .single();

      const jobData: ReminderJobData = {
        reminderId: reminder.id,
        userId:     user.id,
        userEmail:  profile?.email ?? user.email ?? "",
        userName:   profile?.name ?? "there",
        title,
        date,
        time,
        company:    app?.company ?? "",
        role:       app?.role    ?? "",
      };

      await reminderQueue.add(
        `reminder-${reminder.id}`,
        jobData,
        {
          delay:    delayMs,
          attempts: 3,           // retry up to 3 times on failure
          backoff:  { type: "exponential", delay: 5000 },
          removeOnComplete: true, // clean up completed jobs
          removeOnFail:     100,  // keep last 100 failed jobs for debugging
        }
      );

      console.log(`[api] Queued reminder ${reminder.id}, fires in ${Math.round(delayMs / 60000)} minutes`);
    }
  } catch (queueErr) {
    // Don't fail the request if queue fails — reminder is still saved
    console.error("[api] Failed to queue reminder:", queueErr);
  }

  return NextResponse.json(reminder, { status: 201 });
}