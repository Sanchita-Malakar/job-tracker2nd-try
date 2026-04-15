// app/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SubPageTopNav from "@/components/SubPageTopNav";
import { useSession } from "@/components/SessionProvider";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────
type Section = "profile" | "account" | "notifications" | "data" | "danger";

const YEAR_LEVELS = [
  "1st Year (UG)", "2nd Year (UG)", "3rd Year (UG)",
  "4th Year (UG)", "5th Year (UG)",
  "1st Year (PG)", "2nd Year (PG)",
  "PhD / Research", "Working Professional", "Alumni",
];

const NAV_ITEMS: { id: Section; label: string; icon: string; desc: string }[] = [
  { id: "profile",       label: "Profile",        icon: "◎", desc: "Name, college, department" },
  { id: "account",       label: "Account",         icon: "⊞", desc: "Email, password" },
  { id: "notifications", label: "Notifications",   icon: "◈", desc: "Email alert preferences" },
  { id: "data",          label: "Your data",       icon: "⊡", desc: "Export & download" },
  { id: "danger",        label: "Danger zone",     icon: "⚠", desc: "Delete account" },
];

// ── Shared input style ────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "11px 14px",
  fontSize: 14, color: "#e8eaf2",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  transition: "border-color 220ms ease, box-shadow 220ms ease",
};

function Input({
  label, value, onChange, type = "text", placeholder, disabled,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...inputStyle,
          borderColor: focused ? "rgba(79,142,247,0.55)" : "rgba(255,255,255,0.1)",
          boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.12)" : "none",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer", colorScheme: "dark" }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SaveBtn({ saving, saved, disabled, onClick, label = "Save changes" }: {
  saving: boolean; saved: boolean; disabled?: boolean;
  onClick: () => void; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      style={{
        padding: "11px 24px", borderRadius: 12, border: "none",
        fontSize: 14, fontWeight: 700, cursor: saving || disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif",
        background: saved
          ? "linear-gradient(135deg,#10b981,#059669)"
          : "linear-gradient(135deg,#4f8ef7,#a78bfa)",
        color: "#fff",
        boxShadow: saved ? "0 4px 16px rgba(16,185,129,0.35)" : "0 4px 16px rgba(79,142,247,0.35)",
        opacity: saving || disabled ? 0.6 : 1,
        transition: "all 220ms ease",
        display: "flex", alignItems: "center", gap: 8,
        minWidth: 140, justifyContent: "center",
      }}
    >
      {saving ? (
        <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "st-spin 0.7s linear infinite", display: "inline-block" }} /> Saving…</>
      ) : saved ? "✓ Saved!" : label}
    </button>
  );
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf2", fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none",
          background: checked ? "#4f8ef7" : "rgba(255,255,255,0.12)",
          cursor: "pointer", position: "relative", flexShrink: 0,
          transition: "background 220ms ease",
          boxShadow: checked ? "0 0 12px rgba(79,142,247,0.4)" : "none",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          transition: "left 220ms cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

