"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { PageSection } from "@/app/page"; // import the type

// Items that control in-page sections (no real route change)
const SECTION_ITEMS: {
  section: PageSection;
  label: string;
  icon: React.FC<{ size?: number; color?: string }>;
}[] = [
  { section: "dashboard",    label: "Dashboard",    icon: DashIcon },
  { section: "applications", label: "Applications", icon: AppIcon  },
];

// Items that are real Next.js routes
const ROUTE_ITEMS = [
  { href: "/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/resumes",   label: "Resumes",   icon: FileIcon  },
  { href: "/tasks",     label: "Tasks",     icon: TaskIcon  },
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
  const [activeSection, setActiveSection] = useState<PageSection>("dashboard");

  useEffect(() => {
    setMounted(true);
    const handleToggle = () => setOpen(prev => {
      const next = !prev;
      document.documentElement.style.setProperty("--sidebar-w", next ? "240px" : "68px");
      return next;
    });
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  }, []);

  // Keep active section in sync when page.tsx changes it internally
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent<PageSection>).detail;
      setActiveSection(section);
    };
    window.addEventListener("page:section", handler);
    return () => window.removeEventListener("page:section", handler);
  }, []);

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
        @keyframes sb-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.55; transform:scale(1.35); }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  const dispatchSection = (section: PageSection) => {
    setActiveSection(section);
    window.dispatchEvent(new CustomEvent<PageSection>("page:section", { detail: section }));
  };

  if (!mounted) return null;

  // Are we on the main dashboard page (where sections live)?
  const isHomePage = pathname === "/" || pathname === "/dashboard" || pathname === "/applications";

  return (
    <aside
      style={{
        position: "fixed",
        top: 0, left: 0,
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
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
        overflow: "visible",
      }}
    >
      {/* Background layer */}
      <div style={{
        position: "absolute", inset: 0,
        overflow: "hidden",
        borderRadius: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle,rgba(79,142,247,0.03) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg,#4f8ef7,#22d3ee,#a78bfa)",
          opacity: 0.7,
        }} />
      </div>

      {/* ── Logo row ── */}
      <div style={{
        position: "relative", zIndex: 1,
        height: 70, flexShrink: 0,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
        paddingLeft: open ? "20px" : "0",
        paddingRight: open ? "16px" : "0",
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
          marginLeft: "14px",
          maxWidth: open ? "160px" : "0px",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
          pointerEvents: "none",
        }}>
          Job Tracker
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: open ? "16px 12px" : "16px 8px",
        display: "flex", flexDirection: "column", gap: "4px",
        scrollbarWidth: "none",
        transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", zIndex: 1,
      }}>

        {/* Section items — Dashboard & Applications */}
        {SECTION_ITEMS.map(item => (
          <SectionNavItem
            key={item.section}
            item={item}
            active={isHomePage && activeSection === item.section}
            open={open}
            onClick={() => dispatchSection(item.section)}
          />
        ))}

        {/* Divider */}
        <div style={{
          height: "1px", margin: "10px 4px",
          background: "linear-gradient(90deg,transparent,rgba(79,142,247,0.2),transparent)",
        }} />

        {/* Real route items */}
        {ROUTE_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            open={open}
          />
        ))}

        {/* Divider */}
        <div style={{
          height: "1px", margin: "10px 4px",
          background: "linear-gradient(90deg,transparent,rgba(79,142,247,0.2),transparent)",
        }} />

        {BOTTOM_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            open={open}
          />
        ))}
      </nav>

      {/* ── User row ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center",
        padding: open ? "14px 16px" : "14px 0",
        justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0, cursor: "pointer",
        transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
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
          maxWidth: open ? "160px" : "0px",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          marginLeft: open ? "12px" : "0px",
          transition: "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, margin-left 0.35s",
          pointerEvents: open ? "auto" : "none",
          flexShrink: 0,
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
            marginLeft: "auto", flexShrink: 0,
            animation: "sb-pulse 2s ease-in-out infinite",
          }} />
        )}
      </div>
    </aside>
  );
}

/* ── Section NavItem (button, dispatches event, no route change) ── */
function SectionNavItem({
  item,
  active,
  open,
  onClick,
}: {
  item: { section: PageSection; label: string; icon: React.FC<{ size?: number; color?: string }> };
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={!open ? item.label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: open ? "flex-start" : "center",
        height: "42px",
        padding: open ? "0 12px" : "0",
        borderRadius: "10px",
        border: active ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent",
        background: active
          ? "linear-gradient(90deg,rgba(79,142,247,0.18),rgba(167,139,250,0.08))"
          : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        width: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        position: "relative",
        overflow: "visible",
        transition: "background 0.2s, border-color 0.2s, padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        textAlign: "left",
      }}
    >
      {/* Active bar */}
      {active && (
        <div style={{
          position: "absolute", left: 0, top: "20%", bottom: "20%",
          width: "3px", borderRadius: "0 3px 3px 0",
          background: "linear-gradient(180deg,#4f8ef7,#a78bfa)",
          boxShadow: "0 0 8px #4f8ef790",
        }} />
      )}

      {/* Active section indicator dot on icon when collapsed */}
      {active && !open && (
        <div style={{
          position: "absolute",
          top: 6, right: 6,
          width: 6, height: 6,
          borderRadius: "50%",
          background: "#4f8ef7",
          boxShadow: "0 0 6px #4f8ef7",
          zIndex: 2,
        }} />
      )}

      <span style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "22px", height: "22px",
        transition: "transform 0.2s",
        transform: hovered && !active ? "scale(1.12)" : "scale(1)",
        zIndex: 1,
      }}>
        <Icon
          size={18}
          color={active ? "#4f8ef7" : hovered ? "#c4cadf" : "#6b7399"}
        />
      </span>

      <span style={{
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        color: active ? "#e8eaf2" : hovered ? "#c4cadf" : "#6b7399",
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: open ? "180px" : "0px",
        opacity: open ? 1 : 0,
        marginLeft: open ? "12px" : "0px",
        transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, margin-left 0.3s, color 0.2s",
        pointerEvents: "none",
      }}>
        {item.label}
      </span>

      {hovered && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "10px",
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04) 50%,transparent)",
          pointerEvents: "none",
        }} />
      )}
    </button>
  );
}

