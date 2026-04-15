// app/tasks/page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import SubPageTopNav from "@/components/SubPageTopNav";
import { useData } from "@/contexts/DataContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type EnrichedTask = {
  id: number;
  text: string;
  done: boolean;
  due_date?: string | null;
  application_id: number;
  application_company: string;
  application_role: string;
  application_status: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Applied:   "#fbbf24",
  OA:        "#22d3ee",
  Interview: "#fb923c",
  Offer:     "#34d399",
  Rejected:  "#f87171",
};

// ─── Animated circular progress ring ─────────────────────────────────────────
function RingProgress({
  percent, size = 110, stroke = 9, color = "#4f8ef7",
}: {
  percent: number; size?: number; stroke?: number; color?: string;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const target   = percent;
    const duration = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimated(target * ease);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [percent]);

  const dashOffset = circ - (animated / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#e8eaf2" fontSize={size * 0.18} fontWeight={800} fontFamily="inherit">
        {Math.round(animated)}%
      </text>
    </svg>
  );
}

// ─── Animated horizontal progress bar ────────────────────────────────────────
function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(percent), 60);
    return () => clearTimeout(t);
  }, [percent]);
  return (
    <div style={{
      height: 5, borderRadius: 99,
      background: "rgba(255,255,255,0.07)", overflow: "hidden", flex: 1,
    }}>
      <div style={{
        height: "100%", borderRadius: 99, width: `${w}%`,
        background: color,
        boxShadow: `0 0 8px ${color}60`,
        transition: "width 800ms cubic-bezier(0.34,1.2,0.64,1)",
      }} />
    </div>
  );
}

// ─── TaskItem ─────────────────────────────────────────────────────────────────
function TaskItem({
  task, onToggle, onDelete, toggling, deleting, formatDueDate, isOverdue,
}: {
  task: EnrichedTask;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
  deleting: boolean;
  formatDueDate: (d: string | null | undefined) => string;
  isOverdue:     (d: string | null | undefined) => boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const dueDisplay = formatDueDate(task.due_date);
  const overdue    = !task.done && isOverdue(task.due_date);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px", borderRadius: 12,
        background: task.done
          ? "linear-gradient(135deg, rgba(16,185,129,0.09), rgba(5,150,105,0.05))"
          : hovered ? "rgba(79,142,247,0.07)" : "rgba(255,255,255,0.02)",
        border: task.done
          ? "1px solid rgba(16,185,129,0.25)"
          : `1px solid ${hovered ? "rgba(79,142,247,0.3)" : "rgba(45,51,82,0.35)"}`,
        transition: "all 240ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={toggling ? undefined : onToggle}
        style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: task.done
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "rgba(255,255,255,0.05)",
          border: task.done ? "none" : "2px solid rgba(79,142,247,0.3)",
          cursor: toggling ? "wait" : "pointer",
          opacity: toggling ? 0.6 : 1,
          transition: "all 220ms ease",
          boxShadow: task.done ? "0 0 10px rgba(16,185,129,0.35)" : "none",
        }}
      >
        {toggling
          ? <span style={{ fontSize: 9, color: "#a1a8c6" }}>…</span>
          : task.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 600,
          color: task.done ? "rgba(255,255,255,0.32)" : "#dde1f0",
          textDecoration: task.done ? "line-through" : "none",
          transition: "all 280ms ease",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {task.text}
        </div>
        {dueDisplay && (
          <div style={{ fontSize: 11, marginTop: 3, color: overdue ? "#f87171" : "#525a7a" }}>
            📅 Due {dueDisplay}{overdue && " · overdue"}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={onDelete} disabled={deleting}
        style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: "transparent", border: "none",
          cursor: deleting ? "wait" : "pointer",
          color: hovered ? "#f87171" : "transparent",
          fontSize: 14, transition: "all 160ms ease",
        }}
      >
        {deleting ? "…" : "🗑️"}
      </button>
    </div>
  );
}

