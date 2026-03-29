"use client";
import { useState, useEffect, useRef } from "react";
import type { Application } from "@/types";

const STATUS_COLORS: Record<string, {
  dot: string;
  bg: string;
  text: string;
  border: string;
  gradient: string;
  shadow: string;
}> = {
  Applied:   { dot: "#fbbf24", bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.3)",  gradient: "from-[#fbbf24]/10 to-[#fbbf24]/5", shadow: "0 4px 16px rgba(251,191,36,0.3)"  },
  OA:        { dot: "#22d3ee", bg: "rgba(34,211,238,0.12)",  text: "#22d3ee", border: "rgba(34,211,238,0.3)",  gradient: "from-[#22d3ee]/10 to-[#22d3ee]/5", shadow: "0 4px 16px rgba(34,211,238,0.3)"  },
  Interview: { dot: "#fb923c", bg: "rgba(251,146,60,0.12)",  text: "#fb923c", border: "rgba(251,146,60,0.3)",  gradient: "from-[#fb923c]/10 to-[#fb923c]/5", shadow: "0 4px 16px rgba(251,146,60,0.3)"  },
  Offer:     { dot: "#34d399", bg: "rgba(52,211,153,0.12)",  text: "#34d399", border: "rgba(52,211,153,0.3)",  gradient: "from-[#34d399]/10 to-[#34d399]/5", shadow: "0 4px 16px rgba(52,211,153,0.4)"  },
  Rejected:  { dot: "#f87171", bg: "rgba(248,113,113,0.12)", text: "#f87171", border: "rgba(248,113,113,0.3)", gradient: "from-[#f87171]/10 to-[#f87171]/5", shadow: "0 4px 16px rgba(248,113,113,0.3)" },
};

interface Task {
  id: number;
  text: string;
  done: boolean;
  dueDate?: string;
}

interface AppFile {
  id: number;
  name: string;
  icon: string;
  size: string;
  type: string;
  uploadedAt: string;
}

interface Reminder {
  id: number;
  title: string;
  date: string;
  time: string;
  type: "interview" | "deadline" | "followup";
}

const TIMELINE_STAGES = ["Applied", "OA", "Interview", "Offer"];

interface DrawerProps {
  app: Application | null;
  onClose: () => void;
  onUpdateApp?: (updatedApp: Partial<Application>) => void;
}

export default function Drawer({ app, onClose, onUpdateApp }: DrawerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<AppFile[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "files" | "notes" | "reminders">("tasks");

  // Animation state
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const prevApp = useRef<Application | null>(null);

  // Open animation
  useEffect(() => {
    if (app) {
      setMounted(true);
      setContentReady(false);
      // Stagger: drawer slides in first, then content fades
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
          setTimeout(() => setContentReady(true), 180);
        });
      });
      prevApp.current = app;
    } else {
      // Close: reverse
      setVisible(false);
      setContentReady(false);
      const t = setTimeout(() => setMounted(false), 340);
      return () => clearTimeout(t);
    }
  }, [app]);

  useEffect(() => {
    if (app) {
      setNotes(app.notes || "No notes yet...");
      setTasks([
        { id: 1, text: "Solve 3 DSA problems (LeetCode Medium)", done: false, dueDate: "15 Mar" },
        { id: 2, text: "Revise DBMS & SQL concepts", done: false, dueDate: "16 Mar" },
        { id: 3, text: "Prepare HR answers", done: app.status === "Interview", dueDate: "17 Mar" },
        { id: 4, text: "Research company culture & projects", done: false },
        { id: 5, text: "Practice behavioral questions", done: false, dueDate: "18 Mar" },
      ]);
      setFiles([
        { id: 1, name: "Resume_RahulDev_2025.pdf", icon: "📄", size: "1.2 MB", type: "pdf", uploadedAt: "12 Mar" },
        { id: 2, name: "CoverLetter_Google.pdf",   icon: "📝", size: "320 KB", type: "pdf", uploadedAt: "10 Mar" },
        { id: 3, name: "Screenshot_OA_Score.png",  icon: "🖼️", size: "245 KB", type: "image", uploadedAt: "05 Mar" },
      ]);
      setReminders([
        { id: 1, title: `${app.company} Technical Interview`, date: "20 Mar", time: "11:00 AM", type: "interview" },
        { id: 2, title: "Follow up with recruiter",           date: "25 Mar", time: "09:00 AM", type: "followup"  },
      ]);
    }
  }, [app]);

  const toggleTask = (id: number) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      if (onUpdateApp) onUpdateApp({ notes });
      return updated;
    });
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      setTasks(prev => [{
        id: Date.now(),
        text: newTaskText.trim(),
        done: false,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      }, ...prev]);
      setNewTaskText("");
      setShowAddTask(false);
    }
  };

  const deleteTask     = (id: number) => setTasks(prev => prev.filter(t => t.id !== id));
  const deleteFile     = (id: number) => setFiles(prev => prev.filter(f => f.id !== id));
  const deleteReminder = (id: number) => setReminders(prev => prev.filter(r => r.id !== id));

  const c = app ? STATUS_COLORS[app.status] ?? STATUS_COLORS.Applied : STATUS_COLORS.Applied;
  const currentStageIdx = app ? TIMELINE_STAGES.indexOf(app.status) : -1;
  const completedTasks = tasks.filter(t => t.done).length;

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 95,
          backdropFilter: visible ? "blur(12px)" : "blur(0px)",
          background: visible
            ? "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.75))"
            : "transparent",
          opacity: visible ? 1 : 0,
          transition: "opacity 320ms cubic-bezier(0.4,0,0.2,1), backdrop-filter 320ms cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* Drawer panel */}
      <aside
        style={{
          position: "fixed",
          top: 70,
          right: 0,
          height: "calc(100vh - 70px)",
          width: 440,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, rgba(19,22,30,0.97) 0%, rgba(15,17,23,0.97) 50%, rgba(10,12,16,0.97) 100%)",
          borderLeft: "1px solid rgba(45,51,82,0.6)",
          boxShadow: visible
            ? `-8px 0 60px rgba(0,0,0,0.6), -2px 0 20px rgba(79,142,247,0.08), inset 1px 0 0 rgba(255,255,255,0.04)`
            : "none",
          backdropFilter: "blur(24px)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 340ms cubic-bezier(0.32,0.72,0,1), box-shadow 340ms ease",
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        {/* Subtle top shimmer line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(79,142,247,0.5), rgba(167,139,250,0.5), transparent)",
          opacity: visible ? 1 : 0,
          transition: "opacity 600ms ease 200ms",
        }} />

        {/* Animated glow orb behind content */}
        <div style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.dot}18 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "background 600ms ease",
          opacity: visible ? 1 : 0,
        }} />

        {/* ── Header ── */}
        <div
          style={{
            padding: "24px 28px 22px",
            borderBottom: "1px solid rgba(35,40,64,0.6)",
            background: "linear-gradient(to right, rgba(19,22,30,0.95), rgba(24,28,38,0.95))",
            backdropFilter: "blur(20px)",
            flexShrink: 0,
            transform: contentReady ? "translateY(0)" : "translateY(-10px)",
            opacity: contentReady ? 1 : 0,
            transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1) 60ms, opacity 280ms ease 60ms",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                className="font-['Syne']"
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  background: "linear-gradient(90deg, #4f8ef7, #22d3ee, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 8px rgba(79,142,247,0.4))",
                }}
              >
                {app?.company}
              </div>
              <div style={{ fontSize: 14, color: "#a1a8c6", marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                {app?.role}
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, boxShadow: `0 0 8px ${c.dot}` }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => onUpdateApp?.({ status: "Offer" })}
                disabled={app?.status === "Offer" || app?.status === "Rejected"}
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.2))",
                  border: "1px solid rgba(52,211,153,0.4)",
                  color: "#34d399",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(52,211,153,0.35), rgba(16,185,129,0.35))";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(52,211,153,0.3)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.2))";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                🎉 Offer
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "rgba(24,28,38,0.7)",
                  border: "2px solid rgba(45,51,82,0.6)",
                  color: "#a1a8c6",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#4f8ef7";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,142,247,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(79,142,247,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "rotate(90deg) scale(1.1)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,28,38,0.7)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a8c6";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(45,51,82,0.6)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLButtonElement).style.transform = "rotate(0deg) scale(1)";
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ── Status & Tabs ── */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid rgba(35,40,64,0.5)",
            flexShrink: 0,
            transform: contentReady ? "translateY(0)" : "translateY(-8px)",
            opacity: contentReady ? 1 : 0,
            transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1) 100ms, opacity 280ms ease 100ms",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.dot, boxShadow: `0 0 20px ${c.dot}60` }} />
            <span style={{ fontSize: 14, color: "#a1a8c6", fontWeight: 600 }}>Status:</span>
            <div style={{
              padding: "8px 18px",
              borderRadius: 14,
              border: `2px solid ${c.border}`,
              background: c.bg,
              color: c.text,
              boxShadow: c.shadow,
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              backdropFilter: "blur(8px)",
            }}>
              {app?.status === "OA" ? "Online Assessment" : app?.status}
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            background: "rgba(24,28,38,0.5)",
            border: "1px solid rgba(45,51,82,0.5)",
            borderRadius: 16,
            padding: 4,
            backdropFilter: "blur(8px)",
          }}>
            {([
              { id: "tasks"     as const, label: `Tasks ${completedTasks}/${tasks.length}`, icon: "✅" },
              { id: "files"     as const, label: `Files ${files.length}`,                   icon: "📁" },
              { id: "notes"     as const, label: "Notes",                                   icon: "📝" },
              { id: "reminders" as const, label: `Reminders ${reminders.length}`,           icon: "🔔" },
            ]).map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 12px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === tab.id
                    ? "linear-gradient(135deg, #4f8ef7, #a78bfa)"
                    : "transparent",
                  color: activeTab === tab.id ? "#fff" : "#a1a8c6",
                  boxShadow: activeTab === tab.id ? "0 4px 16px rgba(79,142,247,0.35)" : "none",
                  transform: activeTab === tab.id ? "scale(1.04)" : "scale(1)",
                  transition: "all 220ms cubic-bezier(0.34,1.56,0.64,1)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                <span style={{ fontSize: 11 }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            scrollbarWidth: "none",
            opacity: contentReady ? 1 : 0,
            transform: contentReady ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 360ms ease 160ms, transform 360ms cubic-bezier(0.34,1.2,0.64,1) 160ms",
          }}
        >
          {/* Timeline */}
          <AnimatedSection title="📅 Timeline" delay={0} contentReady={contentReady}>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {TIMELINE_STAGES.map((stage, i) => {
                const done = i <= currentStageIdx && app?.status !== "Rejected";
                return (
                  <TimelineRow key={stage} stage={stage} done={done} i={i} total={TIMELINE_STAGES.length} app={app} />
                );
              })}
            </div>
          </AnimatedSection>

          {/* Tab content */}
          <div style={{ marginTop: 24 }}>
            {activeTab === "tasks" && (
              <TasksTab
                tasks={tasks}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onAddTask={() => setShowAddTask(true)}
                showAddTask={showAddTask}
                newTaskText={newTaskText}
                onNewTaskChange={setNewTaskText}
                onAddNewTask={addTask}
                onCancelAddTask={() => { setNewTaskText(""); setShowAddTask(false); }}
                contentReady={contentReady}
              />
            )}
            {activeTab === "files"     && <FilesTab files={files} onDelete={deleteFile} contentReady={contentReady} />}
            {activeTab === "notes"     && <NotesTab notes={notes} onChange={setNotes} contentReady={contentReady} />}
            {activeTab === "reminders" && <RemindersTab reminders={reminders} onDelete={deleteReminder} contentReady={contentReady} />}
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </>
  );
}

