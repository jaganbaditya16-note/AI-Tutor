"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const cleanEmail = email.trim();

    const { error } = await createClient().auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");

    router.push(next || "/dashboard");
    router.refresh();
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
            New here?{" "}
            <Link href="/sign-up">Create your account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}