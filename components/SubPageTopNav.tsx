"use client";
// components/SubPageTopNav.tsx
// ============================================================
//  FIX: handleAddApp previously POSTed to /api/applications
//  but never refreshed DataContext, so the new app wasn't
//  visible without a full page reload.
//  Now it calls refreshAll() from DataContext after POST.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useData } from "@/contexts/DataContext";
import AddApplicationModal from "@/components/AddApplicationModal";
import type { Application } from "@/types";

interface SubPageTopNavProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  title?: string;
}

export default function SubPageTopNav({
  searchQuery = "",
  onSearchChange,
  title,
}: SubPageTopNavProps) {
  const router = useRouter();
  const { profile } = useSession();
  const { refreshAll } = useData(); // FIX: get refreshAll from context
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readSidebarState = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-w").trim();
      setSidebarOpen(val !== "68px");
    };
    readSidebarState();
    window.addEventListener("sidebar:toggle", readSidebarState);
    return () => window.removeEventListener("sidebar:toggle", readSidebarState);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSidebarToggle = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    document.documentElement.style.setProperty("--sidebar-w", next ? "240px" : "68px");
    window.dispatchEvent(new Event("sidebar:toggle"));
  };

  // FIX: POST to API then refresh DataContext (not just navigate)
  const handleAddApp = async (app: Omit<Application, "id">) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(app),
      });
      if (res.ok) {
        setModalOpen(false);
        await refreshAll(); // sync DataContext everywhere
        router.push("/");   // then navigate to dashboard to see it
      }
    } catch (err) {
      console.error("Failed to add application:", err);
    }
  };

  const sidebarW = sidebarOpen ? 240 : 68;
  const displayName = profile?.name || "User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .sptn {
          position: fixed; top: 0;
          left: ${sidebarW}px; right: 0;
          height: 70px; z-index: 80;
          display: flex; align-items: center; gap: 10px;
          padding: 0 20px 0 18px;
          background: linear-gradient(90deg,#0d1020 0%,#13161e 50%,#0f1117 100%);
          border-bottom: 1px solid rgba(79,142,247,0.13);
          box-shadow: 0 4px 32px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(79,142,247,0.07);
          transition: left 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .sptn::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1.5px;
          background: linear-gradient(90deg,transparent 0%,#4f8ef7 25%,#22d3ee 50%,#a78bfa 75%,transparent 100%);
          background-size: 300% 100%;
          animation: sptn-sh 3.5s linear infinite;
          opacity: 0.75; pointer-events: none;
        }
        @keyframes sptn-sh { 0%{background-position:100% 0} 100%{background-position:-200% 0} }
        .sptn-ham {
          position: relative; z-index: 1; flex-shrink: 0;
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(79,142,247,0.08); border: 1px solid rgba(79,142,247,0.22);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 5px; cursor: pointer; outline: none;
          transition: background 0.2s, box-shadow 0.2s, transform 0.12s;
        }
        .sptn-ham:hover { background: rgba(79,142,247,0.16); box-shadow: 0 0 16px rgba(79,142,247,0.32); transform: scale(1.05); }
        .sptn-bar { display: block; height: 1.8px; border-radius: 2px; background: #4f8ef7; transition: transform 0.32s, opacity 0.22s, width 0.32s; }
        .sptn-bar-1 { width: 18px; } .sptn-bar-2 { width: 13px; } .sptn-bar-3 { width: 18px; }
        .sptn-ham[data-x="true"] .sptn-bar-1 { transform: translateY(6.8px) rotate(45deg); width: 18px; }
        .sptn-ham[data-x="true"] .sptn-bar-2 { opacity: 0; transform: scaleX(0); }
        .sptn-ham[data-x="true"] .sptn-bar-3 { transform: translateY(-6.8px) rotate(-45deg); width: 18px; }
        .sptn-search { position: relative; z-index: 1; flex: 1; max-width: 380px; }
        .sptn-sico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #6b7399; font-size: 16px; pointer-events: none; transition: color 0.2s; }
        .sptn-search:focus-within .sptn-sico { color: #4f8ef7; }
        .sptn-sinput { width: 100%; box-sizing: border-box; background: rgba(24,28,38,0.85); border: 1px solid rgba(45,51,82,0.7); border-radius: 13px; padding: 10px 16px 10px 38px; font-size: 13.5px; color: #e8eaf2; outline: none; caret-color: #4f8ef7; transition: border-color 0.22s, box-shadow 0.22s, background 0.22s; }
        .sptn-sinput::placeholder { color: #6b7399; }
        .sptn-sinput:focus { border-color: rgba(79,142,247,0.55); box-shadow: 0 0 0 3px rgba(79,142,247,0.16); background: rgba(24,28,38,0.98); }
        .sptn-btn { position: relative; z-index: 1; flex-shrink: 0; display: flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; outline: none; border: none; transition: all 0.2s; }
        .sptn-back { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1) !important; color: #a1a8c6; }
        .sptn-back:hover { background: rgba(79,142,247,0.14); border-color: rgba(79,142,247,0.35) !important; color: #4f8ef7; transform: translateY(-1px); }
        .sptn-add { background: linear-gradient(135deg,#4f8ef7,#3b7ef0); color: #fff; box-shadow: 0 4px 18px rgba(79,142,247,0.4); }
        .sptn-add:hover { background: linear-gradient(135deg,#3b7ef0,#2563eb); box-shadow: 0 6px 26px rgba(79,142,247,0.62); transform: translateY(-1.5px); }
        .sptn-add:active { transform: scale(0.96); }
        .sptn-sep { width: 1px; height: 26px; flex-shrink: 0; background: linear-gradient(180deg,transparent,rgba(79,142,247,0.22),transparent); }
        .sptn-icon { position: relative; z-index: 1; flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; background: rgba(24,28,38,0.8); border: 1px solid rgba(45,51,82,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; color: #a1a8c6; outline: none; transition: all 0.2s; }
        .sptn-icon:hover { background: rgba(79,142,247,0.14); border-color: rgba(79,142,247,0.38); color: #4f8ef7; box-shadow: 0 0 16px rgba(79,142,247,0.26); }
        .sptn-ndot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#f87171,#ef4444); border: 2px solid #0f1117; animation: nd 2s ease-in-out infinite; }
        @keyframes nd { 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
        .sptn-npanel { position: absolute; top: calc(100% + 10px); right: 0; width: 290px; background: linear-gradient(145deg,#13161e,#0f1117); border: 1px solid rgba(79,142,247,0.18); border-radius: 16px; box-shadow: 0 20px 55px rgba(0,0,0,0.7); overflow: hidden; animation: npin 0.18s cubic-bezier(0.16,1,0.3,1); transform-origin: top right; z-index: 100; }
        @keyframes npin { from{opacity:0;transform:scale(0.9) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .sptn-nh { padding: 13px 16px 9px; font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: #6b7399; border-bottom: 1px solid rgba(45,51,82,0.5); }
        .sptn-ni { display: flex; align-items: flex-start; gap: 11px; padding: 11px 16px; border-bottom: 1px solid rgba(45,51,82,0.28); cursor: pointer; transition: background 0.14s; }
        .sptn-ni:last-child { border-bottom: none; }
        .sptn-ni:hover { background: rgba(79,142,247,0.07); }
        .sptn-av { position: relative; z-index: 1; flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#4f8ef7 0%,#22d3ee 45%,#a78bfa 100%); border: 2px solid rgba(79,142,247,0.38); display: flex; align-items: center; justify-content: center; font-size: 13.5px; font-weight: 800; color: #fff; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(79,142,247,0.3); transition: all 0.2s; outline: none; }
        .sptn-av:hover { box-shadow: 0 6px 22px rgba(79,142,247,0.52); transform: translateY(-1px) scale(1.04); }
        .sptn-online { position: absolute; bottom: 4px; right: 4px; width: 7px; height: 7px; border-radius: 50%; background: #22d3ee; border: 2px solid #0f1117; box-shadow: 0 0 7px #22d3ee; }
        .sptn-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7399; flex-shrink: 0; }
        .sptn-crumb-sep { font-size: 11px; opacity: 0.5; }
        .sptn-crumb-cur { color: #e8eaf2; font-weight: 600; }
      `}</style>

      <header className="sptn">
        {/* Hamburger */}
        <button
          className="sptn-ham"
          data-x={sidebarOpen ? "true" : "false"}
          onClick={handleSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <span className="sptn-bar sptn-bar-1" />
          <span className="sptn-bar sptn-bar-2" />
          <span className="sptn-bar sptn-bar-3" />
        </button>

        {/* Breadcrumb */}
        <div className="sptn-crumb">
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7399", fontSize: 13, padding: 0, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#4f8ef7")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7399")}
          >🏠 Dashboard</button>
          {title && <>
            <span className="sptn-crumb-sep">›</span>
            <span className="sptn-crumb-cur">{title}</span>
          </>}
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="sptn-search">
            <span className="sptn-sico">⌕</span>
            <input
              type="text"
              className="sptn-sinput"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search…"
            />
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button className="sptn-btn sptn-back" onClick={() => router.push("/")}>
          ← Dashboard
        </button>

        <div className="sptn-sep" />

        <button
          className="sptn-btn sptn-add"
          onClick={() => setModalOpen(true)}
        >
          <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>＋</span>
          Add Application
        </button>

        <div className="sptn-sep" />

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
          <button className="sptn-icon" onClick={() => setNotifOpen(v => !v)} aria-label="Notifications">
            🔔
            <span className="sptn-ndot" />
          </button>
          {notifOpen && (
            <div className="sptn-npanel">
              <div className="sptn-nh">Notifications</div>
              {[
                { color: "#22d3ee", text: "Google OA scheduled for Mar 20", time: "2h ago" },
                { color: "#fbbf24", text: "Amazon application updated",      time: "5h ago" },
                { color: "#34d399", text: "Microsoft sent an offer 🎉",      time: "1d ago" },
                { color: "#a78bfa", text: "Reminder: Follow up with Meta",   time: "2d ago" },
              ].map((n, i) => (
                <div className="sptn-ni" key={i}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: n.color, boxShadow: `0 0 5px ${n.color}`, flexShrink: 0, marginTop: 5, display: "block" }} />
                  <div>
                    <div style={{ fontSize: 12.5, color: "#c4cadf", lineHeight: 1.5 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "#6b7399", marginTop: 1 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <button
          className="sptn-av"
          onClick={() => window.dispatchEvent(new Event("profile:open"))}
          aria-label="Edit profile"
          style={{ marginRight: 4 }}
        >
          {initials || "U"}
          <span className="sptn-online" />
        </button>
      </header>

      {/* Spacer */}
      <div style={{ height: 70, flexShrink: 0 }} />

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddApp}
      />
    </>
  );
}