// app/tasks/page.tsx
"use client";

import { useState, useMemo } from "react";
import SubPageTopNav from "@/components/SubPageTopNav";
import { useData } from "@/contexts/DataContext";

export default function TasksPage() {
  const { applications, tasks, loading, refreshApplication, setTasks } = useData();

  const [search,     setSearch]     = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Enrich tasks with company/role from applications ─────────────────────
  const enrichedTasks = useMemo(() => {
    return tasks
      .map(t => {
        const app = applications.find(a => a.id === t.application_id);
        return {
          ...t,
          application_company: app?.company ?? "Unknown",
          application_role:    app?.role    ?? "Unknown",
        };
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.due_date && b.due_date)
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return b.id - a.id;
      });
  }, [tasks, applications]);

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredTasks = enrichedTasks.filter(t =>
    t.text.toLowerCase().includes(search.toLowerCase()) ||
    t.application_company.toLowerCase().includes(search.toLowerCase()) ||
    t.application_role.toLowerCase().includes(search.toLowerCase())
  );

  const incompleteTasks = filteredTasks.filter(t => !t.done);
  const completedTasks  = filteredTasks.filter(t => t.done);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleTask = async (taskId: number, currentDone: boolean) => {
    setTogglingId(taskId);
    // Optimistic update in context
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !currentDone } : t));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone }),
      });
      // Sync context properly (covers sidebar badge)
      const task = tasks.find(t => t.id === taskId);
      if (task) refreshApplication(task.application_id);
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: currentDone } : t));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeletingId(taskId);
    const task = tasks.find(t => t.id === taskId);
    // Optimistic remove from context
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (task) refreshApplication(task.application_id);
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDueDate = (dueDate: string | null | undefined): string => {
    if (!dueDate) return "";
    if (dueDate.match(/^\d{2} [A-Za-z]{3}$/)) return dueDate;
    try {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) return dueDate;
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    } catch { return dueDate; }
  };

  const isOverdue = (dueDate: string | null | undefined): boolean => {
    if (!dueDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let taskDate: Date;
    if (dueDate.match(/^\d{2} [A-Za-z]{3}$/)) {
      const [day, month] = dueDate.split(" ");
      const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      taskDate = new Date(new Date().getFullYear(), monthMap[month], parseInt(day));
    } else { taskDate = new Date(dueDate); }
    return taskDate < today;
  };

  return (
    <>
      <SubPageTopNav title="Tasks" searchQuery={search} onSearchChange={setSearch} />
      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#a1a8c6" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(79,142,247,0.2)", borderTopColor: "#4f8ef7",
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
            }} />
            Loading your tasks...
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div style={{
              display: "flex", gap: 20, marginBottom: 32, padding: "20px 24px",
              background: "rgba(24,28,38,0.5)", borderRadius: 20,
              border: "1px solid rgba(45,51,82,0.5)",
            }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#e8eaf2" }}>{tasks.length}</div>
                <div style={{ fontSize: 12, color: "#a1a8c6" }}>Total Tasks</div>
              </div>
              <div style={{ width: 1, background: "rgba(45,51,82,0.5)" }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#34d399" }}>
                  {tasks.filter(t => t.done).length}
                </div>
                <div style={{ fontSize: 12, color: "#a1a8c6" }}>Completed</div>
              </div>
              <div style={{ width: 1, background: "rgba(45,51,82,0.5)" }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#f97316" }}>
                  {tasks.filter(t => !t.done).length}
                </div>
                <div style={{ fontSize: 12, color: "#a1a8c6" }}>Pending</div>
              </div>
            </div>

            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h3 style={{
                  fontSize: 16, fontWeight: 700, color: "#f97316",
                  marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>⏳</span> In Progress ({incompleteTasks.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {incompleteTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task.id, task.done)}
                      onDelete={() => handleDeleteTask(task.id)}
                      toggling={togglingId === task.id}
                      deleting={deletingId === task.id}
                      formatDueDate={formatDueDate}
                      isOverdue={isOverdue}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: 16, fontWeight: 700, color: "#34d399",
                  marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>✅</span> Completed ({completedTasks.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {completedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggleTask(task.id, task.done)}
                      onDelete={() => handleDeleteTask(task.id)}
                      toggling={togglingId === task.id}
                      deleting={deletingId === task.id}
                      formatDueDate={formatDueDate}
                      isOverdue={isOverdue}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredTasks.length === 0 && (
              <div style={{
                textAlign: "center", padding: 60,
                background: "rgba(255,255,255,0.02)", borderRadius: 20,
                border: "1px dashed rgba(79,142,247,0.3)", color: "#a1a8c6",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p>No tasks found.</p>
                <p style={{ fontSize: 13 }}>Add tasks from the application drawer to stay organized.</p>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function TaskItem({
  task, onToggle, onDelete, toggling, deleting, formatDueDate, isOverdue,
}: {
  task: { id: number; text: string; done: boolean; due_date?: string | null; application_company: string; application_role: string };
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
  deleting: boolean;
  formatDueDate: (d: string | null | undefined) => string;
  isOverdue: (d: string | null | undefined) => boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const dueDisplay = formatDueDate(task.due_date);
  const overdue    = !task.done && isOverdue(task.due_date);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14,
        background: task.done
          ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))"
          : hovered ? "rgba(79,142,247,0.08)" : "rgba(24,28,38,0.7)",
        border: task.done
          ? "1px solid rgba(16,185,129,0.35)"
          : `1px solid ${hovered ? "rgba(79,142,247,0.4)" : "rgba(45,51,82,0.5)"}`,
        transition: "all 220ms ease",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          width: 26, height: 26, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: task.done ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.08)",
          border: task.done ? "none" : "2px solid rgba(79,142,247,0.4)",
          cursor: toggling ? "wait" : "pointer", transition: "all 200ms ease",
        }}
      >
        {task.done && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: task.done ? "rgba(255,255,255,0.4)" : "#e8eaf2",
          textDecoration: task.done ? "line-through" : "none", transition: "all 200ms ease",
        }}>
          {task.text}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, marginTop: 4, color: "#a1a8c6" }}>
          <span>{task.application_company} — {task.application_role}</span>
          {dueDisplay && (
            <>
              <span>•</span>
              <span style={{ color: overdue ? "#f87171" : "#a1a8c6" }}>
                Due: {dueDisplay}{overdue && " (overdue)"}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        disabled={deleting}
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: "transparent", border: "none",
          cursor: deleting ? "wait" : "pointer",
          color: hovered ? "#f87171" : "rgba(255,255,255,0.2)",
          fontSize: 16, transition: "all 180ms ease",
          opacity: hovered ? 1 : 0,
        }}
      >
        {deleting ? "..." : "🗑️"}
      </button>
    </div>
  );
}