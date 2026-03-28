"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: DashIcon  },
  { href: "/applications", label: "Applications", icon: AppIcon   },
  { href: "/analytics",    label: "Analytics",    icon: ChartIcon },
  { href: "/resumes",      label: "Resumes",      icon: FileIcon  },
  { href: "/tasks",        label: "Tasks",        icon: TaskIcon  },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Settings", icon: GearIcon },
];

const W_OPEN   = 240;
const W_CLOSED = 68;

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const handleToggle = () => setOpen(prev => !prev);
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  }, []);

  useEffect(() => {
    // FIX: inject CSS variable directly — no styled-jsx (not supported in App Router)
    document.documentElement.style.setProperty("--sidebar-w", open ? `${W_OPEN}px` : `${W_CLOSED}px`);
  }, [open]);

  // FIX: inject .sidebar-offset rule once on mount via a plain <style> tag in the DOM
  useEffect(() => {
    const id = "sidebar-offset-style";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `
        :root { --sidebar-w: ${W_OPEN}px; }
        .sidebar-offset {
          margin-left: var(--sidebar-w) !important;
          transition: margin-left 0.35s cubic-bezier(0.4,0,0.2,1);
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  if (!mounted) return null;

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999,
        height: "100vh",
        width: open ? `${W_OPEN}px` : `${W_CLOSED}px`,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg,#0a0c12 0%,#0d1020 100%)",
        borderRight: "1px solid rgba(79,142,247,0.12)",
        boxShadow: open
          ? "4px 0 40px rgba(0,0,0,0.6), inset -1px 0 0 rgba(79,142,247,0.06)"
          : "2px 0 20px rgba(0,0,0,0.5)",
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(circle,rgba(79,142,247,0.03) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg,#4f8ef7,#22d3ee,#a78bfa)",
        opacity: 0.7, zIndex: 1,
      }} />

      {/* Logo row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: open ? "0 16px 0 20px" : "0",
        justifyContent: open ? "flex-start" : "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0, position: "relative", zIndex: 1,
        height: 70,
        transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
          background: "linear-gradient(135deg,#4f8ef7 0%,#22d3ee 50%,#a78bfa 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(79,142,247,0.45)",
          fontSize: "16px", userSelect: "none",
        }}>
          🚀
        </div>
        <span style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px",
          letterSpacing: "0.4px",
          background: "linear-gradient(90deg,#4f8ef7,#a78bfa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          whiteSpace: "nowrap",
          opacity: open ? 1 : 0,
          transform: open ? "translateX(0)" : "translateX(-8px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          pointerEvents: "none",
        }}>
          Job Tracker
        </span>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: open ? "16px 12px" : "16px 8px",
        display: "flex", flexDirection: "column", gap: "4px",
        scrollbarWidth: "none",
        transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", zIndex: 1,
      }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} item={item} active={pathname === item.href} open={open} />
        ))}
        <div style={{
          height: "1px", margin: "10px 4px",
          background: "linear-gradient(90deg,transparent,rgba(79,142,247,0.2),transparent)",
        }} />
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.href} item={item} active={pathname === item.href} open={open} />
        ))}
      </nav>

      {/* User row */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: open ? "12px" : "0",
        padding: open ? "14px 16px" : "14px 0",
        justifyContent: open ? "flex-start" : "center",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0, cursor: "pointer",
        position: "relative", zIndex: 1,
        transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1), gap 0.35s ease",
      }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
          background: "linear-gradient(135deg,#4f8ef7,#a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 800, color: "#fff",
          boxShadow: "0 0 14px rgba(79,142,247,0.35)",
        }}>
          RD
        </div>
        <div style={{
          minWidth: 0, flex: 1,
          opacity: open ? 1 : 0,
          transform: open ? "translateX(0)" : "translateX(-6px)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
          pointerEvents: open ? "auto" : "none",
          overflow: "hidden",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8eaf2", whiteSpace: "nowrap" }}>
            Rahul Dev
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", whiteSpace: "nowrap" }}>
            B.Tech CSE &apos;25
          </div>
        </div>
        {open && (
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#22d3ee", boxShadow: "0 0 8px #22d3ee",
            flexShrink: 0, animation: "sb-pulse 2s ease-in-out infinite",
          }} />
        )}
      </div>

      <style>{`
        @keyframes sb-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.55; transform:scale(1.35); }
        }
      `}</style>
    </aside>
  );
}

function NavItem({
  item,
  active,
  open,
}: {
  item: { href: string; label: string; icon: React.FC<{ size?: number; color?: string }> };
  active: boolean;
  open: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={!open ? item.label : undefined}
      style={{
        display: "flex", alignItems: "center",
        gap: open ? "12px" : "0",
        justifyContent: open ? "flex-start" : "center",
        padding: open ? "10px 12px" : "10px 0",
        borderRadius: "10px", textDecoration: "none",
        position: "relative", overflow: "hidden",
        background: active
          ? "linear-gradient(90deg,rgba(79,142,247,0.18),rgba(167,139,250,0.08))"
          : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: active ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent",
        transition: "background 0.2s, border-color 0.2s, padding 0.35s cubic-bezier(0.4,0,0.2,1), gap 0.35s",
      }}
    >
      {active && (
        <div style={{
          position: "absolute", left: 0, top: "20%", bottom: "20%",
          width: "3px", borderRadius: "0 3px 3px 0",
          background: "linear-gradient(180deg,#4f8ef7,#a78bfa)",
          boxShadow: "0 0 8px #4f8ef790",
        }} />
      )}
      <span style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        width: "22px", height: "22px",
        transition: "transform 0.2s",
        transform: hovered && !active ? "scale(1.12)" : "scale(1)",
      }}>
        <Icon size={18} color={active ? "#4f8ef7" : hovered ? "#c4cadf" : "#6b7399"} />
      </span>
      <span style={{
        fontSize: "13px", fontWeight: active ? 600 : 500,
        color: active ? "#e8eaf2" : hovered ? "#c4cadf" : "#6b7399",
        whiteSpace: "nowrap",
        opacity: open ? 1 : 0,
        transform: open ? "translateX(0)" : "translateX(-6px)",
        transition: "opacity 0.22s, transform 0.22s, color 0.2s",
        pointerEvents: "none",
      }}>
        {item.label}
      </span>
      {hovered && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04) 50%,transparent)",
        }} />
      )}
    </Link>
  );
}

function DashIcon({ size = 18, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
    <rect x="11" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
    <rect x="2" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
    <rect x="11" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
  </svg>;
}
function AppIcon({ size = 18, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function ChartIcon({ size = 18, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M3 14l4-4 3 3 4-5 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function FileIcon({ size = 18, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth="1.5"/>
    <path d="M12 2v4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function TaskIcon({ size = 18, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M7 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function GearIcon({ size = 18, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5"/>
    <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}