"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FacultyInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/faculty/accept-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: params.token,
          fullName,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to create faculty account.");
        return;
      }

      router.push("/faculty/sign-in?created=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 500, margin: "80px auto", padding: "24px" }}>
      <h1>Faculty Account</h1>

      <p>
        You have been invited to join the platform as a faculty member.
      </p>

      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        <label>
          Full name
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Password
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Confirm password
          <input
            required
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10 }}
          />
        </label>

        {error && (
          <p style={{ color: "crimson" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Faculty Account"}
        </button>
      </form>
    </main>
  );
}