/* ─── Timeline Row ─── */
function TimelineRow({ stage, done, i, total, app }: {
  stage: string; done: boolean; i: number; total: number; app: Application | null;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        padding: "12px 12px",
        borderRadius: 12,
        background: hovered ? "rgba(24,28,38,0.6)" : "transparent",
        transition: "background 200ms ease",
        animation: `fadeSlideUp 320ms cubic-bezier(0.34,1.2,0.64,1) ${i * 60 + 200}ms both`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0, paddingTop: 2 }}>
        <div style={{
          width: done ? 18 : 14,
          height: done ? 18 : 14,
          borderRadius: "50%",
          flexShrink: 0,
          background: done ? "linear-gradient(135deg, #4f8ef7, #a78bfa)" : "rgba(45,51,82,0.6)",
          border: done ? "none" : "2px solid rgba(79,142,247,0.4)",
          boxShadow: done ? "0 0 16px rgba(79,142,247,0.7)" : "none",
          transition: "all 300ms cubic-bezier(0.34,1.56,0.64,1)",
        }} />
        {i < total - 1 && (
          <div style={{
            width: 2,
            minHeight: 28,
            background: done ? "linear-gradient(to bottom, rgba(79,142,247,0.8), rgba(167,139,250,0.6))" : "rgba(35,40,64,0.4)",
            marginTop: 4,
            borderRadius: 2,
            transition: "background 400ms ease",
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf2", marginBottom: 2 }}>
          {stage === "OA" ? "Online Assessment" : stage}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#a1a8c6" }}>
            {i === 0 ? app?.date : done ? "✅ Completed" : "○ Pending"}
          </span>
          {done && (
            <span style={{
              fontSize: 11,
              background: "rgba(79,142,247,0.2)",
              color: "#4f8ef7",
              padding: "2px 10px",
              borderRadius: 20,
              fontWeight: 700,
              animation: "scaleIn 280ms cubic-bezier(0.34,1.56,0.64,1) both",
            }}>✓ Done</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Section wrapper ─── */
function AnimatedSection({ title, children, delay, contentReady }: {
  title: string; children: React.ReactNode; delay: number; contentReady: boolean;
}) {
  return (
    <div style={{
      opacity: contentReady ? 1 : 0,
      transform: contentReady ? "translateY(0)" : "translateY(10px)",
      transition: `opacity 300ms ease ${delay}ms, transform 300ms ease ${delay}ms`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#a1a8c6",
        marginBottom: 16, paddingBottom: 12,
        borderBottom: "1px solid rgba(35,40,64,0.4)",
      }}>
        <span style={{ fontSize: 18 }}>{title.split(" ")[0]}</span>
        <span>{title.slice(2)}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(79,142,247,0.3), transparent)" }} />
      </div>
      {children}
    </div>
  );
}

/* ─── Tasks Tab ─── */
function TasksTab({ tasks, onToggle, onDelete, onAddTask, showAddTask, newTaskText, onNewTaskChange, onAddNewTask, onCancelAddTask, contentReady }: {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAddTask: () => void;
  showAddTask: boolean;
  newTaskText: string;
  onNewTaskChange: (text: string) => void;
  onAddNewTask: () => void;
  onCancelAddTask: () => void;
  contentReady: boolean;
}) {
  const completed = tasks.filter(t => t.done).length;
  return (
    <AnimatedSection title={`✅ Tasks • ${completed}/${tasks.length}`} delay={80} contentReady={contentReady}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.map((task, i) => (
          <div key={task.id} style={{ animation: `fadeSlideUp 280ms cubic-bezier(0.34,1.2,0.64,1) ${i * 40}ms both` }}>
            <TaskItem task={task} onToggle={() => onToggle(task.id)} onDelete={() => onDelete(task.id)} />
          </div>
        ))}
        {showAddTask ? (
          <div style={{
            padding: 16,
            background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.08))",
            border: "2px dashed rgba(79,142,247,0.4)",
            borderRadius: 16,
            animation: "scaleIn 220ms cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                autoFocus
                value={newTaskText}
                onChange={e => onNewTaskChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onAddNewTask()}
                placeholder="Add new task..."
                style={{
                  flex: 1,
                  background: "rgba(24,28,38,0.7)",
                  border: "1px solid rgba(45,51,82,0.5)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 14,
                  color: "#e8eaf2",
                  outline: "none",
                  transition: "border-color 200ms ease",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(79,142,247,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(45,51,82,0.5)")}
              />
              <button
                onClick={onAddNewTask}
                disabled={!newTaskText.trim()}
                style={{
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #4f8ef7, #3b7ef0)",
                  color: "#fff",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  opacity: newTaskText.trim() ? 1 : 0.5,
                  transition: "all 200ms ease",
                }}
              >Add</button>
              <button
                onClick={onCancelAddTask}
                style={{
                  width: 44, height: 44,
                  background: "rgba(24,28,38,0.7)",
                  border: "1px solid rgba(45,51,82,0.5)",
                  borderRadius: 12,
                  color: "#a1a8c6",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#a1a8c6"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(24,28,38,0.7)"; }}
              >✕</button>
            </div>
          </div>
        ) : (
          <button
            onClick={onAddTask}
            style={{
              width: "100%",
              padding: "16px 24px",
              background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.08))",
              border: "2px dashed rgba(79,142,247,0.35)",
              borderRadius: 16,
              color: "#a1a8c6",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all 250ms ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,142,247,0.6)";
              (e.currentTarget as HTMLButtonElement).style.color = "#4f8ef7";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.15)";
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,142,247,0.35)";
              (e.currentTarget as HTMLButtonElement).style.color = "#a1a8c6";
              (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.08))";
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            ➕ Add New Task
          </button>
        )}
      </div>
    </AnimatedSection>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        borderRadius: 14,
        cursor: "pointer",
        background: task.done
          ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.12))"
          : hovered ? "rgba(79,142,247,0.08)" : "rgba(24,28,38,0.7)",
        border: task.done
          ? "1px solid rgba(16,185,129,0.4)"
          : `1px solid ${hovered ? "rgba(79,142,247,0.4)" : "rgba(45,51,82,0.5)"}`,
        boxShadow: hovered && !task.done ? "0 4px 20px rgba(79,142,247,0.15)" : "none",
        transition: "all 220ms cubic-bezier(0.34,1.2,0.64,1)",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          width: 24, height: 24,
          borderRadius: 8,
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: task.done ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.08)",
          border: task.done ? "none" : "2px solid rgba(79,142,247,0.35)",
          boxShadow: task.done ? "0 4px 12px rgba(16,185,129,0.5)" : "none",
          transform: task.done ? "scale(1.12) rotate(0deg)" : "scale(1)",
          transition: "all 260ms cubic-bezier(0.34,1.56,0.64,1)",
          cursor: "pointer",
        }}
      >
        {task.done && <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600,
          color: task.done ? "#a1a8c6" : "#e8eaf2",
          textDecoration: task.done ? "line-through" : "none",
          transition: "all 200ms ease",
          margin: 0,
        }}>{task.text}</p>
        {task.dueDate && (
          <span style={{ fontSize: 12, color: "#a1a8c6", marginTop: 2, display: "block" }}>📅 {task.dueDate}</span>
        )}
      </div>
      <button
        onClick={onDelete}
        style={{
          width: 32, height: 32,
          borderRadius: 10,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hovered ? 1 : 0,
          transition: "all 180ms ease",
          color: "#a1a8c6",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#a1a8c6"; }}
      >🗑️</button>
    </div>
  );
}

/* ─── Files Tab ─── */
function FilesTab({ files, onDelete, contentReady }: { files: AppFile[]; onDelete: (id: number) => void; contentReady: boolean }) {
  return (
    <AnimatedSection title="📁 Files & Documents" delay={80} contentReady={contentReady}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {files.map((file, i) => (
          <div key={file.id} style={{ animation: `fadeSlideUp 280ms cubic-bezier(0.34,1.2,0.64,1) ${i * 50}ms both` }}>
            <FileItem file={file} onDelete={() => onDelete(file.id)} />
          </div>
        ))}
        <UploadDropZone />
      </div>
    </AnimatedSection>
  );
}

function FileItem({ file, onDelete }: { file: AppFile; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        borderRadius: 14,
        background: hovered ? "rgba(79,142,247,0.08)" : "rgba(24,28,38,0.7)",
        border: `1px solid ${hovered ? "rgba(79,142,247,0.45)" : "rgba(45,51,82,0.5)"}`,
        boxShadow: hovered ? "0 4px 20px rgba(79,142,247,0.15)" : "none",
        transition: "all 220ms ease",
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{file.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf2", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</p>
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#a1a8c6", marginTop: 2 }}>
          <span>{file.size}</span><span>•</span><span>{file.type.toUpperCase()}</span><span>•</span><span>{file.uploadedAt}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, opacity: hovered ? 1 : 0, transition: "opacity 180ms ease" }}>
        <button style={{ padding: "6px 12px", background: "rgba(79,142,247,0.2)", border: "1px solid rgba(79,142,247,0.4)", color: "#4f8ef7", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View</button>
        <button onClick={onDelete} style={{ width: 34, height: 34, background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🗑️</button>
      </div>
    </div>
  );
}

/* ─── Notes Tab ─── */
function NotesTab({ notes, onChange, contentReady }: { notes: string; onChange: (n: string) => void; contentReady: boolean }) {
  return (
    <AnimatedSection title="📝 Interview Notes" delay={80} contentReady={contentReady}>
      <textarea
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder="Write detailed notes about your interview experience..."
        rows={8}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "rgba(24,28,38,0.7)",
          border: "2px solid rgba(45,51,82,0.5)",
          borderRadius: 16,
          padding: "16px 18px",
          fontSize: 15,
          color: "#e8eaf2",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 250ms ease, box-shadow 250ms ease",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "rgba(79,142,247,0.6)";
          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(79,142,247,0.12)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "rgba(45,51,82,0.5)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(35,40,64,0.5)" }}>
        <button style={{
          flex: 1, padding: "12px 24px",
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
          transition: "all 200ms ease",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"}
        >💾 Save Notes</button>
        <button style={{
          padding: "12px 20px",
          background: "rgba(79,142,247,0.2)",
          border: "1px solid rgba(79,142,247,0.4)",
          color: "#4f8ef7", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
          transition: "all 200ms ease",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.35)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.2)"}
        >🎙️ AI Summary</button>
      </div>
    </AnimatedSection>
  );
}

/* ─── Reminders Tab ─── */
function RemindersTab({ reminders, onDelete, contentReady }: { reminders: Reminder[]; onDelete: (id: number) => void; contentReady: boolean }) {
  return (
    <AnimatedSection title="🔔 Upcoming Reminders" delay={80} contentReady={contentReady}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reminders.map((r, i) => (
          <div key={r.id} style={{ animation: `fadeSlideUp 280ms cubic-bezier(0.34,1.2,0.64,1) ${i * 60}ms both` }}>
            <ReminderItem reminder={r} onDelete={() => onDelete(r.id)} />
          </div>
        ))}
        <button style={{
          width: "100%", padding: "16px 24px",
          background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(139,92,246,0.1))",
          border: "2px dashed rgba(167,139,250,0.4)",
          borderRadius: 16, color: "#a78bfa", fontSize: 15, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 250ms ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(167,139,250,0.7)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.2)"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.01)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(167,139,250,0.4)"; (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(139,92,246,0.1))"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >⏰ Add Reminder</button>
      </div>
    </AnimatedSection>
  );
}

function ReminderItem({ reminder, onDelete }: { reminder: Reminder; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const getIcon = (type: Reminder["type"]) =>
    type === "interview" ? "🎙️" : type === "deadline" ? "⏰" : "📧";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        borderRadius: 14,
        background: hovered
          ? "linear-gradient(135deg, rgba(24,28,38,0.9), rgba(19,22,30,0.9))"
          : "linear-gradient(135deg, rgba(24,28,38,0.8), rgba(19,22,30,0.8))",
        border: `1px solid ${hovered ? "rgba(167,139,250,0.5)" : "rgba(45,51,82,0.5)"}`,
        boxShadow: hovered ? "0 6px 24px rgba(167,139,250,0.15)" : "none",
        transition: "all 220ms ease",
      }}
    >
      <div style={{
        width: 52, height: 52,
        borderRadius: 14,
        background: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(139,92,246,0.25))",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transform: hovered ? "scale(1.08) rotate(-4deg)" : "scale(1) rotate(0deg)",
        transition: "transform 260ms cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <span style={{ fontSize: 22 }}>{getIcon(reminder.type)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf2", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{reminder.title}</h4>
        <p style={{ fontSize: 13, color: "#fb923c", fontWeight: 600, margin: "2px 0 0" }}>{reminder.date} • {reminder.time}</p>
      </div>
      <div style={{ display: "flex", gap: 8, opacity: hovered ? 1 : 0, transition: "opacity 180ms ease" }}>
        <button style={{ padding: "6px 12px", background: "rgba(167,139,250,0.25)", border: "1px solid rgba(167,139,250,0.45)", color: "#a78bfa", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Complete</button>
        <button onClick={onDelete} style={{ width: 38, height: 38, background: "rgba(248,113,113,0.25)", border: "1px solid rgba(248,113,113,0.45)", color: "#f87171", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🗑️</button>
      </div>
    </div>
  );
}

/* ─── Upload Drop Zone ─── */
function UploadDropZone() {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => setDragOver(false)}
      style={{
        border: `2px dashed ${dragOver ? "rgba(79,142,247,0.8)" : "rgba(79,142,247,0.35)"}`,
        borderRadius: 16,
        padding: "28px 20px",
        background: dragOver
          ? "rgba(79,142,247,0.12)"
          : "linear-gradient(135deg, rgba(79,142,247,0.05), rgba(167,139,250,0.05))",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 220ms ease",
        transform: dragOver ? "scale(1.02)" : "scale(1)",
      }}
    >
      <div style={{
        width: 56, height: 56,
        background: "rgba(79,142,247,0.15)",
        border: "2px solid rgba(79,142,247,0.35)",
        borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px",
        fontSize: 22,
        transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
        transform: dragOver ? "scale(1.2) translateY(-4px)" : "scale(1)",
      }}>⬆</div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf2", margin: "0 0 4px" }}>Drop files here</h4>
      <p style={{ fontSize: 13, color: "#a1a8c6", margin: "0 0 16px" }}>PDF, DOC, Images (Max 10MB)</p>
      <button style={{
        padding: "8px 20px",
        background: "linear-gradient(135deg, #4f8ef7, #3b7ef0)",
        color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 13,
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(79,142,247,0.3)",
        transition: "all 200ms ease",
      }}>Select Files</button>
    </div>
  );
}