"use client";
// components/TopNav.tsx
// ============================================================
//  UPDATED: notification panel now shows REAL data
//  - upcoming reminders (next 48h)
//  - recent status changes (last 7 days)
//  Uses useNotifications hook, marks read on panel open
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/components/SessionProvider";
import { useNotifications } from "@/hooks/useNotifications";

interface TopNavProps {
  onAddClick:       () => void;
  searchQuery:      string;
  onSearchChange:   (q: string) => void;
  sidebarOpen:      boolean;
  onSidebarToggle:  () => void;
  onDrawerOpen:     () => void;
  isDrawerOpen?:    boolean;
}

export default function TopNav({
  onAddClick, searchQuery, onSearchChange,
  sidebarOpen, onSidebarToggle, onDrawerOpen,
  isDrawerOpen = false,
}: TopNavProps) {
  const { profile } = useSession();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [addPulsed, setAddPulsed] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAddPulsed(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Mark all read when panel opens
  const handleNotifToggle = () => {
    setNotifOpen(v => {
      if (!v) markAllRead();
      return !v;
    });
  };

  const sidebarW    = sidebarOpen ? 240 : 68;
  const displayName = profile?.name || "User";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .tn { position: fixed; top: 0; left: ${sidebarW}px; right: 0; height: 70px; z-index: 80; display: flex; align-items: center; gap: 10px; padding: 0 20px 0 18px; background: linear-gradient(90deg,#0d1020 0%,#13161e 50%,#0f1117 100%); border-bottom: 1px solid rgba(79,142,247,0.13); box-shadow: 0 4px 32px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(79,142,247,0.07); transition: left 0.35s cubic-bezier(0.4,0,0.2,1); overflow: visible; }
        .tn::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1.5px; background: linear-gradient(90deg,transparent 0%,#4f8ef7 25%,#22d3ee 50%,#a78bfa 75%,transparent 100%); background-size: 300% 100%; animation: tn-sh 3.5s linear infinite; opacity: 0.75; pointer-events: none; }
        @keyframes tn-sh { 0% { background-position: 100% 0; } 100% { background-position: -200% 0; } }
        .tn-ham { position: relative; z-index: 1; flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px; background: rgba(79,142,247,0.08); border: 1px solid rgba(79,142,247,0.22); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; cursor: pointer; outline: none; transition: background 0.2s, box-shadow 0.2s, transform 0.12s; }
        .tn-ham:hover { background: rgba(79,142,247,0.16); box-shadow: 0 0 16px rgba(79,142,247,0.32); transform: scale(1.05); }
        .tn-bar { display: block; height: 1.8px; border-radius: 2px; background: #4f8ef7; transition: transform 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s, width 0.32s; }
        .tn-bar-1 { width: 18px; } .tn-bar-2 { width: 13px; } .tn-bar-3 { width: 18px; }
        .tn-ham[data-x="true"] .tn-bar-1 { transform: translateY(6.8px) rotate(45deg); width: 18px; }
        .tn-ham[data-x="true"] .tn-bar-2 { opacity: 0; transform: scaleX(0); }
        .tn-ham[data-x="true"] .tn-bar-3 { transform: translateY(-6.8px) rotate(-45deg); width: 18px; }
        .tn-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; overflow: hidden; transition: max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.28s, transform 0.28s; }
        .tn-logomark { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; background: linear-gradient(135deg,#4f8ef7 0%,#22d3ee 50%,#a78bfa 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(79,142,247,0.45); font-size: 14px; user-select: none; }
        .tn-logotext { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; background: linear-gradient(90deg,#4f8ef7,#a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; }
        .tn-search { position: relative; z-index: 1; flex: 1; max-width: 380px; }
        .tn-sico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #6b7399; font-size: 16px; pointer-events: none; transition: color 0.2s; }
        .tn-search:focus-within .tn-sico { color: #4f8ef7; }
        .tn-sinput { width: 100%; box-sizing: border-box; background: rgba(24,28,38,0.85); border: 1px solid rgba(45,51,82,0.7); border-radius: 13px; padding: 10px 48px 10px 38px; font-size: 13.5px; color: #e8eaf2; outline: none; caret-color: #4f8ef7; transition: border-color 0.22s, box-shadow 0.22s, background 0.22s; }
        .tn-sinput::placeholder { color: #6b7399; }
        .tn-sinput:focus { border-color: rgba(79,142,247,0.55); box-shadow: 0 0 0 3px rgba(79,142,247,0.16); background: rgba(24,28,38,0.98); }
        .tn-kbd { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); display: flex; gap: 3px; pointer-events: none; }
        .tn-kbd kbd { font-size: 10px; color: #6b7399; background: rgba(45,51,82,0.55); border: 1px solid rgba(79,142,247,0.18); border-radius: 4px; padding: 2px 5px; font-family: inherit; line-height: 1.4; }
        .tn-sinput:focus ~ .tn-kbd { opacity: 0; transition: opacity 0.15s; }
        .tn-gap { flex: 1; min-width: 0; }
        .tn-sep { width: 1px; height: 26px; flex-shrink: 0; background: linear-gradient(180deg,transparent,rgba(79,142,247,0.22),transparent); }
        .tn-drawer { position: relative; z-index: 1; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 9px 15px; background: rgba(167,139,250,0.09); border: 1px solid rgba(167,139,250,0.28); border-radius: 12px; color: #c4b5fd; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; outline: none; transition: background 0.2s, box-shadow 0.2s, transform 0.14s, border-color 0.2s; }
        .tn-drawer:hover { background: rgba(167,139,250,0.2); border-color: rgba(167,139,250,0.5); box-shadow: 0 0 18px rgba(167,139,250,0.25); transform: translateY(-1px); }
        .tn-dbars { display: flex; flex-direction: column; gap: 3px; flex-shrink: 0; }
        .tn-dbars span { display: block; height: 1.8px; border-radius: 2px; background: #a78bfa; transition: transform 0.2s; }
        .tn-dbars span:nth-child(1) { width: 14px; } .tn-dbars span:nth-child(2) { width: 10px; } .tn-dbars span:nth-child(3) { width: 14px; }
        .tn-drawer:hover .tn-dbars span:nth-child(1) { transform: translateX(3px); }
        .tn-drawer:hover .tn-dbars span:nth-child(3) { transform: translateX(-3px); }
        .tn-add { position: relative; z-index: 1; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: linear-gradient(135deg,#4f8ef7,#3b7ef0); border: 1px solid rgba(79,142,247,0.4); border-radius: 12px; color: #fff; font-size: 13.5px; font-weight: 700; cursor: pointer; white-space: nowrap; outline: none; box-shadow: 0 4px 18px rgba(79,142,247,0.4); transition: box-shadow 0.2s, transform 0.14s, background 0.2s; }
        .tn-add:hover { background: linear-gradient(135deg,#3b7ef0,#2563eb); box-shadow: 0 6px 26px rgba(79,142,247,0.62); transform: translateY(-1.5px); }
        .tn-add:active { transform: scale(0.96); }
        .tn-plus { font-size: 18px; line-height: 1; font-weight: 300; }
        @keyframes tn-pulse { 0%,100% { box-shadow: 0 4px 18px rgba(79,142,247,0.4); } 50% { box-shadow: 0 4px 28px rgba(79,142,247,0.75), 0 0 0 6px rgba(79,142,247,0.12); } }
        .tn-add-pulse { animation: tn-pulse 2s ease-in-out 3; }
        .tn-icon { position: relative; z-index: 1; flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; background: rgba(24,28,38,0.8); border: 1px solid rgba(45,51,82,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; color: #a1a8c6; outline: none; transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.14s, color 0.2s; }
        .tn-icon:hover { background: rgba(79,142,247,0.14); border-color: rgba(79,142,247,0.38); color: #4f8ef7; box-shadow: 0 0 16px rgba(79,142,247,0.26); transform: translateY(-1px); }
        .tn-av { position: relative; z-index: 1; flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#4f8ef7 0%,#22d3ee 45%,#a78bfa 100%); border: 2px solid rgba(79,142,247,0.38); display: flex; align-items: center; justify-content: center; font-size: 13.5px; font-weight: 800; color: #fff; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(79,142,247,0.3); transition: box-shadow 0.2s, transform 0.14s; outline: none; }
        .tn-av:hover { box-shadow: 0 6px 22px rgba(79,142,247,0.52); transform: translateY(-1px) scale(1.04); }
        .tn-online { position: absolute; bottom: 4px; right: 4px; width: 7px; height: 7px; border-radius: 50%; background: #22d3ee; border: 2px solid #0f1117; box-shadow: 0 0 7px #22d3ee; }
        .tn-nbadge { position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px; border-radius: 9px; background: linear-gradient(135deg,#f87171,#ef4444); border: 2px solid #0f1117; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff; padding: 0 3px; animation: nd 2s ease-in-out infinite; box-shadow: 0 0 8px rgba(248,113,113,0.6); }
        @keyframes nd { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        .tn-npanel { position: absolute; top: calc(100% + 10px); right: 0; width: 320px; background: linear-gradient(145deg,#13161e,#0f1117); border: 1px solid rgba(79,142,247,0.18); border-radius: 18px; box-shadow: 0 20px 55px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03); overflow: hidden; animation: npin 0.18s cubic-bezier(0.16,1,0.3,1); transform-origin: top right; z-index: 200; }
        @keyframes npin { from { opacity:0; transform:scale(0.9) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .tn-nh { padding: 14px 16px 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(45,51,82,0.5); }
        .tn-ni { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(45,51,82,0.2); cursor: pointer; transition: background 0.14s; }
        .tn-ni:last-child { border-bottom: none; }
        .tn-ni:hover { background: rgba(79,142,247,0.06); }
        .tn-ni.urgent { background: rgba(248,113,113,0.04); }
        .tn-ni.urgent:hover { background: rgba(248,113,113,0.09); }
        .tn-empty { padding: 32px 16px; text-align: center; color: rgba(255,255,255,0.2); font-size: 13px; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <header className="tn">
        <button className="tn-ham" data-x={sidebarOpen ? "true" : "false"} onClick={onSidebarToggle} aria-label="Toggle sidebar">
          <span className="tn-bar tn-bar-1" />
          <span className="tn-bar tn-bar-2" />
          <span className="tn-bar tn-bar-3" />
        </button>

        <div className="tn-logo" style={{ maxWidth: sidebarOpen ? 0 : 180, opacity: sidebarOpen ? 0 : 1, transform: sidebarOpen ? "translateX(-10px)" : "translateX(0)", pointerEvents: sidebarOpen ? "none" : "auto" }}>
          <div className="tn-logomark">🚀</div>
          <span className="tn-logotext">Job Tracker</span>
        </div>

        <div className="tn-search">
          <span className="tn-sico">⌕</span>
          <input type="text" className="tn-sinput" value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search company, role or status…" />
          {!searchQuery && <span className="tn-kbd"><kbd>⌘</kbd><kbd>K</kbd></span>}
        </div>

        <div className="tn-gap" />

        <button className="tn-drawer" onClick={onDrawerOpen} aria-label="Toggle app detail panel"
          style={isDrawerOpen ? { background: "rgba(79,142,247,0.18)", borderColor: "rgba(79,142,247,0.45)", color: "#4f8ef7", boxShadow: "0 0 16px rgba(79,142,247,0.2)" } : undefined}>
          {isDrawerOpen ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 13L13 1M1 1l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            <div className="tn-dbars"><span /><span /><span /></div>
          )}
          {isDrawerOpen ? "Close Panel" : "App Detail"}
        </button>

        <div className="tn-sep" />

        <button className={`tn-add${addPulsed ? " tn-add-pulse" : ""}`} onClick={onAddClick} aria-label="Add new application">
          <span className="tn-plus">＋</span>
          Add Application
        </button>

        <div className="tn-sep" />

        {/* ── Real notifications panel ── */}
        <div ref={notifRef} style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
          <button className="tn-icon" onClick={handleNotifToggle} aria-label="Notifications">
            🔔
            {unreadCount > 0 && (
              <span className="tn-nbadge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="tn-npanel">
              {/* Header */}
              <div className="tn-nh">
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#6b7399" }}>
                  Notifications
                </span>
                {notifications.length > 0 && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif" }}>
                    {notifications.length} item{notifications.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Items */}
              {notifications.length === 0 ? (
                <div className="tn-empty">
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                  No notifications
                  <div style={{ fontSize: 12, marginTop: 4, color: "rgba(255,255,255,0.15)" }}>
                    Upcoming reminders and status changes appear here
                  </div>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`tn-ni${n.urgent ? " urgent" : ""}`}>
                    {/* Color dot + urgent pulse */}
                    <div style={{ position: "relative", flexShrink: 0, marginTop: 3 }}>
                      <span style={{
                        display: "block", width: 8, height: 8, borderRadius: "50%",
                        background: n.color, boxShadow: `0 0 6px ${n.color}`,
                      }} />
                      {n.urgent && (
                        <span style={{
                          position: "absolute", inset: -3,
                          borderRadius: "50%", border: `1.5px solid ${n.color}`,
                          animation: "nd 1.5s ease-in-out infinite", opacity: 0.5,
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#c4cadf", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {n.text}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: "#6b7399", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.subtext}
                        </span>
                        {n.urgent && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(248,113,113,0.15)", color: "#f87171", flexShrink: 0 }}>
                            NOW
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#4a5280", fontFamily: "'DM Sans', sans-serif", flexShrink: 0, marginTop: 2 }}>
                      {n.time}
                    </span>
                  </div>
                ))
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(45,51,82,0.4)", textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif" }}>
                    Showing reminders (48h) · Status changes (7 days)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="tn-av" onClick={() => window.dispatchEvent(new Event("profile:open"))} aria-label="Edit profile" title={`${displayName} — click to edit profile`} style={{ marginRight: 4 }}>
          {initials || "U"}
          <span className="tn-online" />
        </button>
      </header>

      <div style={{ height: 70, flexShrink: 0 }} />
    </>
  );
}