function SectionCard({ children, title, desc }: { children: React.ReactNode; title?: string; desc?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: 28, position: "relative", overflow: "hidden",
      animation: "st-fade 400ms ease both",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(79,142,247,0.4),transparent)" }} />
      {title && <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e8eaf2", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" }}>{title}</h3>}
      {desc && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>}
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function SettingsPage() {
  const router         = useRouter();
  const { profile, refreshProfile } = useSession();
  const [active,  setActive]  = useState<Section>("profile");

  // Profile fields
  const [name,       setName]       = useState("");
  const [college,    setCollege]    = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [yearLevel,  setYearLevel]  = useState("");
  const [profSaving, setProfSaving] = useState(false);
  const [profSaved,  setProfSaved]  = useState(false);
  const [profError,  setProfError]  = useState<string | null>(null);

  // Account fields
  const [email,        setEmail]        = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [passSaving,   setPassSaving]   = useState(false);
  const [passSaved,    setPassSaved]    = useState(false);
  const [passError,    setPassError]    = useState<string | null>(null);

  // Notification prefs
  const [notifReminder,  setNotifReminder]  = useState(true);
  const [notifWeekly,    setNotifWeekly]    = useState(false);
  const [notifTips,      setNotifTips]      = useState(true);
  const [notifSaving,    setNotifSaving]    = useState(false);
  const [notifSaved,     setNotifSaved]     = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // Danger zone
  const [deleteInput,   setDeleteInput]   = useState("");
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // Seed form from profile
  useEffect(() => {
    if (!profile) return;
    setName(profile.name       ?? "");
    setCollege(profile.college    ?? "");
    setUniversity(profile.university ?? "");
    setDepartment(profile.department ?? "");
    setYearLevel(profile.year_level  ?? "");
    setEmail(profile.email      ?? "");
  }, [profile]);

  // ── Save profile ─────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    if (!name.trim()) { setProfError("Name is required"); return; }
    setProfSaving(true); setProfError(null); setProfSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), college, university, department, year_level: yearLevel }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Save failed"); }
      await refreshProfile();
      setProfSaved(true);
      setTimeout(() => setProfSaved(false), 2500);
    } catch (e: unknown) {
      setProfError(e instanceof Error ? e.message : "Save failed");
    } finally { setProfSaving(false); }
  }, [name, college, university, department, yearLevel, refreshProfile]);

  // ── Change password ──────────────────────────────────────
  const changePassword = useCallback(async () => {
    if (newPassword.length < 8) { setPassError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPass) { setPassError("Passwords do not match"); return; }
    setPassSaving(true); setPassError(null); setPassSaved(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setNewPassword(""); setConfirmPass("");
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 2500);
    } catch (e: unknown) {
      setPassError(e instanceof Error ? e.message : "Failed to update password");
    } finally { setPassSaving(false); }
  }, [newPassword, confirmPass]);

  // ── Save notifications ───────────────────────────────────
  const saveNotifications = useCallback(async () => {
    setNotifSaving(true);
    try {
      await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminder_emails: notifReminder, weekly_digest: notifWeekly, tips: notifTips }),
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } catch { /* silent */ }
    finally { setNotifSaving(false); }
  }, [notifReminder, notifWeekly, notifTips]);

  // ── Export CSV ───────────────────────────────────────────
  const exportData = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `job-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setExporting(false); }
  }, []);

  // ── Delete account ───────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true); setDeleteError(null);
    try {
      const res = await fetch("/api/settings/delete-account", { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Delete failed"); }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }, [deleteInput, router]);

  const initials = profile?.name
    ? profile.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes st-spin { to { transform: rotate(360deg); } }
        @keyframes st-fade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .st-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 12px; cursor: pointer;
          border: none; background: transparent; width: 100%;
          text-align: left; transition: background 180ms ease;
        }
        .st-nav-item:hover { background: rgba(255,255,255,0.04); }
        .st-nav-item.active { background: rgba(79,142,247,0.12); }
        .st-nav-item.danger:hover { background: rgba(248,113,113,0.08); }
        .st-nav-item.danger.active { background: rgba(248,113,113,0.1); }
        select option { background: #13161e; color: #e8eaf2; }
      `}</style>

      <SubPageTopNav title="Settings" />

      {/* ── SCROLL FIX: this wrapper enables vertical scrolling ── */}
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 900, margin: "0 0 6px", background: "linear-gradient(90deg, #e8eaf2, rgba(255,255,255,0.5))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Settings
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Manage your profile, account security, and preferences
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: 24, alignItems: "start" }}>

            {/* ── Left nav ── */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 12, position: "sticky", top: 88 }}>

              {/* Avatar */}
              <div style={{ padding: "16px 14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "linear-gradient(135deg,#4f8ef7,#a78bfa)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "#fff",
                    boxShadow: "0 0 16px rgba(79,142,247,0.35)",
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf2", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {profile?.name || "Your name"}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {profile?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  className={`st-nav-item${active === item.id ? " active" : ""}${item.id === "danger" ? " danger" : ""}`}
                  onClick={() => setActive(item.id)}
                >
                  <span style={{ fontSize: 16, color: active === item.id ? (item.id === "danger" ? "#f87171" : "#4f8ef7") : "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active === item.id ? (item.id === "danger" ? "#f87171" : "#e8eaf2") : "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif" }}>
                      {item.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Right content ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* ── PROFILE ── */}
              {active === "profile" && (
                <>
                  <SectionCard title="Personal information" desc="This appears in your profile and sidebar.">
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <Input label="Full name *" value={name} onChange={setName} placeholder="e.g. Sanchu Dev" />
                      <Input label="Department / branch" value={department} onChange={setDepartment} placeholder="e.g. Computer Science & Engineering" />
                      <Select label="Year / level" value={yearLevel} onChange={setYearLevel} options={YEAR_LEVELS} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Input label="College / institute" value={college} onChange={setCollege} placeholder="e.g. IIT Delhi" />
                        <Input label="University" value={university} onChange={setUniversity} placeholder="e.g. Delhi University" />
                      </div>
                      {profError && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                          ⚠ {profError}
                        </div>
                      )}
                      <div>
                        <SaveBtn saving={profSaving} saved={profSaved} onClick={saveProfile} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Profile preview" desc="How your profile appears in the sidebar.">
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#4f8ef7,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf2", fontFamily: "'DM Sans', sans-serif" }}>{name || "Your Name"}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
                          {[department, yearLevel, college].filter(Boolean).join(" · ") || "Add your details above"}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </>
              )}

              {/* ── ACCOUNT ── */}
              {active === "account" && (
                <>
                  <SectionCard title="Email address" desc="Your login email. Contact support to change it.">
                    <Input label="Email" value={email} onChange={setEmail} type="email" disabled />
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "10px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                      Email changes require identity verification. Contact support if needed.
                    </p>
                  </SectionCard>

                  <SectionCard title="Change password" desc="Use a strong password with at least 8 characters.">
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <Input label="New password" value={newPassword} onChange={setNewPassword} type="password" placeholder="At least 8 characters" />
                      <Input label="Confirm new password" value={confirmPass} onChange={setConfirmPass} type="password" placeholder="Repeat your new password" />
                      {passError && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                          ⚠ {passError}
                        </div>
                      )}
                      <div>
                        <SaveBtn
                          saving={passSaving} saved={passSaved}
                          disabled={!newPassword || !confirmPass}
                          onClick={changePassword}
                          label="Update password"
                        />
                      </div>
                    </div>
                  </SectionCard>
                </>
              )}

              {/* ── NOTIFICATIONS ── */}
              {active === "notifications" && (
                <SectionCard title="Email notifications" desc="Control which emails Job Tracker sends you.">
                  <div style={{ marginBottom: 20 }}>
                    <Toggle
                      checked={notifReminder} onChange={setNotifReminder}
                      label="Reminder emails"
                      desc="30-minute email alerts before scheduled interviews and deadlines"
                    />
                    <Toggle
                      checked={notifWeekly} onChange={setNotifWeekly}
                      label="Weekly digest"
                      desc="Summary of your application activity every Monday morning"
                    />
                    <Toggle
                      checked={notifTips} onChange={setNotifTips}
                      label="Tips & insights"
                      desc="Occasional tips on interview prep and job search strategy"
                    />
                  </div>
                  <SaveBtn saving={notifSaving} saved={notifSaved} onClick={saveNotifications} label="Save preferences" />
                </SectionCard>
              )}

              {/* ── DATA ── */}
              {active === "data" && (
                <>
                  <SectionCard title="Export your data" desc="Download everything as a CSV file — applications, notes, tasks, and reminders.">
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        📥
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf2", fontFamily: "'DM Sans', sans-serif" }}>applications-export.csv</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>All applications with status, dates, notes and tasks</div>
                      </div>
                    </div>
                    <button
                      onClick={exportData}
                      disabled={exporting}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "11px 22px", borderRadius: 12, border: "1px solid rgba(79,142,247,0.35)",
                        background: "rgba(79,142,247,0.1)", color: "#4f8ef7",
                        fontSize: 14, fontWeight: 700, cursor: exporting ? "wait" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 200ms ease",
                      }}
                      onMouseEnter={e => { if (!exporting) (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.2)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.1)"; }}
                    >
                      {exporting ? (
                        <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(79,142,247,0.3)", borderTopColor: "#4f8ef7", animation: "st-spin 0.7s linear infinite", display: "inline-block" }} /> Exporting…</>
                      ) : "⬇ Download CSV"}
                    </button>
                  </SectionCard>

                  <SectionCard title="Data summary" desc="Everything stored in your account right now.">
                    {[
                      { label: "Applications",  icon: "📋" },
                      { label: "Tasks",         icon: "✅" },
                      { label: "Files",         icon: "📁" },
                      { label: "Reminders",     icon: "🔔" },
                      { label: "Note saves",    icon: "📝" },
                    ].map(item => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>stored in Supabase</span>
                      </div>
                    ))}
                  </SectionCard>
                </>
              )}

              {/* ── DANGER ZONE ── */}
              {active === "danger" && (
                <div style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", animation: "st-fade 400ms ease both" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(248,113,113,0.5),transparent)" }} />

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      ⚠️
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f87171", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" }}>Delete account</h3>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                        This permanently deletes your account, all applications, tasks, files, reminders, and notes. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
                      Type <strong style={{ color: "#f87171" }}>DELETE</strong> to confirm
                    </label>
                    <input
                      value={deleteInput}
                      onChange={e => setDeleteInput(e.target.value)}
                      placeholder="DELETE"
                      style={{
                        ...inputStyle,
                        borderColor: deleteInput === "DELETE" ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)",
                        boxShadow: deleteInput === "DELETE" ? "0 0 0 3px rgba(248,113,113,0.1)" : "none",
                        maxWidth: 260,
                      }}
                    />
                    {deleteError && (
                      <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                        ⚠ {deleteError}
                      </div>
                    )}
                    <div>
                      <button
                        onClick={deleteAccount}
                        disabled={deleteInput !== "DELETE" || deleting}
                        style={{
                          padding: "11px 24px", borderRadius: 12, border: "1px solid rgba(248,113,113,0.4)",
                          background: deleteInput === "DELETE" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.03)",
                          color: deleteInput === "DELETE" ? "#f87171" : "rgba(255,255,255,0.2)",
                          fontSize: 14, fontWeight: 700, cursor: deleteInput !== "DELETE" || deleting ? "not-allowed" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 220ms ease",
                          display: "inline-flex", alignItems: "center", gap: 8,
                        }}
                      >
                        {deleting ? (
                          <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(248,113,113,0.3)", borderTopColor: "#f87171", animation: "st-spin 0.7s linear infinite", display: "inline-block" }} /> Deleting…</>
                        ) : "Delete my account permanently"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom padding */}
          <div style={{ height: 40 }} />
        </div>
      </div>
    </>
  );
}