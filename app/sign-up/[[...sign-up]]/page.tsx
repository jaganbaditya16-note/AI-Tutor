"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, UserPlus, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

const PLATFORM =
  "AI GUIDED PROJECT PROGRESS TRACKING PLATFORM WITH PLANNING & MENTORSHIP ASSISTANCE";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanStudentNumber = studentNumber.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanStudentNumber || !cleanEmail || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            student_number: cleanStudentNumber,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError("The account could not be created. Please try again.");
        return;
      }

      if (data.session) {
        // Verify the server can see the same session/profile before navigating.
        // A hard navigation avoids a first-request race with freshly written auth cookies.
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

        if (!roleResponse.ok || roleData.role !== "student") {
          await supabase.auth.signOut();
          setError(
            roleData.error ||
              "Account created, but the server could not verify the student profile. Please sign in again."
          );
          return;
        }

        router.refresh();
        window.location.assign("/dashboard");
        return;
      }

      setMessage(
        "Account created. Check your email for confirmation, then sign in to continue."
      );
    } catch (err) {
      console.error("Student sign-up error:", err);
      setError(
        "Unable to create the account right now. Please check your connection and try again."
      );
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
            <Sparkles size={13} /> BUILT FOR AMBITIOUS STUDENTS
          </span>

          <h1>
            Your project has a <em>co-pilot.</em>
          </h1>

          <p>
            From raw idea to final presentation, one intelligent workspace keeps the
            whole journey on track.
          </p>

          <div className="auth-points">
            <span>✦ Idea → scope → stack</span>
            <span>✦ Auto-generated roadmap</span>
            <span>✦ Risk prediction + mentorship</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-icon">
          <UserPlus size={19} />
        </div>

        <h2>Create your workspace</h2>

        <p>Start building with an AI project team beside you.</p>

        <form onSubmit={submit} className="auth-form">
          <label className="label">Full name</label>

          <input
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
          />

          <label className="label">Student number / Roll number</label>

          <input
            className="input"
            required
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="Enter your student number"
            autoComplete="off"
          />

          <label className="label">Email</label>

          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label className="label">Password</label>

          <input
            className="input"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />

          {error && <div className="auth-error" role="alert" aria-live="polite">{error}</div>}

          {message && <div className="auth-success" role="status" aria-live="polite">{message}</div>}

          <button
            className="btn btn-primary auth-submit"
            disabled={loading}
            type="submit"
            aria-busy={loading}
          >
            {loading ? (
              "Creating…"
            ) : (
              <>
                Launch workspace <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/sign-in">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
