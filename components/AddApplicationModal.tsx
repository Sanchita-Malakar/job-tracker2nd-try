"use client";
import { useState, useEffect, useRef } from "react";
import type { Application } from "@/types";

const STATUSES = ["Applied", "OA", "Interview", "Offer", "Rejected"];

const STATUS_CONFIG: Record<string, { color: string; glow: string; label: string; icon: string }> = {
  Applied:   { color: "#f59e0b", glow: "rgba(245,158,11,0.35)",   label: "Applied",           icon: "→" },
  OA:        { color: "#06b6d4", glow: "rgba(6,182,212,0.35)",    label: "Online Assessment", icon: "⊞" },
  Interview: { color: "#f97316", glow: "rgba(249,115,22,0.35)",   label: "Interview",         icon: "◎" },
  Offer:     { color: "#10b981", glow: "rgba(16,185,129,0.35)",   label: "Offer",             icon: "★" },
  Rejected:  { color: "#ef4444", glow: "rgba(239,68,68,0.35)",    label: "Rejected",          icon: "✕" },
};

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (app: Omit<Application, "id">) => void;
}

export default function AddApplicationModal({ isOpen, onClose, onAdd }: AddApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role,    setRole]    = useState("");
  const [status,  setStatus]  = useState("Applied");
  const [date,    setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [notes,   setNotes]   = useState("");
  const [step,    setStep]    = useState(1); // 1 = basics, 2 = details
  const [submitted, setSubmitted] = useState(false);
  const [animIn,  setAnimIn]  = useState(false);
  const companyRef = useRef<HTMLInputElement>(null);

  // Mount animation
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setStep(1);
      setTimeout(() => setAnimIn(true), 20);
      setTimeout(() => companyRef.current?.focus(), 120);
    } else {
      setAnimIn(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      const d = new Date(date);
      const formatted = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      onAdd({ company: company.trim(), role: role.trim(), status, date: formatted, notes: notes.trim() });
      setCompany(""); setRole(""); setStatus("Applied"); setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setSubmitted(false);
      onClose();
    }, 900);
  };

  const step1Valid = company.trim().length > 0 && role.trim().length > 0;
  const cfg = STATUS_CONFIG[status];

  if (!isOpen && !animIn) return null;

  return (
    <>
      <style>{`
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-in {
          0%   { opacity: 0; transform: translateY(28px) scale(0.96); }
          60%  { opacity: 1; transform: translateY(-4px) scale(1.004); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modal-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.97); }
        }
        @keyframes field-in {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes success-pop {
          0%   { transform: scale(0.5) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.18) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1) rotate(0deg);     opacity: 1; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(22px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(22px) rotate(-360deg); }
        }
        @keyframes shimmer-line {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes step-slide-right {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes step-slide-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.92); opacity: 0.7; }
          70%  { transform: scale(1.2);  opacity: 0; }
          100% { transform: scale(1.2);  opacity: 0; }
        }
        .modal-field-row > * {
          animation: field-in 0.3s ease both;
        }
        .modal-field-row > *:nth-child(1) { animation-delay: 0.08s; }
        .modal-field-row > *:nth-child(2) { animation-delay: 0.14s; }
        .am-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.035);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          color: #e8eaf2;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: #4f8ef7;
        }
        .am-input::placeholder { color: rgba(255,255,255,0.22); font-weight: 400; }
        .am-input:focus {
          border-color: rgba(79,142,247,0.6);
          background: rgba(79,142,247,0.06);
          box-shadow: 0 0 0 3px rgba(79,142,247,0.14), 0 4px 20px rgba(0,0,0,0.3);
        }
        .am-input:hover:not(:focus) { border-color: rgba(255,255,255,0.18); }
        .am-input-date::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(2) hue-rotate(190deg);
          cursor: pointer;
        }
        .am-textarea { resize: none; min-height: 90px; line-height: 1.6; }
        .status-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          user-select: none;
          background: rgba(255,255,255,0.03);
        }
        .status-pill:hover { transform: translateY(-2px); }
        .status-pill.active { transform: translateY(-2px); }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(13,16,32,0.92) 0%, rgba(5,6,10,0.97) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
          animation: animIn ? "modal-backdrop-in 0.25s ease forwards" : "none",
        }}
      >
        {/* Modal card */}
        <div
          style={{
            width: "100%", maxWidth: "540px",
            maxHeight: "92vh", overflowY: "auto",
            borderRadius: "24px",
            background: "linear-gradient(160deg, #13161f 0%, #0e1118 60%, #0b0e15 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,142,247,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
            position: "relative",
            animation: animIn
              ? "modal-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards"
              : "modal-out 0.25s ease forwards",
            scrollbarWidth: "none",
          }}
          onClick={e => e.stopPropagation()}
        >

          {/* Top shimmer line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent 0%, #4f8ef7 30%, #22d3ee 50%, #a78bfa 70%, transparent 100%)",
            backgroundSize: "300% 100%",
            animation: "shimmer-line 3s linear infinite",
            borderRadius: "24px 24px 0 0",
            opacity: 0.9,
          }} />

          {/* Corner decorations */}
          <div style={{
            position: "absolute", top: "16px", right: "16px",
            width: "60px", height: "60px", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
          }} />

          {/* ── HEADER ── */}
          <div style={{ padding: "28px 28px 20px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  {/* Animated dot */}
                  <div style={{ position: "relative", width: "10px", height: "10px" }}>
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}`,
                    }} />
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: cfg.color, opacity: 0.5,
                      animation: "pulse-ring 1.8s cubic-bezier(0.2,0,0.8,1) infinite",
                    }} />
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    New Application
                  </span>
                </div>
                <h2 style={{
                  margin: 0,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "22px", fontWeight: 800,
                  background: "linear-gradient(90deg, #e8eaf2 0%, #a1a8c6 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.3px",
                }}>
                  {company.trim() ? company.trim() : "Track your next role"}
                </h2>
                {role.trim() && (
                  <p style={{
                    margin: "4px 0 0", fontSize: "13px",
                    color: cfg.color, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: 0.9,
                  }}>
                    {role.trim()}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  flexShrink: 0,
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "16px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "#f87171";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Step indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px" }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    cursor: s < step ? "pointer" : "default",
                  }}
                    onClick={() => s < step && setStep(s)}
                  >
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                      background: step >= s
                        ? `linear-gradient(135deg, #4f8ef7, #a78bfa)`
                        : "rgba(255,255,255,0.07)",
                      color: step >= s ? "#fff" : "rgba(255,255,255,0.3)",
                      border: step === s ? "2px solid rgba(79,142,247,0.5)" : "2px solid transparent",
                      boxShadow: step === s ? "0 0 10px rgba(79,142,247,0.4)" : "none",
                      transition: "all 0.3s",
                    }}>
                      {s}
                    </div>
                    <span style={{
                      fontSize: "12px", fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: step >= s ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                      transition: "color 0.3s",
                    }}>
                      {s === 1 ? "Basics" : "Details"}
                    </span>
                  </div>
                  {s < 2 && (
                    <div style={{
                      width: "32px", height: "1px",
                      background: step > s
                        ? "linear-gradient(90deg, #4f8ef7, #a78bfa)"
                        : "rgba(255,255,255,0.1)",
                      transition: "background 0.4s",
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 28px" }} />

          {/* ── STEP 1: Basics ── */}
          {step === 1 && (
            <div
              key="step1"
              style={{
                padding: "24px 28px",
                display: "flex", flexDirection: "column", gap: "20px",
                animation: "step-slide-left 0.3s ease both",
              }}
            >
              {/* Company */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <FieldLabel>Company</FieldLabel>
                <div style={{ position: "relative" }}>
                  <input
                    ref={companyRef}
                    className="am-input"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Google, Amazon, Stripe…"
                    onKeyDown={e => e.key === "Enter" && role.trim() && setStep(2)}
                  />
                  {company.trim() && (
                    <div style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)",
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "rgba(16,185,129,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", color: "#34d399",
                    }}>✓</div>
                  )}
                </div>
              </div>

              {/* Role */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <FieldLabel>Role / Position</FieldLabel>
                <div style={{ position: "relative" }}>
                  <input
                    className="am-input"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="SDE Intern, Software Engineer…"
                    onKeyDown={e => e.key === "Enter" && company.trim() && setStep(2)}
                  />
                  {role.trim() && (
                    <div style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)",
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "rgba(16,185,129,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", color: "#34d399",
                    }}>✓</div>
                  )}
                </div>
              </div>

              {/* Status — visual pill picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <FieldLabel>Current Status</FieldLabel>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {STATUSES.map(s => {
                    const c = STATUS_CONFIG[s];
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        className={`status-pill${active ? " active" : ""}`}
                        onClick={() => setStatus(s)}
                        style={{
                          borderColor: active ? `${c.color}60` : "rgba(255,255,255,0.07)",
                          background: active ? `${c.color}15` : "rgba(255,255,255,0.03)",
                          color: active ? c.color : "rgba(255,255,255,0.45)",
                          boxShadow: active ? `0 4px 16px ${c.glow}, 0 0 0 1px ${c.color}30` : "none",
                        }}
                      >
                        <span style={{ fontSize: "13px", lineHeight: 1 }}>{c.icon}</span>
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <div
              key="step2"
              style={{
                padding: "24px 28px",
                display: "flex", flexDirection: "column", gap: "20px",
                animation: "step-slide-right 0.3s ease both",
              }}
            >
              {/* Date */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <FieldLabel>Date Applied</FieldLabel>
                <input
                  type="date"
                  className="am-input am-input-date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>

              {/* Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <FieldLabel>Notes</FieldLabel>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif" }}>
                    Optional — {notes.length} chars
                  </span>
                </div>
                <textarea
                  className="am-input am-textarea"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Referral source, interview rounds, feedback, follow-up reminders…"
                />
              </div>

              {/* Summary card */}
              <div style={{
                padding: "14px 16px",
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${cfg.color}0f 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${cfg.color}25`,
                display: "flex", alignItems: "center", gap: "14px",
              }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                  background: `${cfg.color}20`,
                  border: `1px solid ${cfg.color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", color: cfg.color,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px", fontWeight: 700, color: "#e8eaf2",
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {company} — {role}
                  </div>
                  <div style={{ fontSize: "12px", color: cfg.color, fontWeight: 600, marginTop: "2px", fontFamily: "'DM Sans', sans-serif" }}>
                    {cfg.label} · {date}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 28px" }} />

          {/* ── FOOTER ── */}
          <div style={{
            padding: "20px 28px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
          }}>
            {/* Back / Cancel */}
            <button
              onClick={step === 1 ? onClose : () => setStep(1)}
              style={{
                padding: "11px 22px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px", fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.18s",
                display: "flex", alignItems: "center", gap: "6px",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
              }}
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  width: step === s ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: step === s
                    ? "linear-gradient(90deg, #4f8ef7, #a78bfa)"
                    : step > s ? "rgba(79,142,247,0.5)" : "rgba(255,255,255,0.12)",
                  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                }} />
              ))}
            </div>

            {/* Next / Submit */}
            {step === 1 ? (
              <button
                onClick={() => step1Valid && setStep(2)}
                disabled={!step1Valid}
                style={{
                  padding: "11px 26px",
                  borderRadius: "12px",
                  background: step1Valid
                    ? "linear-gradient(135deg, #4f8ef7 0%, #3b7ef0 100%)"
                    : "rgba(255,255,255,0.06)",
                  border: step1Valid ? "1px solid rgba(79,142,247,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: step1Valid ? "#fff" : "rgba(255,255,255,0.25)",
                  fontSize: "14px", fontWeight: 700,
                  cursor: step1Valid ? "pointer" : "not-allowed",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: step1Valid ? "0 4px 20px rgba(79,142,247,0.4)" : "none",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
                onMouseEnter={e => {
                  if (!step1Valid) return;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(79,142,247,0.55)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = step1Valid ? "0 4px 20px rgba(79,142,247,0.4)" : "none";
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitted}
                style={{
                  padding: "11px 26px",
                  borderRadius: "12px",
                  background: submitted
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color}99)`,
                  border: `1px solid ${submitted ? "rgba(16,185,129,0.4)" : cfg.color + "50"}`,
                  color: "#fff",
                  fontSize: "14px", fontWeight: 700,
                  cursor: submitted ? "default" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: submitted
                    ? "0 4px 20px rgba(16,185,129,0.4)"
                    : `0 4px 20px ${cfg.glow}`,
                  transition: "all 0.3s",
                  display: "flex", alignItems: "center", gap: "8px",
                  minWidth: "140px", justifyContent: "center",
                }}
                onMouseEnter={e => {
                  if (submitted) return;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${cfg.glow}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${cfg.glow}`;
                }}
              >
                {submitted ? (
                  <>
                    <span style={{ animation: "success-pop 0.4s ease both", display: "inline-block" }}>✓</span>
                    Added!
                  </>
                ) : (
                  <>Add Application</>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.38)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </label>
  );
}