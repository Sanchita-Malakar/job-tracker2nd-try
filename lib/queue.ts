// lib/queue.ts
// This file sets up the BullMQ queue and connection.
// It is used by BOTH the API route (to add jobs)
// and the worker (to process jobs).

import { Queue } from "bullmq";
import IORedis from "ioredis";

// Connection to Upstash Redis
export const redisConnection = new IORedis(
  process.env.UPSTASH_REDIS_URL!,
  {
    maxRetriesPerRequest: null, // required by BullMQ
    tls: {},                    // required for Upstash (uses rediss://)
  }
);

// The queue — jobs go in here, worker pulls them out
export const reminderQueue = new Queue("reminders", {
  connection: redisConnection,
});

// Job data shape
export interface ReminderJobData {
  reminderId: number;
  userId:     string;
  userEmail:  string;
  userName:   string;
  title:      string;
  date:       string;
  time:       string;
  company:    string;
  role:       string;
}