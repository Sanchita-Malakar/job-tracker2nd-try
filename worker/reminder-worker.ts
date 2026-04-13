// worker/reminder-worker.ts
// This is NOT a Next.js file. It runs as a standalone Node process.
// Start it with: npx tsx worker/reminder-worker.ts
// In production: keep it running with pm2 or deploy to Render.com

import { Worker } from "bullmq";
import { Resend } from "resend";
import { redisConnection } from "../lib/queue";
import type { ReminderJobData } from "../lib/queue";

const resend = new Resend(process.env.RESEND_API_KEY);

const worker = new Worker<ReminderJobData>(
  "reminders",
  async (job) => {
    const { userEmail, userName, title, date, time, company, role } = job.data;

    console.log(`[worker] Sending reminder email to ${userEmail} for: ${title}`);

    const { error } = await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to:      userEmail,
      subject: `⏰ Reminder in 30 minutes: ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #4f8ef7;">⏰ Upcoming Reminder</h2>
          <p>Hi ${userName},</p>
          <p>Your reminder is coming up in <strong>30 minutes</strong>:</p>
          <div style="background: #f5f5f5; border-left: 4px solid #4f8ef7; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <strong style="font-size: 18px;">${title}</strong><br/>
            <span style="color: #666;">📅 ${date} at ${time}</span><br/>
            <span style="color: #666;">🏢 ${company} — ${role}</span>
          </div>
          <p>Good luck! 🚀</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
          <p style="color: #999; font-size: 12px;">
            Job Tracker · You're receiving this because you set a reminder.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(`[worker] Resend error:`, error);
      throw new Error(error.message); // BullMQ will retry on throw
    }

    console.log(`[worker] Email sent successfully for job ${job.id}`);
  },
  {
    connection: redisConnection,
    concurrency: 5, // process 5 jobs at once
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

console.log("[worker] Reminder worker started, waiting for jobs...");