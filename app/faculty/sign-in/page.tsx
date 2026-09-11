"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function FacultySignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const roleResponse = await fetch("/api/auth/role", { cache: "no-store" });
    const roleData = await roleResponse.json();

    if (!roleResponse.ok || roleData.role !== "faculty") {
      await supabase.auth.signOut();
      setError(
        roleData.role
          ? "This account is not a faculty account. Use the correct sign-in page."
          : roleData.error || "Unable to verify your account role."
      );
      setLoading(false);
      return;
    }

    router.push("/faculty");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: "24px" }}>
      <h1>Faculty Sign In</h1>
      <p>Sign in to your faculty workspace.</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>

        {error && (
          <p style={{ color: "crimson" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}