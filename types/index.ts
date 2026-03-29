// ============================================================
//  types/index.ts
//  Single source of truth for all types across the app.
//  Compatible with KanbanBoard, Drawer, StatsStrip, page.tsx
// ============================================================

// ── Status values — keep in sync with schema CHECK constraint ──
export type ApplicationStatus =
  | "Applied"
  | "OA"
  | "Interview"
  | "Offer"
  | "Rejected";

// ── Core Application type ────────────────────────────────────
// "id" is number to stay compatible with your existing components
// (KanbanBoard, Drawer all use app.id as number)
export interface Application {
  id: number;
  company: string;
  role: string;
  status: ApplicationStatus;
  date: string;      // display string e.g. "10 Mar"
  notes: string;
}

// ── DB row shape returned by Supabase ────────────────────────
// Matches the columns in public.applications exactly.
export interface ApplicationRow {
  id: number;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── Task ─────────────────────────────────────────────────────
export interface Task {
  id: number;
  application_id: number;
  user_id: string;
  text: string;
  done: boolean;
  due_date: string | null;
  created_at: string;
}

// ── Reminder ─────────────────────────────────────────────────
export type ReminderType = "interview" | "deadline" | "followup";

export interface Reminder {
  id: number;
  application_id: number;
  user_id: string;
  title: string;
  date: string;
  time: string;
  type: ReminderType;
  created_at: string;
}

// ── App File (metadata only, binary in Supabase Storage) ─────
export interface AppFile {
  id: number;
  application_id: number;
  user_id: string;
  name: string;
  storage_path: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string;
}

// ── User profile ──────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  batch: string;
  created_at: string;
}

// ── Helper: convert DB row → Application (for components) ────
export function rowToApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    date: row.date,
    notes: row.notes,
  };
}