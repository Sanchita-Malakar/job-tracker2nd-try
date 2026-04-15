// app/analytics/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SubPageTopNav from "@/components/SubPageTopNav";

// ── Types ────────────────────────────────────────────────────
interface AnalyticsData {
  total:         number;
  appsPerWeek:   number;
  offerRate:     number;
  interviewRate: number;
  funnel:        Record<string, number>;
  weeklyData:    { week: string; count: number }[];
  avgResponseDays: number;
  topCompanies:  { company: string; total: number; responded: number }[];
}

interface ScoreResult {
  score:             number;
  matched_keywords:  string[];
  missing_critical:  string[];
  missing_nice:      string[];
  summary:           string;
}

// ── Helpers ──────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 75) return { stroke: "#34d399", text: "#34d399", bg: "rgba(52,211,153,0.1)" };
  if (score >= 50) return { stroke: "#fbbf24", text: "#fbbf24", bg: "rgba(251,191,36,0.1)" };
  return { stroke: "#f87171", text: "#f87171", bg: "rgba(248,113,113,0.1)" };
}

function scoreLabel(score: number) {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Partial match";
  return "Weak match";
}

// ── Animated counter ─────────────────────────────────────────
function useCounter(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p  = Math.min((now - t0) / duration, 1);
      const ep = 1 - Math.pow(1 - p, 3);
      setVal(+(target * ep).toFixed(1));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  label, value, unit, sub, subColor, delay,
}: {
  label: string; value: number; unit?: string;
  sub?: string; subColor?: string; delay: number;
}) {
  const displayed = useCounter(value);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 480ms ease, transform 480ms cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(79,142,247,0.4), transparent)",
      }} />
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: "#e8eaf2", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
          {Number.isInteger(value) ? Math.round(displayed) : displayed.toFixed(1)}
        </span>
        {unit && <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 12, marginTop: 8, color: subColor ?? "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Funnel bar ───────────────────────────────────────────────
const STAGE_COLORS: Record<string, string> = {
  Applied:   "#4f8ef7",
  OA:        "#22d3ee",
  Interview: "#fb923c",
  Offer:     "#34d399",
  Rejected:  "#f87171",
};

function FunnelBar({ stage, count, total, delay }: { stage: string; count: number; total: number; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(total > 0 ? (count / total) * 100 : 0), delay + 200);
    return () => clearTimeout(t);
  }, [count, total, delay]);

  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = STAGE_COLORS[stage] ?? "#a1a8c6";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 72, fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
        {stage === "OA" ? "Assessment" : stage}
      </div>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`, background: color,
          borderRadius: 4, boxShadow: `0 0 10px ${color}60`,
          transition: "width 700ms cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <div style={{ width: 52, textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf2" }}>{count}</span>
        {stage !== "Applied" && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>{pct}%</span>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data,        setData]        = useState<AnalyticsData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [jobDesc,     setJobDesc]     = useState("");
  const [resumeText,  setResumeText]  = useState("");
  const [scoring,     setScoring]     = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scoreError,  setScoreError]  = useState<string | null>(null);
  const [search,      setSearch]      = useState("");

  // ── Fetch analytics ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Resume scorer ────────────────────────────────────────
  const handleScore = useCallback(async () => {
    if (!jobDesc.trim() || !resumeText.trim()) return;
    setScoring(true);
    setScoreError(null);
    setScoreResult(null);
    try {
      const res = await fetch("/api/analytics/resume-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jobDesc, resumeText }),
      });
      if (!res.ok) throw new Error("API error");
      const result: ScoreResult = await res.json();
      setScoreResult(result);
    } catch {
      setScoreError("Failed to analyse. Please try again.");
    } finally {
      setScoring(false);
    }
  }, [jobDesc, resumeText]);

  // ── Weekly chart max ─────────────────────────────────────
  const chartMax = data ? Math.max(...data.weeklyData.map(w => w.count), 1) : 1;

  const STAGES = ["Applied", "OA", "Interview", "Offer", "Rejected"];
  const totalApps = data?.total ?? 0;

  const scoreCol = scoreResult ? scoreColor(scoreResult.score) : null;

  // ── Circular progress SVG ────────────────────────────────
  const CircleScore = ({ score }: { score: number }) => {
    const col = scoreColor(score);
    const r = 42;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={col.stroke} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${col.stroke}80)`, transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        .an-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .an-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(79,142,247,0.3), transparent);
        }
        .an-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          font-family: 'DM Sans', sans-serif; margin-bottom: 14px;
        }
        .an-title {
          font-size: 18px; font-weight: 700; color: #e8eaf2;
          font-family: 'Syne', sans-serif; margin: 0 0 4px;
        }
        .an-sub {
          font-size: 13px; color: rgba(255,255,255,0.4);
          font-family: 'DM Sans', sans-serif; margin: 0 0 20px;
        }
        .an-textarea {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 13px; color: #e8eaf2;
          font-family: 'DM Sans', sans-serif;
          resize: none; outline: none; line-height: 1.6;
          transition: border-color 250ms ease, box-shadow 250ms ease;
        }
        .an-textarea::placeholder { color: rgba(255,255,255,0.2); }
        .an-textarea:focus {
          border-color: rgba(79,142,247,0.5);
          box-shadow: 0 0 0 3px rgba(79,142,247,0.1);
        }
        .an-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 14px; border: none;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #4f8ef7, #a78bfa);
          color: #fff;
          box-shadow: 0 4px 20px rgba(79,142,247,0.35);
          transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
        }
        .an-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,142,247,0.5); }
        .an-btn:active { transform: scale(0.97); }
        .an-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .an-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }
        .pill-green { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.25); }
        .pill-red   { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); }
        .pill-amber { background: rgba(251,191,36,0.12);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .an-spin {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: an-spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes an-spin { to { transform: rotate(360deg); } }
        .an-fade-in { animation: an-fade 500ms ease both; }
        @keyframes an-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .bar-row:hover { background: rgba(255,255,255,0.03); border-radius: 10px; }
        @keyframes bar-grow { from { width: 0; } }
      `}</style>

      <SubPageTopNav title="Analytics" searchQuery={search} onSearchChange={setSearch} />

      {/* ── SCROLL FIX: this wrapper enables vertical scrolling ── */}
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 900, color: "#e8eaf2", margin: "0 0 6px", background: "linear-gradient(90deg, #e8eaf2, rgba(255,255,255,0.55))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Analytics
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Track your job search performance and optimise your resume
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(79,142,247,0.2)", borderTopColor: "#4f8ef7", animation: "an-spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>Loading your data…</span>
            </div>
          ) : !data || data.total === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#e8eaf2", margin: "0 0 8px", fontFamily: "'Syne', sans-serif" }}>No data yet</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>Add applications on the dashboard to see your analytics.</p>
            </div>
          ) : (
            <>
              {/* ── KPI Strip ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14, marginBottom: 24 }}>
                <KpiCard label="Applications" value={data.total} sub={`${data.appsPerWeek} per week avg`} delay={0} />
                <KpiCard label="Interview rate" value={data.interviewRate} unit="%" sub="applied → interview" subColor="rgba(251,146,60,0.8)" delay={80} />
                <KpiCard label="Offer rate" value={data.offerRate} unit="%" sub={`${data.funnel.Offer ?? 0} offer${(data.funnel.Offer ?? 0) !== 1 ? "s" : ""} received`} subColor="rgba(52,211,153,0.8)" delay={160} />
                <KpiCard label="Avg. response time" value={data.avgResponseDays} unit=" days" sub="across responded apps" delay={240} />
              </div>

              {/* ── Funnel + Chart row ── */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.5fr)", gap: 16, marginBottom: 24 }}>

                {/* Funnel */}
                <div className="an-card">
                  <div className="an-label">Stage conversion</div>
                  <p className="an-title" style={{ marginBottom: 4 }}>Pipeline funnel</p>
                  <p className="an-sub">drop-off at each stage</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {STAGES.map((stage, i) => (
                      <FunnelBar
                        key={stage}
                        stage={stage}
                        count={data.funnel[stage] ?? 0}
                        total={totalApps}
                        delay={i * 80}
                      />
                    ))}
                  </div>
                </div>

                {/* Weekly chart */}
                <div className="an-card">
                  <div className="an-label">Activity over time</div>
                  <p className="an-title" style={{ marginBottom: 4 }}>Applications per week</p>
                  <p className="an-sub">your application momentum</p>
                  {data.weeklyData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Not enough data yet</div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, paddingTop: 8, position: "relative" }}>
                      {/* Y-axis gridlines */}
                      {[0, 0.5, 1].map(p => (
                        <div key={p} style={{ position: "absolute", left: 0, right: 0, bottom: p * 132, borderTop: p === 0 ? "1px solid rgba(255,255,255,0.1)" : "1px dashed rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                      ))}
                      {data.weeklyData.slice(-10).map((w, i) => {
                        const h = Math.max(4, (w.count / chartMax) * 132);
                        const isLatest = i === data.weeklyData.slice(-10).length - 1;
                        const label = new Date(w.week + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
                        return (
                          <div key={w.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isLatest ? "#4f8ef7" : "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                              {w.count}
                            </div>
                            <div style={{
                              width: "100%", height: h,
                              background: isLatest
                                ? "linear-gradient(180deg, #a78bfa, #4f8ef7)"
                                : "rgba(79,142,247,0.4)",
                              borderRadius: "4px 4px 0 0",
                              boxShadow: isLatest ? "0 0 12px rgba(167,139,250,0.4)" : "none",
                              animation: "bar-grow 600ms cubic-bezier(0.34,1.2,0.64,1) both",
                              animationDelay: `${i * 60}ms`,
                            }} />
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Company response rate ── */}
              {data.topCompanies && data.topCompanies.length > 0 && (
                <div className="an-card" style={{ marginBottom: 24 }}>
                  <div className="an-label">Company breakdown</div>
                  <p className="an-title" style={{ marginBottom: 4 }}>Response rate by company</p>
                  <p className="an-sub">how many responded out of total applied</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.topCompanies.slice(0, 8).map((c, i) => {
                      const rate = c.total > 0 ? c.responded / c.total : 0;
                      return (
                        <div key={c.company} className="bar-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 8px", transition: "background 180ms ease", animation: `an-fade 400ms ease ${i * 50}ms both` }}>
                          <div style={{ width: 100, fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>
                            {c.company}
                          </div>
                          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${rate * 100}%`, background: "#4f8ef7", borderRadius: 3, transition: "width 700ms ease", boxShadow: "0 0 8px rgba(79,142,247,0.5)" }} />
                          </div>
                          <div style={{ width: 48, textAlign: "right", flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf2" }}>{c.responded}/{c.total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Resume Compatibility Scorer ─────────────────────────────────────
               This section is ALWAYS shown, even when there's no analytics data,
               because it works independently (user pastes text manually).
          ──────────────────────────────────────────────────────────────────── */}
          <div className="an-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div className="an-label">AI-powered</div>
                <p className="an-title" style={{ marginBottom: 4 }}>Resume compatibility scorer</p>
                <p className="an-sub" style={{ marginBottom: 0 }}>
                  Paste a job description and your resume — get a match score and missing keywords instantly
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.25)", flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f8ef7", boxShadow: "0 0 6px #4f8ef7", animation: "an-spin 3s linear infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4f8ef7", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em" }}>CLAUDE AI</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                  Job description
                </div>
                <textarea
                  className="an-textarea"
                  rows={7}
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="Paste the full job description here — requirements, responsibilities, tech stack…"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                  Your resume / notes
                </div>
                <textarea
                  className="an-textarea"
                  rows={7}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your resume text, skills section, or interview notes for this application…"
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                className="an-btn"
                onClick={handleScore}
                disabled={scoring || !jobDesc.trim() || !resumeText.trim()}
              >
                {scoring ? (
                  <><div className="an-spin" /> Analysing…</>
                ) : (
                  <>✦ Analyse compatibility</>
                )}
              </button>
              {(jobDesc || resumeText) && (
                <button
                  onClick={() => { setJobDesc(""); setResumeText(""); setScoreResult(null); setScoreError(null); }}
                  style={{ background: "none", border: "none", fontSize: 13, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "4px 8px" }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error state */}
            {scoreError && (
              <div className="an-fade-in" style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                ⚠ {scoreError}
              </div>
            )}

            {/* Score result */}
            {scoreResult && scoreCol && (
              <div className="an-fade-in" style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "start" }}>

                  {/* Circle score */}
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto" }}>
                      <CircleScore score={scoreResult.score} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: scoreCol.text, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
                          {scoreResult.score}
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>/ 100</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: scoreCol.text, marginTop: 8, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {scoreLabel(scoreResult.score)}
                    </div>
                  </div>

                  {/* Keywords + summary */}
                  <div>
                    {scoreResult.missing_critical.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                          Critical missing keywords
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {scoreResult.missing_critical.map(k => (
                            <span key={k} className="an-pill pill-red">✕ {k}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scoreResult.missing_nice.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                          Nice-to-have missing
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {scoreResult.missing_nice.map(k => (
                            <span key={k} className="an-pill pill-amber">~ {k}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scoreResult.matched_keywords.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                          Matched keywords ({scoreResult.matched_keywords.length})
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {scoreResult.matched_keywords.map(k => (
                            <span key={k} className="an-pill pill-green">✓ {k}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI summary */}
                    <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.15)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4f8ef7", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                        AI recommendation
                      </div>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
                        {scoreResult.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom padding */}
          <div style={{ height: 40 }} />
        </div>
      </div>

      <style>{`@keyframes an-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}