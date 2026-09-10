"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState("");
  const [error, setError] = useState("");

  async function createInvitation(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setInvitationUrl("");

    try {
      const response = await fetch("/api/admin/faculty-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to create invitation.");
        return;
      }

      const url = `${window.location.origin}/faculty/invite/${result.token}`;

      setInvitationUrl(url);
      setEmail("");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>
      <h1>Admin Dashboard</h1>

      <p>
        Manage faculty access and platform administration.
      </p>

      <section
        style={{
          marginTop: 32,
          padding: 24,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <h2>Invite Faculty</h2>

        <p>
          Create a secure invitation for a faculty member.
          The invitation expires after 48 hours.
        </p>

        <form
          onSubmit={createInvitation}
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="faculty@example.com"
            style={{
              flex: 1,
              padding: 12,
            }}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Invitation"}
          </button>
        </form>

        {error && (
          <p style={{ color: "crimson", marginTop: 16 }}>
            {error}
          </p>
        )}

        {invitationUrl && (
          <div style={{ marginTop: 24 }}>
            <strong>Invitation created</strong>

            <p>
              Send this link to the faculty member:
            </p>

            <input
              readOnly
              value={invitationUrl}
              onFocus={(e) => e.currentTarget.select()}
              style={{
                width: "100%",
                padding: 12,
              }}
            />

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(invitationUrl)}
              style={{ marginTop: 12 }}
            >
              Copy Invitation Link
            </button>
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => router.refresh()}
        style={{ marginTop: 24 }}
      >
        Refresh Dashboard
      </button>
    </main>
  );
}