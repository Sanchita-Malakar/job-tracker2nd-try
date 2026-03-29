"use client";
import { useState, useEffect } from "react";
import TopNav from "@/components/TopNav";
import StatsStrip from "@/components/StatsStrip";
import KanbanBoard from "@/components/KanbanBoard";
import Drawer from "@/components/Drawer";
import AddApplicationModal from "@/components/AddApplicationModal";
import type { Application } from "@/types/index";

const INITIAL_APPS: Application[] = [
  { id: 1,  company: "Google",    role: "SDE Intern",        status: "Applied",   date: "10 Mar", notes: "Referral from LinkedIn" },
  { id: 2,  company: "TCS",       role: "Software Engineer", status: "Applied",   date: "08 Mar", notes: "" },
  { id: 3,  company: "Infosys",   role: "Systems Engineer",  status: "Applied",   date: "12 Mar", notes: "" },
  { id: 4,  company: "Amazon",    role: "SDE Intern",        status: "OA",        date: "05 Mar", notes: "OA was easy" },
  { id: 5,  company: "Flipkart",  role: "Backend Intern",    status: "OA",        date: "06 Mar", notes: "" },
  { id: 6,  company: "Razorpay",  role: "Frontend Intern",   status: "OA",        date: "07 Mar", notes: "" },
  { id: 7,  company: "Microsoft", role: "PM Intern",         status: "Interview", date: "01 Mar", notes: "3 rounds" },
  { id: 8,  company: "Stripe",    role: "SDE Intern",        status: "Offer",     date: "20 Feb", notes: "🎉 Accepted!" },
  { id: 9,  company: "Zomato",    role: "ML Intern",         status: "Rejected",  date: "14 Mar", notes: "No feedback given" },
  { id: 10, company: "Swiggy",    role: "SDE Intern",        status: "Rejected",  date: "11 Mar", notes: "" },
];

const COLS = ["Applied", "OA", "Interview", "Offer", "Rejected"];

// The two sections this page handles
export type PageSection = "dashboard" | "applications";

export default function ApplicationsPage() {
  const [apps,        setApps]        = useState<Application[]>(INITIAL_APPS);
  const [openApp,     setOpenApp]     = useState<Application | null>(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<PageSection>("dashboard");

  // Listen for section-change events dispatched by the Sidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent<PageSection>).detail;
      setActiveSection(section);
    };
    window.addEventListener("page:section", handler);
    return () => window.removeEventListener("page:section", handler);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      // Sync CSS variable immediately so sidebar-offset margin updates without waiting for Sidebar re-render
      document.documentElement.style.setProperty("--sidebar-w", next ? "240px" : "68px");
      return next;
    });
    // Single dispatch — Sidebar listens for this to flip its own open state
    window.dispatchEvent(new Event("sidebar:toggle"));
  };

  const counts = COLS.reduce((acc, col) => {
    acc[col] = apps.filter(a => a.status === col).length;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = (id: number, newStatus: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    if (openApp?.id === id) setOpenApp(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const handleAdd = (app: Omit<Application, "id">) => {
    setApps(prev => [...prev, { ...app, id: Date.now() }]);
  };

  const handleDrawerOpen = () => {
    if (openApp) {
      setOpenApp(null);
    } else {
      setOpenApp(apps[0] ?? null);
    }
  };

  const isDrawerOpen = openApp !== null;

  return (
    <div className="flex flex-col h-full relative">
      <TopNav
        onAddClick={() => setModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={toggleSidebar}
        onDrawerOpen={handleDrawerOpen}
        isDrawerOpen={isDrawerOpen}
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "28px 40px 48px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          transition: "margin-right 0.35s cubic-bezier(0.4,0,0.2,1)",
          marginRight: isDrawerOpen ? "440px" : "0px",
        }}
      >
        {/* ── DASHBOARD SECTION ── */}
        {activeSection === "dashboard" && (
          <>
            <SectionHeader
              title="Dashboard"
              subtitle="Your job search at a glance"
            />
            <StatsStrip counts={counts} />

            {/* Mini pipeline preview below stats */}
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}>
                <div>
                  <h2 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "18px", fontWeight: 700,
                    color: "#e8eaf2", margin: 0,
                  }}>
                    Pipeline Overview
                  </h2>
                  <p style={{ fontSize: "13px", color: "#a1a8c6", marginTop: "4px" }}>
                    Switch to{" "}
                    <button
                      onClick={() => setActiveSection("applications")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4f8ef7",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      Applications
                    </button>{" "}
                    to manage cards · Drag to move
                  </p>
                </div>
                <TotalBadge count={apps.length} />
              </div>

              <div style={{ paddingRight: "4px", paddingBottom: "16px" }}>
                <KanbanBoard
                  applications={apps}
                  onStatusChange={handleStatusChange}
                  onCardClick={(app) => {
                    setOpenApp(app);
                  }}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </>
        )}

        {/* ── APPLICATIONS SECTION ── */}
        {activeSection === "applications" && (
          <>
            <SectionHeader
              title="Applications"
              subtitle="Track your job search pipeline in real time"
            />

            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}>
                <div>
                  <h2 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "20px", fontWeight: 700,
                    color: "#e8eaf2", margin: 0,
                  }}>
                    Pipeline
                  </h2>
                  <p style={{ fontSize: "13px", color: "#a1a8c6", marginTop: "4px" }}>
                    Click any card to view details · Drag to move
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {isDrawerOpen && (
                    <button
                      onClick={() => setOpenApp(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "10px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#f87171",
                        fontSize: "12px", fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.18s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.45)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)";
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 11L11 1M1 1l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      Close panel
                    </button>
                  )}
                  <TotalBadge count={apps.length} />
                </div>
              </div>

              <div style={{ paddingRight: "4px", paddingBottom: "16px" }}>
                <KanbanBoard
                  applications={apps}
                  onStatusChange={handleStatusChange}
                  onCardClick={setOpenApp}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Drawer app={openApp} onClose={() => setOpenApp(null)} />

      <AddApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}

/* ── Small reusable helpers ── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "24px", fontWeight: 800,
        background: "linear-gradient(90deg, #4f8ef7, #a78bfa)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        lineHeight: 1.2, margin: 0,
      }}>
        {title}
      </h1>
      <p style={{ fontSize: "13px", color: "#a1a8c6", marginTop: "6px", fontWeight: 500 }}>
        {subtitle}
      </p>
    </div>
  );
}

function TotalBadge({ count }: { count: number }) {
  return (
    <div style={{
      fontSize: "12px", fontWeight: 600,
      padding: "6px 14px", borderRadius: "20px",
      background: "rgba(79,142,247,0.12)",
      border: "1px solid rgba(79,142,247,0.25)",
      color: "#4f8ef7", flexShrink: 0,
    }}>
      {count} total
    </div>
  );
}