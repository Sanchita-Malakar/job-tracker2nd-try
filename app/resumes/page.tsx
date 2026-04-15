// app/resumes/page.tsx
"use client";

import { useState, useMemo } from "react";
import SubPageTopNav from "@/components/SubPageTopNav";
import { useData } from "@/contexts/DataContext";

export default function ResumesPage() {
  const { applications, files, notes, loading } = useData();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"files" | "notes">("files");

  // ── Enrich files with company/role ───────────────────────
  const enrichedFiles = useMemo(() => {
    return files
      .map(f => {
        const app = applications.find(a => a.id === f.application_id);
        return {
          ...f,
          company: app?.company ?? "Unknown",
          role:    app?.role    ?? "Unknown",
          status:  app?.status  ?? "Applied",
        };
      })
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }, [files, applications]);

  // ── Enrich notes with company/role ───────────────────────
  const enrichedNotes = useMemo(() => {
    return notes
      .map(n => {
        const app = applications.find(a => a.id === n.application_id);
        return {
          ...n,
          company:   app?.company ?? "Unknown",
          role:      app?.role    ?? "Unknown",
          status:    app?.status  ?? "Applied",
          updatedAt: app?.date    ?? "",
        };
      })
      .filter(n => n.notes.trim().length > 0);
  }, [notes, applications]);

  // ── Filter ───────────────────────────────────────────────
  const filteredFiles = enrichedFiles.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.company.toLowerCase().includes(search.toLowerCase()) ||
    f.role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNotes = enrichedNotes.filter(n =>
    n.notes.toLowerCase().includes(search.toLowerCase()) ||
    n.company.toLowerCase().includes(search.toLowerCase()) ||
    n.role.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const fileIcon = (type: string) => {
    if (type === "pdf")   return "📄";
    if (type === "image") return "🖼️";
    return "📁";
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const STATUS_COLORS: Record<string, string> = {
    Applied: "#fbbf24", OA: "#22d3ee", Interview: "#fb923c",
    Offer: "#34d399", Rejected: "#f87171",
  };

  // ── Open file in new tab ──────────────────────────────────
  const handleOpenFile = (file: typeof enrichedFiles[number]) => {
    // Support both a direct URL field and a fallback path pattern
    const url = (file as any).url ?? (file as any).file_url ?? `/api/files/${file.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    // FIX: page wrapper must NOT be a flex column that overflows —
    // give it a fixed height so inner content can scroll independently.
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <SubPageTopNav title="Resumes & Notes" searchQuery={search} onSearchChange={setSearch} />

      {/* FIX: scrollable content area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#a1a8c6" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "3px solid rgba(79,142,247,0.2)", borderTopColor: "#4f8ef7",
                animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
              }} />
              Loading your documents...
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div style={{
                display: "flex", gap: 20, marginBottom: 32, padding: "20px 24px",
                background: "rgba(24,28,38,0.5)", borderRadius: 20,
                border: "1px solid rgba(45,51,82,0.5)",
              }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#e8eaf2" }}>{files.length}</div>
                  <div style={{ fontSize: 12, color: "#a1a8c6" }}>Total Files</div>
                </div>
                <div style={{ width: 1, background: "rgba(45,51,82,0.5)" }} />
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#4f8ef7" }}>{notes.length}</div>
                  <div style={{ fontSize: 12, color: "#a1a8c6" }}>Applications with Notes</div>
                </div>
                <div style={{ width: 1, background: "rgba(45,51,82,0.5)" }} />
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#a78bfa" }}>
                    {new Set(files.map(f => f.application_id)).size}
                  </div>
                  <div style={{ fontSize: 12, color: "#a1a8c6" }}>Applications with Files</div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: "flex", gap: 4, marginBottom: 24,
                background: "rgba(24,28,38,0.5)", border: "1px solid rgba(45,51,82,0.5)",
                borderRadius: 16, padding: 4, width: "fit-content",
              }}>
                {[
                  { id: "files" as const, label: `Files (${filteredFiles.length})`,  icon: "📁" },
                  { id: "notes" as const, label: `Notes (${filteredNotes.length})`,  icon: "📝" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                      border: "none", cursor: "pointer",
                      background: activeTab === tab.id
                        ? "linear-gradient(135deg, #4f8ef7, #a78bfa)"
                        : "transparent",
                      color: activeTab === tab.id ? "#fff" : "#a1a8c6",
                      boxShadow: activeTab === tab.id ? "0 4px 16px rgba(79,142,247,0.35)" : "none",
                      transition: "all 220ms cubic-bezier(0.34,1.56,0.64,1)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Files tab ── */}
              {activeTab === "files" && (
                <>
                  {filteredFiles.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: 60,
                      background: "rgba(255,255,255,0.02)", borderRadius: 20,
                      border: "1px dashed rgba(79,142,247,0.3)", color: "#a1a8c6",
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
                      <p>{search ? "No files match your search." : "No files uploaded yet."}</p>
                      <p style={{ fontSize: 13 }}>Upload files from the application drawer.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {filteredFiles.map(file => (
                        <div
                          key={file.id}
                          onClick={() => handleOpenFile(file)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === "Enter" && handleOpenFile(file)}
                          style={{
                            display: "flex", alignItems: "center", gap: 16,
                            padding: "16px 20px", borderRadius: 16,
                            background: "rgba(24,28,38,0.7)",
                            border: "1px solid rgba(45,51,82,0.5)",
                            transition: "all 200ms ease",
                            cursor: "pointer",         // FIX: shows it's clickable
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(79,142,247,0.4)";
                            (e.currentTarget as HTMLDivElement).style.background = "rgba(79,142,247,0.08)";
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(79,142,247,0.15)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(45,51,82,0.5)";
                            (e.currentTarget as HTMLDivElement).style.background = "rgba(24,28,38,0.7)";
                            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                          }}
                        >
                          {/* File icon */}
                          <div style={{
                            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                            background: "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(167,139,250,0.2))",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                          }}>
                            {fileIcon(file.file_type)}
                          </div>

                          {/* File info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 700, color: "#e8eaf2",
                              marginBottom: 4, whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {file.name}
                            </div>
                            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#a1a8c6", flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{
                                  width: 6, height: 6, borderRadius: "50%",
                                  background: STATUS_COLORS[file.status] ?? "#a1a8c6",
                                  display: "inline-block",
                                }} />
                                {file.company} — {file.role}
                              </span>
                              <span>·</span>
                              <span>📅 {formatDate(file.uploaded_at)}</span>
                              <span>·</span>
                              <span>{formatBytes(file.size_bytes)}</span>
                            </div>
                          </div>

                          {/* Status badge + open hint */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <div style={{
                              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: `${STATUS_COLORS[file.status] ?? "#a1a8c6"}20`,
                              color: STATUS_COLORS[file.status] ?? "#a1a8c6",
                              border: `1px solid ${STATUS_COLORS[file.status] ?? "#a1a8c6"}40`,
                            }}>
                              {file.status}
                            </div>
                            {/* FIX: Open icon so user knows file is clickable */}
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: "rgba(79,142,247,0.12)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, color: "#4f8ef7",
                            }}>
                              ↗
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Notes tab ── */}
              {activeTab === "notes" && (
                <>
                  {filteredNotes.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: 60,
                      background: "rgba(255,255,255,0.02)", borderRadius: 20,
                      border: "1px dashed rgba(79,142,247,0.3)", color: "#a1a8c6",
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                      <p>{search ? "No notes match your search." : "No interview notes saved yet."}</p>
                      <p style={{ fontSize: 13 }}>Write notes from the application drawer.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {filteredNotes.map(note => (
                        <div
                          key={note.id}
                          style={{
                            padding: "20px 24px", borderRadius: 16,
                            background: "rgba(24,28,38,0.7)",
                            border: "1px solid rgba(45,51,82,0.5)",
                            transition: "all 200ms ease",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(79,142,247,0.4)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(45,51,82,0.5)";
                          }}
                        >
                          {/* Header */}
                          <div style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between", marginBottom: 12,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: STATUS_COLORS[note.status] ?? "#a1a8c6",
                                boxShadow: `0 0 8px ${STATUS_COLORS[note.status] ?? "#a1a8c6"}`,
                                display: "inline-block",
                              }} />
                              <span style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf2" }}>{note.company}</span>
                              <span style={{ fontSize: 13, color: "#a1a8c6" }}>— {note.role}</span>
                            </div>
                            <div style={{
                              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: `${STATUS_COLORS[note.status] ?? "#a1a8c6"}20`,
                              color: STATUS_COLORS[note.status] ?? "#a1a8c6",
                              border: `1px solid ${STATUS_COLORS[note.status] ?? "#a1a8c6"}40`,
                            }}>
                              {note.status}
                            </div>
                          </div>
                          {/* Note content preview */}
                          <p style={{
                            fontSize: 13, color: "rgba(255,255,255,0.65)",
                            margin: 0, lineHeight: 1.7,
                            display: "-webkit-box", WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical", overflow: "hidden",
                            whiteSpace: "pre-wrap",
                          }}>
                            {note.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}