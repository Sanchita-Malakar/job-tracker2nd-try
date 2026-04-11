// app/page.tsx
"use client";
// ============================================================
//  ROOT PAGE — Dashboard
//
//  CRITICAL FIX: Applications were stored only in local React
//  state. Drawer tried to upload files against application IDs
//  that didn't exist in Supabase → foreign key violation.
//
//  Now: ALL applications come from DataContext (Supabase).
//  Adding an application POSTs to /api/applications and calls
//  refreshAll() so DataContext + KanbanBoard stay in sync.
// ============================================================

import { useState } from "react";
import TopNav from "@/components/TopNav";
import KanbanBoard from "@/components/KanbanBoard";
import StatsStrip from "@/components/StatsStrip";
import Drawer from "@/components/Drawer";
import AddApplicationModal from "@/components/AddApplicationModal";
import { useData } from "@/contexts/DataContext";
import type { Application } from "@/types";

export type PageSection = "dashboard" | "applications";

export default function HomePage() {
  const {
    applications,
    loading,
    refreshAll,
    refreshApplication,
    setApplications,
  } = useData();

  const [section,      setSection]      = useState<PageSection>("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [selectedApp,  setSelectedApp]  = useState<Application | null>(null);

  // ── Sidebar toggle ────────────────────────────────────────
  const handleSidebarToggle = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      document.documentElement.style.setProperty("--sidebar-w", next ? "240px" : "68px");
      window.dispatchEvent(new Event("sidebar:toggle"));
      return next;
    });
  };

  // ── Add application → POST to Supabase ───────────────────
  // FIX: previously this only updated local state. Now it hits
  // /api/applications, which inserts into the `applications` table.
  // After success, refreshAll() syncs DataContext so the new app's
  // real DB id is available for file uploads, tasks etc.
  const handleAddApp = async (appData: Omit<Application, "id">) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appData),
      });
      if (res.ok) {
        // Refresh everything so DataContext has the real DB row with real id
        await refreshAll();
      }
    } catch (err) {
      console.error("Failed to add application:", err);
    }
  };

  // ── Status change → PATCH Supabase ───────────────────────
  const handleStatusChange = async (id: number, newStatus: string) => {
    // Optimistic update
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, status: newStatus as Application["status"] } : a)
    );
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      refreshApplication(id);
    } catch {
      // revert on failure
      refreshApplication(id);
    }
  };

  // ── Update app fields from drawer (status, notes etc.) ───
  const handleUpdateApp = async (updatedFields: Partial<Application>) => {
    if (!selectedApp) return;
    // Optimistic
    setApplications(prev =>
      prev.map(a => a.id === selectedApp.id ? { ...a, ...updatedFields } : a)
    );
    setSelectedApp(prev => prev ? { ...prev, ...updatedFields } : prev);
    try {
      await fetch(`/api/applications/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      refreshApplication(selectedApp.id);
    } catch {
      refreshApplication(selectedApp.id);
    }
  };

  // ── Stats counts ─────────────────────────────────────────
  const counts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <TopNav
        onAddClick={() => setModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={handleSidebarToggle}
        onDrawerOpen={() => setSelectedApp(applications[0] ?? null)}
        isDrawerOpen={!!selectedApp}
      />

      <main style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "28px 32px",
        display: "flex", flexDirection: "column", gap: 28,
      }}>
        {loading ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            flex: 1, gap: 16, color: "#a1a8c6",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid rgba(79,142,247,0.2)", borderTopColor: "#4f8ef7",
              animation: "spin 0.8s linear infinite",
            }} />
            Loading your applications…
          </div>
        ) : (
          <>
            {section === "dashboard" && (
              <StatsStrip counts={counts} />
            )}

            <KanbanBoard
              applications={applications}
              onStatusChange={handleStatusChange}
              onCardClick={app => setSelectedApp(app)}
              searchQuery={searchQuery}
            />

            {applications.length === 0 && !loading && (
              <div style={{
                textAlign: "center", padding: "60px 0",
                color: "#a1a8c6",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>
                  No applications yet
                </p>
                <p style={{ fontSize: 13, margin: 0 }}>
                  Click <strong>Add Application</strong> to get started.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawer — per-application files, notes, tasks, reminders */}
      <Drawer
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onUpdateApp={handleUpdateApp}
      />

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddApp}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}