/* ── Route NavItem (Link, navigates) ── */
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
        display: "flex",
        alignItems: "center",
        justifyContent: open ? "flex-start" : "center",
        height: "42px",
        padding: open ? "0 12px" : "0",
        borderRadius: "10px",
        textDecoration: "none",
        position: "relative",
        overflow: "visible",
        background: active
          ? "linear-gradient(90deg,rgba(79,142,247,0.18),rgba(167,139,250,0.08))"
          : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: active ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent",
        transition: "background 0.2s, border-color 0.2s, padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        width: "100%",
        boxSizing: "border-box",
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
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "22px", height: "22px",
        transition: "transform 0.2s",
        transform: hovered && !active ? "scale(1.12)" : "scale(1)",
        zIndex: 1,
      }}>
        <Icon
          size={18}
          color={active ? "#4f8ef7" : hovered ? "#c4cadf" : "#6b7399"}
        />
      </span>

      <span style={{
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        color: active ? "#e8eaf2" : hovered ? "#c4cadf" : "#6b7399",
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: open ? "180px" : "0px",
        opacity: open ? 1 : 0,
        marginLeft: open ? "12px" : "0px",
        transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, margin-left 0.3s, color 0.2s",
        pointerEvents: "none",
      }}>
        {item.label}
      </span>

      {hovered && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "10px",
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04) 50%,transparent)",
          pointerEvents: "none",
        }} />
      )}
    </Link>
  );
}

/* ── Icons ── */
function DashIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2"  y="2"  width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
      <rect x="11" y="2"  width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
      <rect x="2"  y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="2" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}
function AppIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function ChartIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 14l4-4 3 3 4-5 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 17h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function FileIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth="1.5"/>
      <path d="M12 2v4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function TaskIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M7 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function GearIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M5.05 14.95l1.41-1.41M13.54 6.46l1.41-1.41"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}