"use client";
// ============================================================
//  components/ProfileModal.tsx
//  Edit-profile modal.  Opens when:
//    - window fires "profile:open" event (sidebar avatar / topnav avatar)
//    - profile.name is empty after login (first-time setup prompt)
//
//  Fields: name, college, university, department, year_level (batch)
// ============================================================

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";

const YEAR_LEVELS = [
  "1st Year (UG)",
  "2nd Year (UG)",
  "3rd Year (UG)",
  "4th Year (UG)",
  "5th Year (UG)",
  "1st Year (PG)",
  "2nd Year (PG)",
  "PhD / Research",
  "Working Professional",
  "Alumni",
];

export default function ProfileModal() {
  const { profile, refreshProfile } = useSession();
  const [open,       setOpen]       = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Form fields
  const [name,       setName]       = useState("");
  const [college,    setCollege]    = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [yearLevel,  setYearLevel]  = useState("");

  // Sync form from profile whenever modal opens
  useEffect(() => {
    if (open && profile) {
      setName(profile.name || "");
      setCollege(profile.college || "");
      setUniversity(profile.university || "");
      setDepartment(profile.department || "");
      setYearLevel(profile.year_level || "");
      setSaved(false);
      setError(null);
    }
  }, [open, profile]);

  // Listen for "profile:open" events from Sidebar / TopNav
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("profile:open", handler);
    return () => window.removeEventListener("profile:open", handler);
  }, []);

  // Auto-open for first-time users (profile loaded but name is blank)
  useEffect(() => {
    if (profile && !profile.name) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       name.trim(),
          college:    college.trim(),
          university: university.trim(),
          department: department.trim(),
          year_level: yearLevel,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Save failed");
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setOpen(false), 900);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isFirstTime = !profile?.name;

  return (
    <>
      <style>{`
        @keyframes pm-in {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pm-input {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.035);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 12px; padding: 12px 16px;
          font-size: 14px; color: #e8eaf2; outline: none;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: #4f8ef7;
        }
        .pm-input::placeholder { color: rgba(255,255,255,0.22); font-weight: 400; }
        .pm-input:focus {
          border-color: rgba(79,142,247,0.6);
          background: rgba(79,142,247,0.06);
          box-shadow: 0 0 0 3px rgba(79,142,247,0.14);
        }
        .pm-input:hover:not(:focus) { border-color: rgba(255,255,255,0.18); }
        .pm-select { appearance: none; cursor: pointer; }
        .pm-select option { background: #13161e; color: #e8eaf2; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={() => !isFirstTime && setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(10px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1001,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, pointerEvents: "none",
      }}>
        <div style={{
          width: "100%", maxWidth: 500,
          background: "linear-gradient(160deg, #13161f 0%, #0e1118 60%, #0b0e15 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,142,247,0.06)",
          animation: "pm-in 0.38s cubic-bezier(0.16,1,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "auto",
          position: "relative",
        }}>
          {/* Top shimmer */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, #4f8ef7 30%, #22d3ee 50%, #a78bfa 70%, transparent)",
          }} />

          {/* Header */}
          <div style={{
            padding: "28px 28px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <h2 style={{
                margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800,
                background: "linear-gradient(90deg, #4f8ef7, #a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {isFirstTime ? "Complete Your Profile" : "Edit Profile"}
              </h2>
              <p style={{
                margin: "6px 0 0", fontSize: 13,
                color: "rgba(255,255,255,0.38)",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {isFirstTime
                  ? "Tell us about yourself to personalise your experience"
                  : "Update your personal information"}
              </p>
            </div>
            {!isFirstTime && (
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#a1a8c6", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a8c6";
                }}
              >✕</button>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Avatar preview row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 14,
              background: "rgba(79,142,247,0.06)",
              border: "1px solid rgba(79,142,247,0.15)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                background: "linear-gradient(135deg,#4f8ef7,#a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "#fff",
                boxShadow: "0 0 18px rgba(79,142,247,0.4)",
              }}>
                {name
                  ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                  : "?"}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf2", fontFamily: "'DM Sans', sans-serif" }}>
                  {name || "Your Name"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                  {[department, yearLevel, college].filter(Boolean).join(" · ") || "Add your details below"}
                </div>
              </div>
            </div>

            {/* Name */}
            <Field label="Full Name *">
              <input
                className="pm-input"
                type="text"
                placeholder="e.g. Rahul Dev"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </Field>

            {/* Department */}
            <Field label="Department / Branch">
              <input
                className="pm-input"
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </Field>

            {/* Year level */}
            <Field label="Year / Level">
              <select
                className="pm-input pm-select"
                value={yearLevel}
                onChange={e => setYearLevel(e.target.value)}
              >
                <option value="">Select year / level…</option>
                {YEAR_LEVELS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>

            {/* College + University in a row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="College / Institute">
                <input
                  className="pm-input"
                  type="text"
                  placeholder="e.g. IIT Delhi"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                />
              </Field>
              <Field label="University">
                <input
                  className="pm-input"
                  type="text"
                  placeholder="e.g. Delhi University"
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                />
              </Field>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "0 28px 24px",
            display: "flex", justifyContent: "flex-end", gap: 10,
          }}>
            {!isFirstTime && (
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: "11px 22px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.18s",
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              style={{
                padding: "11px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif", cursor: saving ? "not-allowed" : "pointer",
                border: "none", color: "#fff",
                background: saved
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #4f8ef7 0%, #3b7ef0 100%)",
                boxShadow: saved
                  ? "0 4px 20px rgba(16,185,129,0.4)"
                  : "0 4px 20px rgba(79,142,247,0.4)",
                opacity: !name.trim() ? 0.5 : 1,
                transition: "all 0.25s",
                display: "flex", alignItems: "center", gap: 8,
                minWidth: 130, justifyContent: "center",
              }}
            >
              {saving ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Saving…
                </>
              ) : saved ? (
                <>✓ Saved!</>
              ) : (
                isFirstTime ? "Save & Continue →" : "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}