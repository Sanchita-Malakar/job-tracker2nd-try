"use client";
// ============================================================
//  contexts/DataContext.tsx
//
//  FIXES APPLIED:
//  1. Reminders are now stored in context (were invisible before)
//  2. refreshApplication now re-fetches reminders too
//  3. DataProvider must be placed in app/layout.tsx (root)
//     so /resumes, /tasks etc. don't crash with
//     "useData must be used within <DataProvider>"
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { Application } from "@/types";

// ── Shared types ─────────────────────────────────────────────
export interface Task {
  id: number;
  text: string;
  done: boolean;
  due_date?: string | null;
  application_id: number;
}

export interface AppFile {
  id: number;
  name: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string;
  application_id: number;
}

export interface Note {
  id: number;
  notes: string;
  application_id: number;
}

// ── FIX 1: Reminder type added to context ────────────────────
export interface Reminder {
  id: number;
  title: string;
  date: string;
  time: string;
  type: "interview" | "deadline" | "followup";
  application_id: number;
}

// ── Context shape ─────────────────────────────────────────────
interface DataContextType {
  applications: Application[];
  tasks: Task[];
  files: AppFile[];
  notes: Note[];
  reminders: Reminder[]; // FIX 1: was missing
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshApplication: (appId: number) => Promise<void>;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setFiles: React.Dispatch<React.SetStateAction<AppFile[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>; // FIX 1
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────
// FIX 2: Place <DataProvider> in app/layout.tsx, NOT inside page.tsx
// so that all routes (/resumes, /tasks, /analytics, etc.) can call useData()
export function DataProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [files,        setFiles]        = useState<AppFile[]>([]);
  const [notes,        setNotes]        = useState<Note[]>([]);
  const [reminders,    setReminders]    = useState<Reminder[]>([]); // FIX 1
  const [loading,      setLoading]      = useState(true);

  // ── Full fetch ──────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const appsRes = await fetch("/api/applications");
      if (!appsRes.ok) throw new Error("Failed to fetch applications");
      const apps: Application[] = await appsRes.json();
      setApplications(apps);

      const tasksList:    Task[]     = [];
      const filesList:    AppFile[]  = [];
      const notesList:    Note[]     = [];
      const remindersList: Reminder[] = []; // FIX 1

      await Promise.all(
        apps.map(async (app) => {
          try {
            // FIX 1: fetch reminders alongside tasks and files
            const [tRes, fRes, rRes] = await Promise.all([
              fetch(`/api/applications/${app.id}/tasks`),
              fetch(`/api/applications/${app.id}/files`),
              fetch(`/api/applications/${app.id}/reminders`),
            ]);

            if (tRes.ok) {
              const appTasks: Task[] = await tRes.json();
              appTasks.forEach(t => tasksList.push({ ...t, application_id: app.id }));
            }
            if (fRes.ok) {
              const appFiles: AppFile[] = await fRes.json();
              appFiles.forEach(f => filesList.push({ ...f, application_id: app.id }));
            }
            if (rRes.ok) {
              const appReminders: Reminder[] = await rRes.json();
              appReminders.forEach(r => remindersList.push({ ...r, application_id: app.id }));
            }
          } catch { /* skip individual app errors */ }

          if (app.notes?.trim()) {
            notesList.push({ id: app.id, notes: app.notes, application_id: app.id });
          }
        })
      );

      setTasks(tasksList);
      setFiles(filesList);
      setNotes(notesList);
      setReminders(remindersList); // FIX 1
    } catch (error) {
      console.error("DataContext: failed to fetch all data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Per-application refresh ─────────────────────────────────
  const refreshApplication = useCallback(async (appId: number) => {
    try {
      // FIX 1: reminders added to the parallel fetch
      const [appRes, tRes, fRes, rRes] = await Promise.all([
        fetch(`/api/applications/${appId}`),
        fetch(`/api/applications/${appId}/tasks`),
        fetch(`/api/applications/${appId}/files`),
        fetch(`/api/applications/${appId}/reminders`),
      ]);

      if (appRes.ok) {
        const updatedApp: Application = await appRes.json();
        setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
        setNotes(prev => {
          const rest = prev.filter(n => n.application_id !== appId);
          return updatedApp.notes?.trim()
            ? [...rest, { id: appId, notes: updatedApp.notes, application_id: appId }]
            : rest;
        });
      }
      if (tRes.ok) {
        const appTasks: Task[] = await tRes.json();
        setTasks(prev => [
          ...prev.filter(t => t.application_id !== appId),
          ...appTasks.map(t => ({ ...t, application_id: appId })),
        ]);
      }
      if (fRes.ok) {
        const appFiles: AppFile[] = await fRes.json();
        setFiles(prev => [
          ...prev.filter(f => f.application_id !== appId),
          ...appFiles.map(f => ({ ...f, application_id: appId })),
        ]);
      }
      // FIX 1: update reminders in context
      if (rRes.ok) {
        const appReminders: Reminder[] = await rRes.json();
        setReminders(prev => [
          ...prev.filter(r => r.application_id !== appId),
          ...appReminders.map(r => ({ ...r, application_id: appId })),
        ]);
      }
    } catch (error) {
      console.error(`DataContext: failed to refresh app ${appId}`, error);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <DataContext.Provider value={{
      applications,
      tasks,
      files,
      notes,
      reminders,        // FIX 1
      loading,
      refreshAll:          fetchAllData,
      refreshApplication,
      setApplications,
      setTasks,
      setFiles,
      setNotes,
      setReminders,     // FIX 1
    }}>
      {children}
    </DataContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}