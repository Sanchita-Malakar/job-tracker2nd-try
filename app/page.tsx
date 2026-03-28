"use client";
import { useState } from "react";
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

export default function ApplicationsPage() {
  const [apps,        setApps]        = useState<Application[]>(INITIAL_APPS);
  const [openApp,     setOpenApp]     = useState<Application | null>(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

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

  const isDrawerOpen = openApp !== null;

  return (
    <div className="flex flex-col h-full relative">
      <TopNav
        onAddClick={() => setModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={toggleSidebar}
        onDrawerOpen={() => {}}
      />

      <div className={`flex-1 overflow-y-auto p-6 flex flex-col gap-6 transition-all duration-300 ${isDrawerOpen ? "mr-[400px]" : "mr-0"}`}>
        <div>
          <h1 className="font-['Syne'] text-[22px] font-bold bg-gradient-to-r from-[#4f8ef7] to-[#a78bfa] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-[13px] text-[#a1a8c6] mt-[4px] font-medium">Track your job search pipeline in real time</p>
        </div>

        <StatsStrip counts={counts} />

        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <div>
              <h2 className="font-['Syne'] text-[20px] font-bold text-[#e8eaf2]">Pipeline</h2>
              <p className="text-[13px] text-[#a1a8c6] mt-[2px]">Drag cards to update status</p>
            </div>
          </div>
          <KanbanBoard
            applications={apps}
            onStatusChange={handleStatusChange}
            onCardClick={setOpenApp}
            searchQuery={searchQuery}
          />
        </div>
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