"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { createClient } from "@/lib/supabase/client";
import type { PageSection } from "@/app/page";

const SECTION_ITEMS: {
  section: PageSection;
  label: string;
  icon: React.FC<{ size?: number; color?: string }>;
}[] = [
  { section: "dashboard",    label: "Dashboard",    icon: DashIcon },
  { section: "applications", label: "Applications", icon: AppIcon  },
];

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

// ── Helper: set CSS variable only (safe inside setState) ────
function setCSSWidth(w: number) {
  document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
}

// ── Helper: dispatch width event OUTSIDE render cycle ────────
// Uses setTimeout(0) so it never fires during a React setState updater,
// which would cause "Cannot update a component while rendering" errors.
function dispatchWidthEvent(w: number) {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("sidebar:width", { detail: w }));
  }, 0);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { profile } = useSession();
  const [mounted,       setMounted]       = useState(false);
  const [open,          setOpen]          = useState(true);
  const [activeSection, setActiveSection] = useState<PageSection>("dashboard");

  // ── Drag-to-resize state ─────────────────────────────────
  const [dragging,    setDragging]    = useState(false);
  const [dragWidth,   setDragWidth]   = useState<number | null>(null);
  const dragStartX    = useRef(0);
  const dragStartW    = useRef(W_OPEN);
  const asideRef      = useRef<HTMLElement>(null);

  // ── Inject global styles once ────────────────────────────
  useEffect(() => {
    setMounted(true);
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
        /* Suppress transition while drag-resizing for real-time feel */
        .sidebar-offset.sidebar-dragging {
          transition: none !important;
        }
        @keyframes sb-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.55; transform:scale(1.35); }
        }
      `;
      document.head.appendChild(el);
    }
    // Ensure initial CSS variable matches state
    setCSSWidth(W_OPEN);
    dispatchWidthEvent(W_OPEN);
  }, []);

  // ── Listen for external toggle (from TopNav hamburger) ───
  useEffect(() => {
    const handleToggle = () => {
      // We need the current open state; read it via functional updater
      // but do NOT dispatch events inside the updater — do it after.
      setOpen(prev => {
        const next = !prev;
        const w = next ? W_OPEN : W_CLOSED;
        setDragWidth(null);
        setCSSWidth(w);          // safe: just sets a CSS var, no React state
        dispatchWidthEvent(w);   // deferred via setTimeout(0) — safe
        return next;
      });
    };
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  }, []);

  // ── Listen for page section events ───────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent<PageSection>).detail;
      setActiveSection(section);
    };
    window.addEventListener("page:section", handler);
    return () => window.removeEventListener("page:section", handler);
  }, []);

  // ── Drag-to-resize handlers ───────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = dragWidth ?? (open ? W_OPEN : W_CLOSED);
    setDragging(true);
    // Suppress transition on content while dragging
    document.querySelectorAll(".sidebar-offset").forEach(el =>
      el.classList.add("sidebar-dragging")
    );
  }, [open, dragWidth]);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      const raw   = dragStartW.current + delta;
      const clamped = Math.max(W_CLOSED, Math.min(360, raw));
      setDragWidth(clamped);
      setCSSWidth(clamped);          // instant CSS update, no event dispatch
      dispatchWidthEvent(clamped);   // deferred — safe even in rapid mousemove
    };

    const onMouseUp = (e: MouseEvent) => {
      setDragging(false);
      document.querySelectorAll(".sidebar-offset").forEach(el =>
        el.classList.remove("sidebar-dragging")
      );
      const delta   = e.clientX - dragStartX.current;
      const raw     = dragStartW.current + delta;
      const clamped = Math.max(W_CLOSED, Math.min(360, raw));

      if (clamped < (W_OPEN + W_CLOSED) / 2) {
        setOpen(false);
        setDragWidth(null);
        setCSSWidth(W_CLOSED);
        dispatchWidthEvent(W_CLOSED);
      } else {
        setOpen(true);
        setDragWidth(clamped);
        setCSSWidth(clamped);
        dispatchWidthEvent(clamped);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [dragging]);

  const currentW = dragWidth ?? (open ? W_OPEN : W_CLOSED);
  const isOpen   = currentW > (W_OPEN + W_CLOSED) / 2;

  const dispatchSection = (section: PageSection) => {
    setActiveSection(section);
    window.dispatchEvent(new CustomEvent<PageSection>("page:section", { detail: section }));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleProfileClick = () => {
    window.dispatchEvent(new Event("profile:open"));
  };

  if (!mounted) return null;

  const isHomePage = pathname === "/" || pathname === "/dashboard" || pathname === "/applications";
  const displayName = profile?.name || "User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const subLine = profile?.year_level
    ? `${profile.department || ""} ${profile.year_level}`.trim()
    : profile?.batch || profile?.department || profile?.college || "";

  return (
    <aside
      ref={asideRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        zIndex: 999,
        height: "100vh",
        width: `${currentW}px`,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg,#0a0c12 0%,#0d1020 100%)",
        borderRight: "1px solid rgba(79,142,247,0.12)",
        boxShadow: isOpen
          ? "4px 0 40px rgba(0,0,0,0.6), inset -1px 0 0 rgba(79,142,247,0.06)"
          : "2px 0 20px rgba(0,0,0,0.5)",
        // Only animate width when NOT dragging (dragging uses instant update)
        transition: dragging ? "none" : "width 0.35s cubic-bezier(0.4,0,0.2,1)",
        overflow: "visible",
        userSelect: dragging ? "none" : "auto",
      }}
    >
      {/* Background layer */}
      <div style={{
        position: "absolute", inset: 0,
        overflow: "hidden",
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

      {/* ── Logo row with toggle button ── */}
      <div style={{
        position: "relative", zIndex: 1,
        height: 70, flexShrink: 0,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
        padding: "0 10px",
        gap: "10px",
      }}>

        {/* Logo icon + text — hidden entirely when collapsed */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          // Collapse the whole logo block (icon + text) when sidebar is closed
          maxWidth: isOpen ? "200px" : "0px",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          flexShrink: 1,
          transition: dragging ? "none" : "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
          pointerEvents: "none",
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg,#4f8ef7 0%,#22d3ee 50%,#a78bfa 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(79,142,247,0.45)",
            fontSize: "15px", userSelect: "none",
          }}>
            🚀
          </div>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px",
            letterSpacing: "0.4px",
            background: "linear-gradient(90deg,#4f8ef7,#a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            whiteSpace: "nowrap",
            marginLeft: "11px",
          }}>
            Job Tracker
          </span>
        </div>

        {/* Toggle button — always visible, centred when sidebar is collapsed */}
        <button
          onClick={() => {
            const next = !open;
            const w = next ? W_OPEN : W_CLOSED;
            setOpen(next);
            setDragWidth(null);
            setCSSWidth(w);
            dispatchWidthEvent(w);
          }}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            flexShrink: 0,
            width: "34px", height: "34px", borderRadius: "10px",
            background: "rgba(79,142,247,0.08)",
            border: "1px solid rgba(79,142,247,0.2)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "5px", cursor: "pointer", outline: "none",
            transition: "background 0.2s, box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.18)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(79,142,247,0.3)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,142,247,0.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {isOpen ? (
            /* ✕ when sidebar is open */
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="#4f8ef7" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            /* ☰ hamburger when sidebar is collapsed */
            <>
              <span style={{ display: "block", width: "16px", height: "1.8px", borderRadius: "2px", background: "#4f8ef7" }} />
              <span style={{ display: "block", width: "11px", height: "1.8px", borderRadius: "2px", background: "#4f8ef7" }} />
              <span style={{ display: "block", width: "16px", height: "1.8px", borderRadius: "2px", background: "#4f8ef7" }} />
            </>
          )}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: isOpen ? "16px 12px" : "16px 8px",
        display: "flex", flexDirection: "column", gap: "4px",
        scrollbarWidth: "none",
        transition: dragging ? "none" : "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", zIndex: 1,
      }}>
        {SECTION_ITEMS.map(item => (
          <SectionNavItem
            key={item.section}
            item={item}
            active={isHomePage && activeSection === item.section}
            open={isOpen}
            onClick={() => dispatchSection(item.section)}
          />
        ))}

        <div style={{
          height: "1px", margin: "10px 4px",
          background: "linear-gradient(90deg,transparent,rgba(79,142,247,0.2),transparent)",
        }} />

        {ROUTE_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            open={isOpen}
          />
        ))}

        <div style={{
          height: "1px", margin: "10px 4px",
          background: "linear-gradient(90deg,transparent,rgba(79,142,247,0.2),transparent)",
        }} />

        {BOTTOM_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            open={isOpen}
          />
        ))}
      </nav>

      {/* ── User row ── */}
      <div
        style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center",
          padding: isOpen ? "12px 14px" : "12px 0",
          justifyContent: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
          transition: dragging ? "none" : "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          gap: isOpen ? "10px" : "0",
        }}
      >
        {/* Avatar */}
        <button
          onClick={handleProfileClick}
          title="Edit profile"
          style={{
            width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg,#4f8ef7,#a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 800, color: "#fff",
            boxShadow: "0 0 14px rgba(79,142,247,0.35)",
            border: "none", cursor: "pointer",
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(79,142,247,0.6)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(79,142,247,0.35)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {initials || "U"}
        </button>

        {/* Name + sub info */}
        <div
          style={{
            maxWidth: isOpen ? "120px" : "0px",
            opacity: isOpen ? 1 : 0,
            overflow: "hidden",
            transition: dragging ? "none" : "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
            pointerEvents: isOpen ? "auto" : "none",
            flexShrink: 0,
            flex: 1,
            minWidth: 0,
            cursor: "pointer",
          }}
          onClick={handleProfileClick}
        >
          <div style={{
            fontSize: "13px", fontWeight: 600, color: "#e8eaf2",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {displayName}
          </div>
          {subLine && (
            <div style={{
              fontSize: "10px", color: "rgba(255,255,255,0.38)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {subLine}
            </div>
          )}
        </div>

        {/* Logout + online dot when open */}
        {isOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#22d3ee", boxShadow: "0 0 8px #22d3ee",
              animation: "sb-pulse 2s ease-in-out infinite",
            }} />
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 12,
                transition: "all 200ms ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.15)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.4)";
                (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
              }}
            >
              ↪
            </button>
          </div>
        )}
      </div>

      {/* ── Drag handle ── */}
      <div
        onMouseDown={onDragStart}
        title="Drag to resize sidebar"
        style={{
          position: "absolute",
          top: 0, right: -4,
          width: 8, height: "100%",
          cursor: "col-resize",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Visible line that appears on hover / drag */}
        <div style={{
          width: 2,
          height: "100%",
          background: dragging
            ? "rgba(79,142,247,0.7)"
            : "transparent",
          transition: "background 0.2s",
          borderRadius: 2,
        }}
        onMouseEnter={e => {
          if (!dragging)
            (e.currentTarget as HTMLDivElement).style.background = "rgba(79,142,247,0.35)";
        }}
        onMouseLeave={e => {
          if (!dragging)
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
        />
      </div>
    </aside>
  );
}

/* ── Section NavItem ── */
function SectionNavItem({
  item, active, open, onClick,
}: {
  item: { section: PageSection; label: string; icon: React.FC<{ size?: number; color?: string }> };
  active: boolean; open: boolean; onClick: () => void;
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
        display: "flex", alignItems: "center",
        justifyContent: open ? "flex-start" : "center",
        height: "42px", padding: open ? "0 12px" : "0",
        borderRadius: "10px",
        border: active ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent",
        background: active
          ? "linear-gradient(90deg,rgba(79,142,247,0.18),rgba(167,139,250,0.08))"
          : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        width: "100%", boxSizing: "border-box", cursor: "pointer",
        position: "relative", overflow: "visible",
        transition: "background 0.2s, border-color 0.2s, padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        textAlign: "left",
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
      {active && !open && (
        <div style={{
          position: "absolute", top: 6, right: 6,
          width: 6, height: 6, borderRadius: "50%",
          background: "#4f8ef7", boxShadow: "0 0 6px #4f8ef7", zIndex: 2,
        }} />
      )}
      <span style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        width: "22px", height: "22px", transition: "transform 0.2s",
        transform: hovered && !active ? "scale(1.12)" : "scale(1)", zIndex: 1,
      }}>
        <Icon size={18} color={active ? "#4f8ef7" : hovered ? "#c4cadf" : "#6b7399"} />
      </span>
      <span style={{
        fontSize: "13px", fontWeight: active ? 600 : 500,
        color: active ? "#e8eaf2" : hovered ? "#c4cadf" : "#6b7399",
        whiteSpace: "nowrap", overflow: "hidden",
        maxWidth: open ? "180px" : "0px", opacity: open ? 1 : 0,
        marginLeft: open ? "12px" : "0px",
        transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, margin-left 0.3s, color 0.2s",
        pointerEvents: "none",
      }}>
        {item.label}
      </span>
    </button>
  );
}

/* ── Route NavItem ── */
function NavItem({
  item, active, open,
}: {
  item: { href: string; label: string; icon: React.FC<{ size?: number; color?: string }> };
  active: boolean; open: boolean;
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
        justifyContent: open ? "flex-start" : "center",
        height: "42px", padding: open ? "0 12px" : "0",
        borderRadius: "10px", textDecoration: "none",
        position: "relative", overflow: "visible",
        background: active
          ? "linear-gradient(90deg,rgba(79,142,247,0.18),rgba(167,139,250,0.08))"
          : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: active ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent",
        transition: "background 0.2s, border-color 0.2s, padding 0.35s cubic-bezier(0.4,0,0.2,1)",
        width: "100%", boxSizing: "border-box",
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
        width: "22px", height: "22px", transition: "transform 0.2s",
        transform: hovered && !active ? "scale(1.12)" : "scale(1)", zIndex: 1,
      }}>
        <Icon size={18} color={active ? "#4f8ef7" : hovered ? "#c4cadf" : "#6b7399"} />
      </span>
      <span style={{
        fontSize: "13px", fontWeight: active ? 600 : 500,
        color: active ? "#e8eaf2" : hovered ? "#c4cadf" : "#6b7399",
        whiteSpace: "nowrap", overflow: "hidden",
        maxWidth: open ? "180px" : "0px", opacity: open ? 1 : 0,
        marginLeft: open ? "12px" : "0px",
        transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, margin-left 0.3s, color 0.2s",
        pointerEvents: "none",
      }}>
        {item.label}
      </span>
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