"use client";
// ============================================================
//  contexts/DataContext.tsx
//
//  BUG FIX: Task toggle snapping back to previous state
//
//  ROOT CAUSE (micro-level):
//  1. User clicks task checkbox on /tasks page
//  2. setTasks() optimistic update fires — task flips to done:true
//  3. PATCH /api/tasks/:id fires — takes 300-800ms
//  4. Meanwhile Drawer (open on dashboard) calls refreshApplication()
//  5. refreshApplication fetches tasks from server
//  6. Server hasn't committed the PATCH yet → returns done:false (stale)
//  7. setTasks() in refreshApplication REPLACES all tasks for that app
//     with stale server data → optimistic update is destroyed
//  8. Task visually snaps back to pending
//
//  FIX:
//  - pendingTaskIds ref tracks IDs with in-flight PATCHes (no re-renders)
//  - refreshApplication MERGES instead of REPLACES:
//    locked task ID → keep local done value
//    unlocked task ID → take server value
//  - lockTask/unlockTask exposed so tasks page registers in-flight IDs
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { Application } from "@/types";

// ── Shared types ─────────────────────────────────────────────
export interface Task {
  id:             number;
  text:           string;
  done:           boolean;
  due_date?:      string | null;
  application_id: number;
}

export interface AppFile {
  id:             number;
  name:           string;
  file_type:      string;
  size_bytes:     number;
  uploaded_at:    string;
  application_id: number;
}

export interface Note {
  id:             number;
  notes:          string;
  application_id: number;
}

export interface Reminder {
  id:             number;
  title:          string;
  date:           string;
  time:           string;
  type:           "interview" | "deadline" | "followup";
  application_id: number;
}

// ── Context shape ─────────────────────────────────────────────
interface DataContextType {
  applications:       Application[];
  tasks:              Task[];
  files:              AppFile[];
  notes:              Note[];
  reminders:          Reminder[];
  loading:            boolean;
  refreshAll:         () => Promise<void>;
  refreshApplication: (appId: number) => Promise<void>;
  setApplications:    React.Dispatch<React.SetStateAction<Application[]>>;
  setTasks:           React.Dispatch<React.SetStateAction<Task[]>>;
  setFiles:           React.Dispatch<React.SetStateAction<AppFile[]>>;
  setNotes:           React.Dispatch<React.SetStateAction<Note[]>>;
  setReminders:       React.Dispatch<React.SetStateAction<Reminder[]>>;
  lockTask:           (taskId: number) => void;
  unlockTask:         (taskId: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────
export function DataProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [files,        setFiles]        = useState<AppFile[]>([]);
  const [notes,        setNotes]        = useState<Note[]>([]);
  const [reminders,    setReminders]    = useState<Reminder[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Ref — no re-renders when IDs are added/removed
  const pendingTaskIds = useRef<Set<number>>(new Set());

  const lockTask   = useCallback((id: number) => { pendingTaskIds.current.add(id);    }, []);
  const unlockTask = useCallback((id: number) => { pendingTaskIds.current.delete(id); }, []);

  // ── Full fetch ──────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const appsRes = await fetch("/api/applications");
      if (!appsRes.ok) throw new Error("Failed to fetch applications");
      const apps: Application[] = await appsRes.json();
      setApplications(apps);

      const tasksList:     Task[]     = [];
      const filesList:     AppFile[]  = [];
      const notesList:     Note[]     = [];
      const remindersList: Reminder[] = [];

      await Promise.all(
        apps.map(async (app) => {
          try {
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
          } catch { /* skip */ }

          if (app.notes?.trim()) {
            notesList.push({ id: app.id, notes: app.notes, application_id: app.id });
          }
        })
      );

      // Preserve optimistic state for any locked tasks even on full refresh
      setTasks(prev => {
        if (pendingTaskIds.current.size === 0) return tasksList;
        return tasksList.map(incoming => {
          if (pendingTaskIds.current.has(incoming.id)) {
            const current = prev.find(p => p.id === incoming.id);
            return current ? { ...incoming, done: current.done } : incoming;
          }
          return incoming;
        });
      });

      setFiles(filesList);
      setNotes(notesList);
      setReminders(remindersList);
    } catch (error) {
      console.error("DataContext: failed to fetch all data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Per-application refresh ─────────────────────────────────
  const refreshApplication = useCallback(async (appId: number) => {
    try {
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
        // ── THE FIX ──────────────────────────────────────────
        // MERGE incoming server tasks with current local state.
        // For any task ID that has an in-flight PATCH (in pendingTaskIds),
        // keep the current local done value rather than taking the
        // stale server value. This prevents the snap-back.
        setTasks(prev => {
          const otherApps = prev.filter(t => t.application_id !== appId);
          const merged    = appTasks.map(incoming => {
            if (pendingTaskIds.current.has(incoming.id)) {
              const current = prev.find(p => p.id === incoming.id);
              return current
                ? { ...incoming, application_id: appId, done: current.done }
                : { ...incoming, application_id: appId };
            }
            return { ...incoming, application_id: appId };
          });
          return [...otherApps, ...merged];
        });
      }

      if (fRes.ok) {
        const appFiles: AppFile[] = await fRes.json();
        setFiles(prev => [
          ...prev.filter(f => f.application_id !== appId),
          ...appFiles.map(f => ({ ...f, application_id: appId })),
        ]);
      }

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

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return (
    <DataContext.Provider value={{
      applications,
      tasks,
      files,
      notes,
      reminders,
      loading,
      refreshAll:         fetchAllData,
      refreshApplication,
      setApplications,
      setTasks,
      setFiles,
      setNotes,
      setReminders,
      lockTask,
      unlockTask,
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