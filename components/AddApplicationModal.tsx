"use client";
import { useState } from "react";
import type { Application } from "@/types";

const STATUSES = ["Applied", "OA", "Interview", "Offer", "Rejected"];

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (app: Omit<Application, "id">) => void;
}

export default function AddApplicationModal({ isOpen, onClose, onAdd }: AddApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role,    setRole]    = useState("");
  const [status,  setStatus]  = useState("Applied");
  const [date,    setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [notes,   setNotes]   = useState("");

  const handleSubmit = () => {
    if (!company.trim() || !role.trim()) return;
    const d = new Date(date);
    const formatted = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    onAdd({ company: company.trim(), role: role.trim(), status, date: formatted, notes: notes.trim() });
    setCompany(""); setRole(""); setStatus("Applied"); setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  return (
    <div
      className={`
        fixed inset-0 bg-gradient-to-b from-black/70 to-black/90 backdrop-blur-[12px] z-[999]
        flex items-center justify-center p-4
        transition-all duration-300
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
      `}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`
          bg-gradient-to-b from-[#13161e]/95 to-[#0f1117]/95 backdrop-blur-xl
          border border-[#2d3352]/60 rounded-3xl p-8 w-[520px] max-w-[95vw] max-h-[90vh] overflow-y-auto
          shadow-2xl shadow-black/60 hover:shadow-3xl hover:shadow-[#4f8ef7]/20
          transition-all duration-300 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}
        `}
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#232840]/50">
          <h2 className="font-['Syne'] text-[24px] font-black bg-gradient-to-r from-[#4f8ef7] via-[#22d3ee] to-[#a78bfa] bg-clip-text text-transparent">
            Add New Application
          </h2>
          <button
            onClick={onClose}
            className="
              w-12 h-12 rounded-2xl bg-[#181c26]/80 border border-[#2d3352]/50
              flex items-center justify-center text-[#a1a8c6] text-[18px] backdrop-blur-sm
              hover:bg-[#4f8ef7]/20 hover:text-[#4f8ef7] hover:border-[#4f8ef7]/50
              hover:shadow-lg hover:shadow-[#4f8ef7]/25 transition-all duration-200
            "
          >
            ✕
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-6">
            <Field label="Company *" error={company.trim() === "" && isOpen}>
              <input
                className={INPUT_CLS}
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Google, Amazon, Microsoft"
              />
            </Field>
            <Field label="Role *" error={role.trim() === "" && isOpen}>
              <input
                className={INPUT_CLS}
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. SDE Intern, Software Engineer"
              />
            </Field>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-6">
            <Field label="Status">
              <select
                className={`${INPUT_CLS} bg-[#181c26]/80`}
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s === "OA" ? "Online Assessment" : s}</option>
                ))}
              </select>
            </Field>
            <Field label="Date Applied">
              <input
                type="date"
                className={INPUT_CLS}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes (Optional)">
            <textarea
              className={`${INPUT_CLS} resize-none h-24`}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Interview feedback, referral info, follow-up notes..."
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-4 justify-end mt-10 pt-8 border-t border-[#232840]/50">
          <button
            onClick={onClose}
            className="
              px-8 py-4 bg-[#181c26]/80 border border-[#2d3352]/50 rounded-2xl
              text-[#a1a8c6] text-[15px] font-semibold backdrop-blur-sm
              hover:border-[#4f8ef7]/40 hover:text-[#e8eaf2] hover:bg-[#4f8ef7]/10
              hover:shadow-lg transition-all duration-200
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!company.trim() || !role.trim()}
            className="
              px-10 py-4 bg-gradient-to-r from-[#4f8ef7] to-[#3b7ef0] text-white rounded-2xl
              text-[15px] font-bold shadow-xl shadow-[#4f8ef7]/40
              hover:from-[#3b7ef0] hover:to-[#2563eb] hover:shadow-2xl hover:shadow-[#4f8ef7]/60
              hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              border border-[#4f8ef7]/30
            "
          >
            Add Application
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS = `
  w-full bg-[#181c26]/80 border border-[#2d3352]/50 rounded-2xl
  px-5 py-4 text-[15px] text-[#e8eaf2] outline-none backdrop-blur-sm font-medium
  placeholder:text-[#a1a8c6] placeholder:font-medium
  focus:border-[#4f8ef7]/60 focus:shadow-[0_0_0_4px_rgba(79,142,247,0.25)]
  hover:border-[#4f8ef7]/30 transition-all duration-300
`;

function Field({ label, children, error }: { 
  label: string; 
  children: React.ReactNode; 
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[13px] font-bold tracking-[0.5px] uppercase text-[#a1a8c6]">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[12px] text-[#f87171] font-medium mt-1">
          This field is required
        </span>
      )}
    </div>
  );
}