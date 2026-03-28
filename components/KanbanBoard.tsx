"use client";
import { useState } from "react";
import type { Application } from "@/types";

const COLS = ["Applied", "OA", "Interview", "Offer", "Rejected"] as const;
type ColType = (typeof COLS)[number];

const COL_CONFIG: Record<
  ColType,
  {
    accent: string;
    bg: string;
    labelColor: string;
    badge: string;
    badgeText: string;
  }
> = {
  Applied:   { accent: "#f59e0b", bg: "rgba(245,158,11,0.07)",  labelColor: "#fbbf24", badge: "rgba(245,158,11,0.15)", badgeText: "#f59e0b" },
  OA:        { accent: "#06b6d4", bg: "rgba(6,182,212,0.07)",   labelColor: "#22d3ee", badge: "rgba(6,182,212,0.15)",  badgeText: "#06b6d4" },
  Interview: { accent: "#f97316", bg: "rgba(249,115,22,0.07)",  labelColor: "#fb923c", badge: "rgba(249,115,22,0.15)", badgeText: "#f97316" },
  Offer:     { accent: "#10b981", bg: "rgba(16,185,129,0.07)",  labelColor: "#34d399", badge: "rgba(16,185,129,0.15)", badgeText: "#10b981" },
  Rejected:  { accent: "#ef4444", bg: "rgba(239,68,68,0.07)",   labelColor: "#f87171", badge: "rgba(239,68,68,0.15)",  badgeText: "#ef4444" },
};

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (id: number, newStatus: string) => void;
  onCardClick: (app: Application) => void;
  searchQuery: string;
}

export default function KanbanBoard({
  applications,
  onStatusChange,
  onCardClick,
  searchQuery,
}: KanbanBoardProps) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const filtered = applications.filter(
    (a) =>
      searchQuery === "" ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        overflowY: "visible",
        paddingBottom: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "14px",
          minWidth: "900px",
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        {COLS.map((col) => {
          const cards = filtered.filter((a) => a.status === col);
          const cfg = COL_CONFIG[col];
          const isOver = dragOver === col;

          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => {
                if (dragId !== null) onStatusChange(dragId, col);
                setDragOver(null);
                setDragId(null);
              }}
              style={{
                flex: "1 1 0",
                minWidth: "160px",
                maxWidth: "280px",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                overflow: "hidden",
                border: isOver
                  ? `1.5px solid ${cfg.accent}66`
                  : "1.5px solid rgba(255,255,255,0.08)",
                background: isOver
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.025)",
                boxShadow: isOver
                  ? `0 0 0 3px ${cfg.accent}22`
                  : "0 2px 12px rgba(0,0,0,0.25)",
                transform: isOver ? "scale(1.012)" : "scale(1)",
                transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                minHeight: "200px",
                maxHeight: "70vh",
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: "12px 14px 11px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: cfg.bg,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: cfg.accent,
                      boxShadow: `0 0 6px ${cfg.accent}90`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: cfg.labelColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {col === "OA" ? "Assessment" : col}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: cfg.badge,
                    color: cfg.badgeText,
                    border: `1px solid ${cfg.accent}35`,
                    flexShrink: 0,
                  }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "10px",
                  scrollbarWidth: "none",
                }}
              >
                {cards.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "100px",
                      border: `1.5px dashed ${cfg.accent}35`,
                      borderRadius: "10px",
                      color: "rgba(255,255,255,0.22)",
                      fontSize: "12px",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px", opacity: 0.4 }}>⊕</span>
                    Drop here
                  </div>
                ) : (
                  cards.map((app) => (
                    <KanbanCard
                      key={app.id}
                      app={app}
                      col={col}
                      cfg={cfg}
                      isDragging={dragId === app.id}
                      onDragStart={() => setDragId(app.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => onCardClick(app)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CardProps {
  app: Application;
  col: ColType;
  cfg: (typeof COL_CONFIG)[ColType];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function KanbanCard({ app, col, cfg, isDragging, onDragStart, onDragEnd, onClick }: CardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "11px 13px",
        borderRadius: "10px",
        cursor: "pointer",
        userSelect: "none",
        opacity: isDragging ? 0.4 : 1,
        flexShrink: 0,
        borderLeft: `3px solid ${hovered ? cfg.accent : cfg.accent + "55"}`,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        transform: hovered ? "translateX(3px)" : "translateX(0)",
        boxShadow: hovered
          ? `-3px 0 14px ${cfg.accent}30, 0 4px 16px rgba(0,0,0,0.3)`
          : "0 1px 4px rgba(0,0,0,0.2)",
        transition:
          "transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#e8eaf2",
          marginBottom: "3px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {app.company}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.42)",
          marginBottom: "10px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {app.role}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {app.date}
        </span>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "3px 7px",
            borderRadius: "20px",
            background: cfg.badge,
            color: cfg.badgeText,
            border: `1px solid ${cfg.accent}35`,
            flexShrink: 0,
          }}
        >
          {col === "OA" ? "OA" : col}
        </span>
      </div>
    </div>
  );
}