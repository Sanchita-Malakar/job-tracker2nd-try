"use client";
// ============================================================
//  Logout button — add this to your Sidebar.tsx user row
//
//  Replace the existing user row section in Sidebar.tsx with
//  this version that includes a working logout button.
// ============================================================

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Add this hook inside your Sidebar component:
//
//   const router = useRouter();
//   const handleLogout = async () => {
//     const supabase = createClient();
//     await supabase.auth.signOut();
//     router.push("/login");
//     router.refresh();
//   };
//
// Then add a logout button inside the user row div.
// Here's the complete updated user row section to paste in:

export function UserRow({ open }: { open: boolean }) {
  const router   = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div style={{
      position: "relative", zIndex: 1,
      display: "flex", alignItems: "center",
      padding: open ? "14px 16px" : "14px 0",
      justifyContent: "center",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      flexShrink: 0,
      transition: "padding 0.35s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      gap: open ? "12px" : "0",
    }}>
      {/* Avatar */}
      <div style={{
        width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
        background: "linear-gradient(135deg,#4f8ef7,#a78bfa)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 800, color: "#fff",
        boxShadow: "0 0 14px rgba(79,142,247,0.35)",
      }}>
        RD
      </div>

      {/* Name + role */}
      <div style={{
        maxWidth: open ? "120px" : "0px",
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
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

      {/* Logout button — only when open */}
      {open && (
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            marginLeft: "auto",
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 13,
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
      )}
    </div>
  );
}