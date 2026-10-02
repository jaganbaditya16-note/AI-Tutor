"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

const PLATFORM =
  "AI GUIDED PROJECT PROGRESS TRACKING PLATFORM WITH PLANNING & MENTORSHIP ASSISTANCE";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const supabase = createClient();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Confirm the server can see the same authenticated session and role.
      // This prevents a successful client login from landing on a protected
      // page before the SSR cookie/session has propagated.
      const roleResponse = await fetch("/api/auth/role", {
        cache: "no-store",
        credentials: "include",
      });

      let roleData: { role?: string; error?: string } = {};
      try {
        roleData = await roleResponse.json();
      } catch {
        roleData = {};
      }

      if (!roleResponse.ok) {
        await supabase.auth.signOut();
        setError(
          roleData.error ||
            "Login succeeded, but the server could not verify your account. Please try again."
        );
        return;
      }

      if (roleData.role !== "student") {
        await supabase.auth.signOut();
        setError(
          roleData.role === "admin"
            ? "This is an administrator account. Use Admin Sign In."
            : "This is a faculty account. Use Faculty Sign In."
        );
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/dashboard";

      // A hard navigation guarantees the freshly established auth cookies are
      // used by the Next.js proxy/server components on the first protected request.
      window.location.assign(safeNext);
    } catch (err) {
      console.error("Student sign-in error:", err);
      setError("Unable to complete sign in. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark">
            <Zap size={18} />
          </div>
          <strong>{PLATFORM}</strong>
        </div>

        <div>
          <span className="hero-kicker">
            <Sparkles size={13} /> AI PROJECT OPERATING SYSTEM
          </span>
          <h1>
            Turn project chaos into <em>momentum.</em>
          </h1>
          <p>
            Plan smarter. Build faster. Know what is at risk before your guide
            does.
          </p>
          <div className="auth-points">
            <span>✦ AI planning agents</span>
            <span>✦ Live progress intelligence</span>
            <span>✦ Mentor-grade guidance</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-icon">
          <LockKeyhole size={19} />
        </div>
        <h2>Welcome back</h2>
        <p>Pick up your project exactly where you left off.</p>

        <form onSubmit={submit} className="auth-form">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn btn-primary auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              "Signing in…"
            ) : (
              <>
                Enter workspace <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="auth-switch">
            New here? <Link href="/sign-up">Create your account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
