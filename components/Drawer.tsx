"use client";
import { useState, useEffect } from "react";
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

// FIX: renamed from "File" to "AppFile" — "File" conflicts with the browser's built-in File API
// and causes TypeScript to crash with a type resolution loop, which manifests as infinite compiling.
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

  const isOpen = app !== null;
  const c = app ? STATUS_COLORS[app.status] ?? STATUS_COLORS.Applied : STATUS_COLORS.Applied;
  const currentStageIdx = app ? TIMELINE_STAGES.indexOf(app.status) : -1;
  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;

  if (!app) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-b from-black/50 to-black/80 backdrop-blur-[12px] z-[95]"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-[70px] right-0 h-[calc(100vh-70px)] w-[440px] z-[100]
          bg-gradient-to-br from-[#13161e]/95 via-[#0f1117]/95 to-[#0a0c10]/95
          border-l border-[#2d3352]/60
          shadow-2xl flex flex-col backdrop-blur-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          transition-all duration-300 ease-out
        `}
      >
        {/* Header */}
        <div className="px-7 py-6 border-b border-[#232840]/60 bg-gradient-to-r from-[#13161e]/95 to-[#181c26]/95 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-['Syne'] text-[22px] font-black bg-gradient-to-r from-[#4f8ef7] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent drop-shadow-lg">
                {app.company}
              </div>
              <div className="text-[14px] text-[#a1a8c6] mt-1 font-semibold flex items-center gap-2">
                {app.role}
                <span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateApp?.({ status: "Offer" })}
                className="px-4 py-2 bg-gradient-to-r from-[#34d399]/20 to-[#10b981]/20 border border-[#34d399]/40 text-[#34d399] text-[13px] font-bold rounded-xl backdrop-blur-sm hover:from-[#34d399]/40 hover:shadow-lg hover:shadow-[#34d399]/30 transition-all duration-200 cursor-pointer"
                disabled={app.status === "Offer" || app.status === "Rejected"}
              >
                🎉 Offer
              </button>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-[#181c26]/70 border-2 border-[#2d3352]/60 flex items-center justify-center text-[#a1a8c6] text-xl backdrop-blur-sm hover:bg-[#4f8ef7]/30 hover:text-[#4f8ef7] hover:border-[#4f8ef7]/50 hover:shadow-xl hover:shadow-[#4f8ef7]/30 transition-all duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Status & Tabs */}
        <div className="px-7 py-5 border-b border-[#232840]/50 flex-shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-3 h-3 rounded-full shadow-xl" style={{ background: c.dot, boxShadow: `0 0 20px ${c.dot}60` }} />
            <span className="text-[14px] text-[#a1a8c6] font-semibold">Status:</span>
            <div
              className="px-5 py-2.5 rounded-2xl border-2 shadow-xl font-bold text-sm uppercase tracking-wide backdrop-blur-sm"
              style={{ background: c.bg, color: c.text, borderColor: c.border, boxShadow: c.shadow }}
            >
              {app.status === "OA" ? "Online Assessment" : app.status}
            </div>
          </div>

          <div className="flex bg-[#181c26]/50 border border-[#2d3352]/50 rounded-2xl p-1 backdrop-blur-sm">
            {([
              { id: "tasks"     as const, label: `Tasks ${completedTasks}/${totalTasks}`, icon: "✅" },
              { id: "files"     as const, label: `Files ${files.length}`,                 icon: "📁" },
              { id: "notes"     as const, label: "Notes",                                 icon: "📝" },
              { id: "reminders" as const, label: `Reminders ${reminders.length}`,         icon: "🔔" },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#4f8ef7] to-[#a78bfa] text-white shadow-lg shadow-[#4f8ef7]/30"
                    : "text-[#a1a8c6] hover:text-[#e8eaf2] hover:bg-[#4f8ef7]/20 hover:shadow-md"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 scrollbar-thin">
          <Section title="📅 Timeline" className="border-t border-[#232840]/30 pt-6">
            <div className="space-y-5">
              {TIMELINE_STAGES.map((stage, i) => {
                const done = i <= currentStageIdx && app.status !== "Rejected";
                return (
                  <div key={stage} className="flex items-start gap-5 pb-5 last:pb-0 group hover:bg-[#181c26]/50 p-3 rounded-xl transition-all duration-200">
                    <div className="flex flex-col items-center w-7 flex-shrink-0 relative pt-1">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 transition-all duration-300 ${done ? "bg-gradient-to-r from-[#4f8ef7] to-[#a78bfa] shadow-[0_0_16px_rgba(79,142,247,0.7)] scale-125" : "bg-[#2d3352]/60 border-2 border-[#4f8ef7]/40 shadow-md"}`} />
                      {i < TIMELINE_STAGES.length - 1 && (
                        <div className={`flex-1 w-px mx-auto mt-2 transition-all duration-300 ${done ? "bg-gradient-to-b from-[#4f8ef7]/80 to-[#a78bfa]/80" : "bg-[#232840]/40"}`} style={{ minHeight: 28 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#e8eaf2] mb-1 truncate">
                        {stage === "OA" ? "Online Assessment" : stage}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#a1a8c6]">
                          {i === 0 ? app.date : done ? "✅ Completed" : "○ Pending"}
                        </span>
                        {done && (
                          <span className="text-[11px] bg-[#4f8ef7]/20 text-[#4f8ef7] px-2.5 py-1 rounded-full font-bold">✓ Done</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

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
            />
          )}
          {activeTab === "files"     && <FilesTab files={files} onDelete={deleteFile} />}
          {activeTab === "notes"     && <NotesTab notes={notes} onChange={setNotes} />}
          {activeTab === "reminders" && <RemindersTab reminders={reminders} onDelete={deleteReminder} />}
        </div>
      </aside>
    </>
  );
}

function TasksTab({ tasks, onToggle, onDelete, onAddTask, showAddTask, newTaskText, onNewTaskChange, onAddNewTask, onCancelAddTask }: {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAddTask: () => void;
  showAddTask: boolean;
  newTaskText: string;
  onNewTaskChange: (text: string) => void;
  onAddNewTask: () => void;
  onCancelAddTask: () => void;
}) {
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;

  return (
    <Section title={`✅ Tasks • ${completed}/${total}`}>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} onToggle={() => onToggle(task.id)} onDelete={() => onDelete(task.id)} />
        ))}
        {showAddTask ? (
          <div className="p-4 bg-gradient-to-r from-[#4f8ef7]/10 to-[#a78bfa]/10 border-2 border-dashed border-[#4f8ef7]/40 rounded-2xl">
            <div className="flex gap-3">
              <input
                value={newTaskText}
                onChange={e => onNewTaskChange(e.target.value)}
                placeholder="Add new task..."
                className="flex-1 bg-[#181c26]/70 border border-[#2d3352]/50 rounded-xl px-4 py-3 text-[14px] text-[#e8eaf2] outline-none placeholder:text-[#a1a8c6] focus:border-[#4f8ef7]/50 transition-all duration-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={onAddNewTask}
                  disabled={!newTaskText.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-[#4f8ef7] to-[#3b7ef0] text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Add
                </button>
                <button
                  onClick={onCancelAddTask}
                  className="w-12 h-12 bg-[#181c26]/70 border border-[#2d3352]/50 rounded-xl flex items-center justify-center text-[#a1a8c6] hover:text-[#f87171] hover:bg-[#f87171]/20 transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onAddTask}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#4f8ef7]/10 to-[#a78bfa]/10 border-2 border-dashed border-[#4f8ef7]/40 rounded-2xl text-[#a1a8c6] text-lg font-bold hover:border-[#4f8ef7]/70 hover:bg-[#4f8ef7]/20 hover:text-[#4f8ef7] transition-all duration-300 flex items-center justify-center gap-3"
          >
            ➕ Add New Task
          </button>
        )}
      </div>
    </Section>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-200 ${task.done ? "bg-gradient-to-r from-[#10b981]/20 to-[#059669]/20 border border-[#10b981]/40" : "bg-[#181c26]/70 border border-[#2d3352]/50 hover:border-[#4f8ef7]/40 hover:bg-[#4f8ef7]/10"}`}>
      <div
        onClick={onToggle}
        className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-300 cursor-pointer ${task.done ? "bg-gradient-to-r from-[#10b981] to-[#059669] border-2 border-transparent shadow-lg shadow-[#10b981]/40 scale-110" : "bg-white/10 border-2 border-[#4f8ef7]/30 hover:border-[#4f8ef7]/60"}`}
      >
        {task.done && <span className="text-white font-bold text-lg">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-semibold transition-all duration-200 ${task.done ? "line-through text-[#a1a8c6]" : "text-[#e8eaf2]"}`}>{task.text}</p>
        {task.dueDate && <span className="text-[12px] text-[#a1a8c6] mt-0.5 block">📅 {task.dueDate}</span>}
      </div>
      <button
        onClick={onDelete}
        className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-[#a1a8c6] opacity-0 group-hover:opacity-100 hover:bg-[#f87171]/20 hover:text-[#f87171] hover:shadow-md transition-all duration-200"
      >
        🗑️
      </button>
    </div>
  );
}

// FIX: prop type updated to AppFile[]
function FilesTab({ files, onDelete }: { files: AppFile[]; onDelete: (id: number) => void }) {
  return (
    <Section title="📁 Files & Documents">
      <div className="space-y-3">
        {files.map(file => (
          <div key={file.id} className="group flex items-center gap-4 p-4 bg-[#181c26]/70 border border-[#2d3352]/50 rounded-2xl hover:border-[#4f8ef7]/50 hover:bg-[#4f8ef7]/10 transition-all duration-300">
            <span className="text-2xl flex-shrink-0">{file.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#e8eaf2] truncate">{file.name}</p>
              <div className="flex items-center gap-4 text-[12px] text-[#a1a8c6]">
                <span>{file.size}</span><span>•</span>
                <span>{file.type.toUpperCase()}</span><span>•</span>
                <span>{file.uploadedAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button className="px-3 py-1.5 bg-[#4f8ef7]/20 border border-[#4f8ef7]/40 text-[#4f8ef7] rounded-xl text-sm font-bold hover:bg-[#4f8ef7]/40 transition-all duration-200">View</button>
              <button onClick={() => onDelete(file.id)} className="w-9 h-9 bg-[#f87171]/20 border border-[#f87171]/40 text-[#f87171] rounded-xl flex items-center justify-center hover:bg-[#f87171]/40 transition-all duration-200">🗑️</button>
            </div>
          </div>
        ))}
        <UploadDropZone />
      </div>
    </Section>
  );
}

function NotesTab({ notes, onChange }: { notes: string; onChange: (notes: string) => void }) {
  return (
    <Section title="📝 Interview Notes">
      <textarea
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder="Write detailed notes about your interview experience..."
        rows={8}
        className="w-full bg-[#181c26]/70 border-2 border-[#2d3352]/50 rounded-2xl px-5 py-5 text-[15px] text-[#e8eaf2] resize-none outline-none placeholder:text-[#a1a8c6] focus:border-[#4f8ef7]/60 focus:shadow-[0_0_0_4px_rgba(79,142,247,0.25)] hover:border-[#4f8ef7]/40 transition-all duration-300"
      />
      <div className="flex gap-3 pt-4 border-t border-[#232840]/50 mt-6">
        <button className="flex-1 py-3 px-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-xl font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all duration-200">💾 Save Notes</button>
        <button className="px-6 py-3 bg-[#4f8ef7]/20 border border-[#4f8ef7]/40 text-[#4f8ef7] rounded-xl font-bold text-sm hover:bg-[#4f8ef7]/40 transition-all duration-200">🎙️ AI Summary</button>
      </div>
    </Section>
  );
}

function RemindersTab({ reminders, onDelete }: { reminders: Reminder[]; onDelete: (id: number) => void }) {
  return (
    <Section title="🔔 Upcoming Reminders">
      <div className="space-y-3">
        {reminders.map(reminder => (
          <ReminderItem key={reminder.id} reminder={reminder} onDelete={() => onDelete(reminder.id)} />
        ))}
        <button className="w-full py-4 px-6 bg-gradient-to-r from-[#a78bfa]/20 to-[#8b5cf6]/20 border-2 border-dashed border-[#a78bfa]/40 rounded-2xl text-[#a78bfa] text-lg font-bold hover:border-[#a78bfa]/70 hover:bg-[#a78bfa]/20 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3">
          ⏰ Add Reminder
        </button>
      </div>
    </Section>
  );
}

function ReminderItem({ reminder, onDelete }: { reminder: Reminder; onDelete: () => void }) {
  const getIcon = (type: Reminder["type"]) => {
    if (type === "interview") return "🎙️";
    if (type === "deadline")  return "⏰";
    if (type === "followup")  return "📧";
    return "🔔";
  };

  return (
    <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-[#181c26]/80 to-[#13161e]/80 border border-[#2d3352]/50 rounded-2xl hover:border-[#a78bfa]/50 hover:shadow-xl transition-all duration-300">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#a78bfa]/30 to-[#8b5cf6]/30 flex items-center justify-center shadow-lg flex-shrink-0">
        <span className="text-2xl">{getIcon(reminder.type)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-[#e8eaf2] truncate">{reminder.title}</h4>
        <p className="text-[13px] text-[#fb923c] font-semibold">{reminder.date} • {reminder.time}</p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button className="px-3 py-2 bg-[#a78bfa]/30 border border-[#a78bfa]/50 text-[#a78bfa] rounded-xl text-xs font-bold hover:bg-[#a78bfa]/50 transition-all duration-200">Complete</button>
        <button onClick={onDelete} className="w-10 h-10 bg-[#f87171]/30 border border-[#f87171]/50 text-[#f87171] rounded-xl flex items-center justify-center hover:bg-[#f87171]/50 transition-all duration-200">🗑️</button>
      </div>
    </div>
  );
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 text-[13px] font-bold tracking-[1.2px] uppercase text-[#a1a8c6] mb-5 pb-3 border-b border-[#232840]/40">
        <span className="text-xl">{title.split(" ")[0]}</span>
        <span>{title.slice(2)}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#4f8ef7]/30 to-transparent" />
      </div>
      {children}
    </div>
  );
}

function UploadDropZone() {
  return (
    <div className="border-2 border-dashed border-[#4f8ef7]/40 rounded-2xl p-8 bg-gradient-to-br from-[#4f8ef7]/5 to-[#a78bfa]/5 hover:border-[#4f8ef7]/60 hover:shadow-xl transition-all duration-300 text-center group cursor-pointer">
      <div className="w-16 h-16 bg-[#4f8ef7]/20 border-2 border-[#4f8ef7]/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
        <span className="text-2xl">⬆</span>
      </div>
      <h4 className="text-lg font-bold text-[#e8eaf2] mb-1">Drop files here</h4>
      <p className="text-[#a1a8c6] text-sm mb-4">PDF, DOC, Images (Max 10MB)</p>
      <button className="px-6 py-2.5 bg-gradient-to-r from-[#4f8ef7] to-[#3b7ef0] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200">Select Files</button>
    </div>
  );
}