// ─── Application Group Card ────────────────────────────────────────────────────
function AppGroupCard({
  company, role, status, tasks, onToggle, onDelete,
  togglingId, deletingId, formatDueDate, isOverdue, defaultOpen,
}: {
  company: string; role: string; status: string;
  tasks: EnrichedTask[];
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  togglingId: number | null; deletingId: number | null;
  formatDueDate: (d: string | null | undefined) => string;
  isOverdue:     (d: string | null | undefined) => boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  const sc    = STATUS_COLORS[status] ?? "#a1a8c6";
  const pending   = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  return (
    <div style={{
      borderRadius: 20, overflow: "hidden",
      border: "1px solid rgba(45,51,82,0.5)",
      background: "rgba(16,20,32,0.8)",
      backdropFilter: "blur(14px)",
      boxShadow: open ? "0 8px 32px rgba(0,0,0,0.22)" : "none",
      transition: "box-shadow 240ms ease",
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 14, padding: "15px 20px",
          cursor: "pointer", userSelect: "none",
          background: open ? "rgba(79,142,247,0.04)" : "transparent",
          borderBottom: open ? "1px solid rgba(45,51,82,0.35)" : "none",
          transition: "all 200ms ease",
        }}
      >
        {/* Status dot */}
        <div style={{
          width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
          background: sc, boxShadow: `0 0 8px ${sc}90`,
        }} />

        {/* Company + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#e2e6f5",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {company}
          </div>
          <div style={{ fontSize: 12, color: "#525a7a", marginTop: 1 }}>{role}</div>
        </div>

        {/* Progress mini bar */}
        <div style={{ width: 130, display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#525a7a" }}>
            <span>{done}/{total}</span>
            <span style={{ color: pct === 100 ? "#34d399" : "#a1a8c6", fontWeight: 700 }}>{pct}%</span>
          </div>
          <ProgressBar percent={pct} color={pct === 100 ? "#34d399" : sc} />
        </div>

        {/* Status chip */}
        <div style={{
          padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
          background: `${sc}18`, color: sc, border: `1px solid ${sc}30`, flexShrink: 0,
        }}>
          {status}
        </div>

        {/* Pending badge */}
        {pending.length > 0 && (
          <div style={{
            minWidth: 20, height: 20, borderRadius: 99, padding: "0 6px",
            background: "rgba(251,146,60,0.2)", color: "#fb923c",
            fontSize: 11, fontWeight: 800, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {pending.length}
          </div>
        )}

        {/* Chevron */}
        <div style={{
          color: "#4f8ef7", fontSize: 11, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 260ms cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          ▼
        </div>
      </div>

      {/* Expandable task list */}
      {open && (
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Pending tasks */}
          {pending.length > 0 && (
            <div>
              <div style={{
                fontSize: 10.5, fontWeight: 800, color: "#fb923c",
                letterSpacing: "0.08em", marginBottom: 8,
              }}>
                ⏳ PENDING · {pending.length}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pending.map(task => (
                  <TaskItem key={task.id} task={task}
                    onToggle={() => onToggle(task.id, task.done)}
                    onDelete={() => onDelete(task.id)}
                    toggling={togglingId === task.id}
                    deleting={deletingId === task.id}
                    formatDueDate={formatDueDate} isOverdue={isOverdue}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <div style={{ marginTop: pending.length > 0 ? 10 : 0 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 800, color: "#34d399",
                letterSpacing: "0.08em", marginBottom: 8,
              }}>
                ✅ COMPLETED · {completed.length}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {completed.map(task => (
                  <TaskItem key={task.id} task={task}
                    onToggle={() => onToggle(task.id, task.done)}
                    onDelete={() => onDelete(task.id)}
                    toggling={togglingId === task.id}
                    deleting={deletingId === task.id}
                    formatDueDate={formatDueDate} isOverdue={isOverdue}
                  />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#3a4060", fontSize: 13 }}>
              No tasks for this application.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search }: { search: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "56px 20px",
      background: "rgba(255,255,255,0.015)", borderRadius: 20,
      border: "1px dashed rgba(79,142,247,0.22)", color: "#3a4060",
    }}>
      <div style={{ fontSize: 46, marginBottom: 12 }}>📋</div>
      <p style={{ color: "#525a7a", fontWeight: 600, margin: 0 }}>
        {search ? "No tasks match your search." : "No tasks yet."}
      </p>
      <p style={{ fontSize: 13, marginTop: 6, color: "#3a4060" }}>
        Add tasks from the application drawer to stay organized.
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { applications, tasks, loading, setTasks, lockTask, unlockTask } = useData();

  const [search,     setSearch]     = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewMode,   setViewMode]   = useState<"grouped" | "all">("grouped");

  // ── Enrich tasks ──────────────────────────────────────────────────────────
  const enrichedTasks = useMemo<EnrichedTask[]>(() => {
    return tasks.map(t => {
      const app = applications.find(a => a.id === t.application_id);
      return {
        ...t,
        application_company: app?.company ?? "Unknown",
        application_role:    app?.role    ?? "Unknown",
        application_status:  app?.status  ?? "Applied",
      };
    });
  }, [tasks, applications]);

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const totalTasks     = enrichedTasks.length;
  const completedCount = enrichedTasks.filter(t => t.done).length;
  const pendingCount   = totalTasks - completedCount;
  const overdueCount   = enrichedTasks.filter(t => !t.done && isOverdue(t.due_date)).length;
  const overallPct     = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  // ── Group by application ──────────────────────────────────────────────────
  const appGroups = useMemo(() => {
    const map = new Map<number, EnrichedTask[]>();
    enrichedTasks.forEach(t => {
      if (!map.has(t.application_id)) map.set(t.application_id, []);
      map.get(t.application_id)!.push(t);
    });
    return Array.from(map.entries())
      .map(([appId, ts]) => ({
        appId,
        tasks:   ts,
        company: ts[0].application_company,
        role:    ts[0].application_role,
        status:  ts[0].application_status,
        pending: ts.filter(t => !t.done).length,
      }))
      .sort((a, b) => b.pending - a.pending || b.tasks.length - a.tasks.length);
  }, [enrichedTasks]);

  // ── Filtered groups ───────────────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return appGroups;
    const q = search.toLowerCase();
    return appGroups
      .map(g => ({
        ...g,
        tasks: g.tasks.filter(t =>
          t.text.toLowerCase().includes(q) ||
          t.application_company.toLowerCase().includes(q) ||
          t.application_role.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.tasks.length > 0);
  }, [appGroups, search]);

  // ── Flat filtered ─────────────────────────────────────────────────────────
  const filteredAll = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedTasks
      .filter(t =>
        t.text.toLowerCase().includes(q) ||
        t.application_company.toLowerCase().includes(q) ||
        t.application_role.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return b.id - a.id;
      });
  }, [enrichedTasks, search]);

  // ── FIXED: Task toggle handler ────────────────────────────────────────────
  const handleToggleTask = async (taskId: number, currentDone: boolean) => {
    // Prevent double-clicks/spam
    if (togglingId !== null) return;
    
    setTogglingId(taskId);
    
    // ✅ CRITICAL: LOCK FIRST - prevents refreshApplication from overwriting
    lockTask(taskId);

    // ✅ Optimistic update - UI responds instantly
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, done: !currentDone } : t)
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      // ✅ Server success - local state is now correct
      console.log(`✅ Task ${taskId} toggled successfully`);
      
    } catch (error) {
      console.error("❌ Task toggle failed:", error);
      
      // ✅ Revert optimistic update on ACTUAL server failure
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, done: currentDone } : t)
      );
    } finally {
      // ✅ CRITICAL: UNLOCK LAST - now safe for refreshApplication to use server data
      unlockTask(taskId);
      setTogglingId(null);
    }
  };

  // ── FIXED: Task delete handler ────────────────────────────────────────────
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Delete this task permanently?")) return;
    
    if (deletingId !== null) return;
    
    setDeletingId(taskId);
    const taskToDelete = tasks.find(t => t.id === taskId);
    
    // ✅ Optimistic delete
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
    } catch (error) {
      console.error("❌ Task delete failed:", error);
      
      // ✅ Restore on failure
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ── Date helpers ──────────────────────────────────────────────────────────
  function formatDueDate(dueDate: string | null | undefined): string {
    if (!dueDate) return "";
    if (dueDate.match(/^\d{2} [A-Za-z]{3}$/)) return dueDate;
    try {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) return dueDate;
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    } catch { 
      return dueDate; 
    }
  }

  function isOverdue(dueDate: string | null | undefined): boolean {
    if (!dueDate) return false;
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    
    let taskDate: Date;
    if (dueDate.match(/^\d{2} [A-Za-z]{3}$/)) {
      const [day, month] = dueDate.split(" ");
      const monthMap: Record<string, number> = {
        Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
        Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11,
      };
      taskDate = new Date(new Date().getFullYear(), monthMap[month as keyof typeof monthMap], parseInt(day));
    } else {
      taskDate = new Date(dueDate);
    }
    return taskDate < today;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <SubPageTopNav title="Tasks" searchQuery={search} onSearchChange={setSearch} />

      <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#a1a8c6" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "3px solid rgba(79,142,247,0.2)", 
                borderTopColor: "#4f8ef7",
                animation: "spin 0.8s linear infinite", 
                margin: "0 auto 16px",
              }} />
              Loading your tasks...
            </div>
          ) : (
            <>
              {/* ── Progress Dashboard ─────────────────────────────────── */}
              <div style={{
                display: "grid", gridTemplateColumns: "auto 1fr", gap: 24,
                marginBottom: 24, padding: "22px 26px", borderRadius: 22,
                background: "linear-gradient(135deg, rgba(16,20,34,0.97), rgba(20,26,46,0.93))",
                border: "1px solid rgba(79,142,247,0.15)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}>
                {/* Animated ring */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <RingProgress
                    percent={overallPct}
                    color={
                      overallPct === 100 ? "#34d399"
                      : overallPct > 60  ? "#4f8ef7"
                      : "#fb923c"
                    }
                  />
                  <div style={{ fontSize: 10, color: "#3a4060", fontWeight: 700, letterSpacing: "0.08em" }}>
                    OVERALL PROGRESS
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                  {/* Stat boxes */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "TOTAL",     value: totalTasks,     color: "#dde1f0" },
                      { label: "PENDING",   value: pendingCount,   color: "#fb923c" },
                      { label: "DONE",      value: completedCount, color: "#34d399" },
                      { label: "OVERDUE",   value: overdueCount,   color: "#f87171" },
                    ].map(s => (
                      <div key={s.label} style={{
                        padding: "11px 12px", borderRadius: 12, textAlign: "center",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                          {s.value}
                        </div>
                        <div style={{ fontSize: 10, color: "#3a4060", marginTop: 4, fontWeight: 700, letterSpacing: "0.06em" }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Per-application mini bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {appGroups.slice(0, 5).map(g => {
                      const pct = g.tasks.length === 0 ? 0
                        : Math.round((g.tasks.filter(t => t.done).length / g.tasks.length) * 100);
                      const sc = STATUS_COLORS[g.status] ?? "#a1a8c6";
                      return (
                        <div key={g.appId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: sc, flexShrink: 0,
                          }} />
                          <div style={{
                            fontSize: 12, color: "#7a82a0", width: 120, flexShrink: 0,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {g.company}
                          </div>
                          <ProgressBar percent={pct} color={pct === 100 ? "#34d399" : sc} />
                          <div style={{
                            fontSize: 11, color: pct === 100 ? "#34d399" : "#525a7a",
                            width: 30, textAlign: "right", flexShrink: 0, fontWeight: 700,
                          }}>
                            {pct}%
                          </div>
                        </div>
                      );
                    })}
                    {appGroups.length > 5 && (
                      <div style={{ fontSize: 11, color: "#3a4060", paddingLeft: 16 }}>
                        +{appGroups.length - 5} more applications
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── View mode toggle ───────────────────────────────────── */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{
                  display: "flex", gap: 3, padding: 4,
                  background: "rgba(16,20,32,0.9)", borderRadius: 13,
                  border: "1px solid rgba(45,51,82,0.45)",
                }}>
                  {([
                    { id: "grouped" as const, label: "By Application", icon: "🗂️" },
                    { id: "all"     as const, label: "All Tasks",       icon: "📋" },
                  ]).map(v => (
                    <button 
                      key={v.id} 
                      onClick={() => setViewMode(v.id)} 
                      style={{
                        padding: "8px 15px", borderRadius: 9, fontSize: 12.5, fontWeight: 700,
                        border: "none", cursor: "pointer",
                        background: viewMode === v.id
                          ? "linear-gradient(135deg, #4f8ef7, #7c6af7)"
                          : "transparent",
                        color: viewMode === v.id ? "#fff" : "#525a7a",
                        boxShadow: viewMode === v.id ? "0 3px 12px rgba(79,142,247,0.38)" : "none",
                        transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <span>{v.icon}</span> {v.label}
                    </button>
                  ))}
                </div>

                {search.trim() && (
                  <div style={{ fontSize: 12, color: "#525a7a" }}>
                    Showing results for{" "}
                    <span style={{ color: "#a1a8c6", fontWeight: 600 }}>"{search}"</span>
                  </div>
                )}
              </div>

              {/* ── Grouped view ───────────────────────────────────────── */}
              {viewMode === "grouped" && (
                filteredGroups.length === 0
                  ? <EmptyState search={search} />
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {filteredGroups.map((g, i) => (
                        <AppGroupCard
                          key={g.appId}
                          company={g.company} 
                          role={g.role} 
                          status={g.status}
                          tasks={g.tasks}
                          onToggle={handleToggleTask} 
                          onDelete={handleDeleteTask}
                          togglingId={togglingId} 
                          deletingId={deletingId}
                          formatDueDate={formatDueDate} 
                          isOverdue={isOverdue}
                          defaultOpen={i === 0}
                        />
                      ))}
                    </div>
                  )
              )}

              {/* ── Flat "All tasks" view ──────────────────────────────── */}
              {viewMode === "all" && (
                filteredAll.length === 0
                  ? <EmptyState search={search} />
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                      {filteredAll.filter(t => !t.done).length > 0 && (
                        <div>
                          <div style={{
                            fontSize: 12, fontWeight: 800, color: "#fb923c",
                            letterSpacing: "0.07em", marginBottom: 10,
                            display: "flex", alignItems: "center", gap: 8,
                          }}>
                            ⏳ PENDING
                            <span style={{
                              padding: "2px 8px", borderRadius: 99, fontSize: 10.5,
                              background: "rgba(251,146,60,0.14)", color: "#fb923c",
                              fontWeight: 800,
                            }}>
                              {filteredAll.filter(t => !t.done).length}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {filteredAll.filter(t => !t.done).map(task => (
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

                      {filteredAll.filter(t => t.done).length > 0 && (
                        <div>
                          <div style={{
                            fontSize: 12, fontWeight: 800, color: "#34d399",
                            letterSpacing: "0.07em", marginBottom: 10,
                            display: "flex", alignItems: "center", gap: 8,
                          }}>
                            ✅ COMPLETED
                            <span style={{
                              padding: "2px 8px", borderRadius: 99, fontSize: 10.5,
                              background: "rgba(52,211,153,0.14)", color: "#34d399",
                              fontWeight: 800,
                            }}>
                              {filteredAll.filter(t => t.done).length}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {filteredAll.filter(t => t.done).map(task => (
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
                    </div>
                  )
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}