"use client";
import { useEffect, useRef, useState } from "react";

/* ── Config ───────────────────────────────────────────────── */
interface StatConfig {
  label:      string;
  display:    string;
  icon:       React.FC<{ color: string }>;
  accent:     string;
  glow:       string;
}

const STATS: StatConfig[] = [
  { label: "Applied",   display: "Applied",    icon: SendIcon,    accent: "#f59e0b", glow: "rgba(245,158,11,0.28)"  },
  { label: "OA",        display: "Assessment", icon: MonitorIcon, accent: "#06b6d4", glow: "rgba(6,182,212,0.28)"   },
  { label: "Interview", display: "Interview",  icon: MicIcon,     accent: "#f97316", glow: "rgba(249,115,22,0.28)"  },
  { label: "Offer",     display: "Offer",      icon: StarIcon,    accent: "#10b981", glow: "rgba(16,185,129,0.28)"  },
  { label: "Rejected",  display: "Rejected",   icon: CrossIcon,   accent: "#ef4444", glow: "rgba(239,68,68,0.28)"   },
];

interface StatsStripProps {
  counts: Record<string, number>;
}

/* ── Strip ────────────────────────────────────────────────── */
export default function StatsStrip({ counts }: StatsStripProps) {
  return (
    <>
      <style>{`
        @keyframes sparkle {
          from { opacity:0.2; transform:scale(0.7); }
          to   { opacity:1;   transform:scale(1.5); }
        }
        @keyframes barIn {
          from { width:0% }
          to   { width:100% }
        }
      `}</style>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5,minmax(0,1fr))",
        gap: "14px",
        width: "100%",
      }}>
        {STATS.map((stat, i) => (
          <StatCard
            key={stat.label}
            stat={stat}
            count={counts[stat.label] ?? 0}
            index={i}
          />
        ))}
      </div>
    </>
  );
}

/* ── Card ─────────────────────────────────────────────────── */
function StatCard({ stat, count, index }: { stat: StatConfig; count: number; index: number }) {
  const [hovered,   setHovered]   = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const [mounted,   setMounted]   = useState(false);
  const rafRef = useRef<number | null>(null);

  /* Staggered mount */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 90 + 60);
    return () => clearTimeout(t);
  }, [index]);

  /* Animated counter */
  useEffect(() => {
    if (!mounted) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = displayed;
    const to   = count;
    const dur  = 700;
    const t0   = performance.now();
    const tick = (now: number) => {
      const p  = Math.min((now - t0) / dur, 1);
      const ep = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (to - from) * ep));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [count, mounted]);

  const a   = stat.accent;
  const Icon = stat.icon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        padding: "20px 18px 22px",
        background: hovered
          ? "rgba(255,255,255,0.045)"
          : "rgba(255,255,255,0.022)",
        border: `1px solid ${hovered ? a + "55" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered
          ? `0 10px 36px ${stat.glow}, 0 0 0 1px ${a}20`
          : "0 2px 10px rgba(0,0,0,0.3)",
        transform: mounted
          ? hovered ? "translateY(-5px) scale(1.025)" : "translateY(0) scale(1)"
          : "translateY(14px)",
        opacity: mounted ? 1 : 0,
        transition: [
          "transform 0.32s cubic-bezier(0.34,1.4,0.64,1)",
          "opacity 0.4s ease",
          "border-color 0.25s ease",
          "box-shadow 0.3s ease",
          "background 0.25s ease",
        ].join(","),
        cursor: "default",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg,transparent,${a},transparent)`,
        opacity: hovered ? 1 : 0.35,
        transition: "opacity 0.3s ease",
      }} />

      {/* Radial bloom */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 15% 15%,${a}18 0%,transparent 60%)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.35s ease",
      }} />

      {/* Sparkles */}
      {hovered && count > 0 && <>
        <Sparkle top={9}  right={11} color={a} delay={0}   size={4} />
        <Sparkle top={20} right={23} color={a} delay={110} size={3} />
        <Sparkle top={14} right={34} color={a} delay={55}  size={2} />
      </>}

      {/* Icon chip */}
      <div style={{
        width: "40px", height: "40px", borderRadius: "11px",
        background: `${a}18`,
        border: `1px solid ${a}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "16px",
        transform: hovered ? "scale(1.12) rotate(-5deg)" : "scale(1) rotate(0deg)",
        transition: "transform 0.32s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.3s ease",
        boxShadow: hovered ? `0 4px 16px ${a}40` : "none",
      }}>
        <Icon color={hovered ? a : `${a}aa`} />
      </div>

      {/* Count */}
      <div style={{
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "36px",
        fontWeight: 900,
        lineHeight: 1,
        marginBottom: "7px",
        color: hovered ? a : `${a}bb`,
        letterSpacing: "-1px",
        transition: "color 0.25s ease, text-shadow 0.25s ease",
        textShadow: hovered ? `0 0 24px ${a}55` : "none",
      }}>
        {displayed}
      </div>

      {/* Label */}
      <div style={{
        fontSize: "10.5px",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: hovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
        transition: "color 0.25s ease",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {stat.display}
      </div>

      {/* Bottom sweep bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: hovered ? "100%" : "0%",
          background: `linear-gradient(90deg,${a}70,${a})`,
          transition: "width 0.55s cubic-bezier(0.4,0,0.2,1)",
          borderRadius: "0 2px 2px 0",
        }} />
      </div>
    </div>
  );
}

/* ── Sparkle dot ──────────────────────────────────────────── */
function Sparkle({ top, right, color, delay, size }: {
  top: number; right: number; color: string; delay: number; size: number;
}) {
  return (
    <div style={{
      position: "absolute", top, right,
      width: `${size}px`, height: `${size}px`,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animation: `sparkle 0.85s ease-in-out ${delay}ms infinite alternate`,
    }} />
  );
}

/* ── Icons ────────────────────────────────────────────────── */
function SendIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path d="M17 3L9 11M17 3L11 17L9 11M17 3L3 9L9 11"
        stroke={color} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function MonitorIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="11" rx="2" stroke={color} strokeWidth="1.65"/>
      <path d="M7 17h6M10 14v3" stroke={color} strokeWidth="1.65" strokeLinecap="round"/>
    </svg>
  );
}
function MicIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <rect x="7" y="2" width="6" height="9" rx="3" stroke={color} strokeWidth="1.65"/>
      <path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6" stroke={color} strokeWidth="1.65" strokeLinecap="round"/>
    </svg>
  );
}
function StarIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l2.4 5 5.6.8-4 4 .9 5.6L10 15l-4.9 2.4.9-5.6-4-4 5.6-.8z"
        stroke={color} strokeWidth="1.65" strokeLinejoin="round"/>
    </svg>
  );
}
function CrossIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.65"/>
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke={color} strokeWidth="1.65" strokeLinecap="round"/>
    </svg>
  );
}