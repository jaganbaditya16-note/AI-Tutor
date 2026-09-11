"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function AdminSignInPage() {
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

    router.push("/admin");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: "24px" }}>
      <h1>Admin Sign In</h1>

      <p>Sign in to the administration workspace.</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        <label>
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 10,
            }}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 10,
            }}
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

      <p style={{ marginTop: 20 }}><Link href="/instructions">Need help? Open the usage guide.</Link></p>
    </main>
  );
}