"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [mode,     setMode]     = useState<Mode>("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");        // signup only
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "signup") {
      // ── SIGN UP ─────────────────────────────────────────────
      // Creates a row in auth.users → DB trigger creates public.users row
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },   // passed to raw_user_meta_data → used by trigger
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      // Supabase sends a confirmation email by default.
      // For development, you can disable this in Supabase Dashboard →
      // Authentication → Email → "Confirm email" toggle OFF.
      setSuccess("Account created! Check your email to confirm, then log in.");
      setMode("login");
      setLoading(false);
      return;
    }

    // ── LOG IN ───────────────────────────────────────────────
    // Supabase sets a session cookie automatically.
    // The middleware reads this cookie on every subsequent request.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      setError(signInErr.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard — middleware will verify the cookie
    router.push("/");
    router.refresh();   // forces Next.js to re-run server components with new session
  };

  const switchMode = () => {
    setMode(m => m === "login" ? "signup" : "login");
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <style>{`
        @keyframes auth-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -400% center; }
          100% { background-position: 400% center; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        .auth-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          color: #e8eaf2;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: #4f8ef7;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.22); font-weight: 400; }
        .auth-input:focus {
          border-color: rgba(79,142,247,0.6);
          background: rgba(79,142,247,0.06);
          box-shadow: 0 0 0 3px rgba(79,142,247,0.14);
        }
        .auth-input:hover:not(:focus) { border-color: rgba(255,255,255,0.18); }
      `}</style>

      {/* Full-screen background — same as your app */}
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0c10 0%, #0d0f14 50%, #13161e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(79,142,247,0.025) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        {/* Background glow orbs */}
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Card */}
        <div style={{
          width: "100%",
          maxWidth: 460,
          background: "linear-gradient(160deg, #13161f 0%, #0e1118 60%, #0b0e15 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,142,247,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
          animation: "auth-in 0.45s cubic-bezier(0.16,1,0.3,1) both",
          overflow: "hidden",
        }}>
          {/* Top shimmer line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, #4f8ef7 30%, #22d3ee 50%, #a78bfa 70%, transparent)",
            backgroundSize: "300% 100%",
            animation: "shimmer 3s linear infinite",
          }} />

          {/* Header */}
          <div style={{ padding: "36px 36px 28px", textAlign: "center" }}>
            {/* Logo */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
              background: "linear-gradient(135deg, #4f8ef7, #22d3ee, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 0 28px rgba(79,142,247,0.4)",
            }}>
              🚀
            </div>

            <h1 style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontSize: 26, fontWeight: 800,
              background: "linear-gradient(90deg, #e8eaf2, #a1a8c6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.3px",
            }}>
              Job Tracker
            </h1>

            <p style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.38)",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {mode === "login"
                ? "Sign in to your account"
                : "Create your free account"}
            </p>
          </div>

          {/* Mode toggle pills */}
          <div style={{
            margin: "0 36px 24px",
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: 4,
          }}>
            {(["login", "signup"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                style={{
                  flex: 1, padding: "9px 0",
                  borderRadius: 9, border: "none",
                  fontSize: 13, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  background: mode === m
                    ? "linear-gradient(135deg, #4f8ef7, #a78bfa)"
                    : "transparent",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.38)",
                  boxShadow: mode === m ? "0 4px 14px rgba(79,142,247,0.3)" : "none",
                  transform: mode === m ? "scale(1.02)" : "scale(1)",
                  transition: "all 200ms ease",
                }}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "0 36px 36px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Name — signup only */}
              {mode === "signup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <label style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Full name</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Rahul Dev"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus={mode === "login"}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) { setError("Enter your email first"); return; }
                        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
                        if (resetErr) setError(resetErr.message);
                        else setSuccess("Password reset email sent!");
                      }}
                      style={{
                        fontSize: 12, color: "#4f8ef7", background: "none",
                        border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 600, padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  className="auth-input"
                  type="password"
                  placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171", fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>⚠</span>
                  {error}
                </div>
              )}

              {/* Success message */}
              {success && (
                <div style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#34d399", fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>✓</span>
                  {success}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 0",
                  borderRadius: 14, border: "none",
                  background: loading
                    ? "rgba(79,142,247,0.4)"
                    : "linear-gradient(135deg, #4f8ef7 0%, #3b7ef0 100%)",
                  color: "#fff",
                  fontSize: 15, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 6px 24px rgba(79,142,247,0.4)",
                  transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 4,
                }}
                onMouseEnter={e => {
                  if (loading) return;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(79,142,247,0.5)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = loading ? "none" : "0 6px 24px rgba(79,142,247,0.4)";
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </>
                ) : (
                  mode === "login" ? "Sign in →" : "Create account →"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom note */}
        <p style={{
          position: "absolute", bottom: 20,
          fontSize: 12, color: "rgba(255,255,255,0.2)",
          fontFamily: "'DM Sans', sans-serif",
          textAlign: "center",
        }}>
          Job Tracker · Your data is private and secure
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}