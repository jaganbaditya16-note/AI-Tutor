"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Github, RefreshCw, Unplug } from "lucide-react";

export default function GitHubProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [projectId, setProjectId] = useState("");
  const [url, setUrl] = useState("");
  const [repo, setRepo] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [warning, setWarning] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    params.then(({ id }) => {
      if (!active) return;
      setProjectId(id);
      load(id);
    });
    return () => {
      active = false;
    };
  }, [params]);

  async function load(id: string) {
    setLoading(true);
    setMessage("");
    setWarning("");
    try {
      const response = await fetch(`/api/projects/${id}/github`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load GitHub connection.");
      setConnected(Boolean(data.connected));
      setRepo(data.repo ?? null);
      setWarning(data.warning ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load GitHub connection.");
    } finally {
      setLoading(false);
    }
  }

  async function connect() {
    if (!projectId || saving) return;
    setSaving(true);
    setMessage("");
    setWarning("");
    try {
      const response = await fetch(`/api/projects/${projectId}/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to connect repository.");
      setConnected(true);
      setRepo(data.repo);
      setUrl("");
      setMessage("GitHub repository connected successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect repository.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!projectId || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/github`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to disconnect repository.");
      setConnected(false);
      setRepo(null);
      setMessage("GitHub repository disconnected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to disconnect repository.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 20px" }}>
      <Link href={`/projects/${projectId}`} className="back-link">
        <ArrowLeft size={14} /> Back to project
      </Link>

      <section className="card fade-up" style={{ padding: 28, marginTop: 18 }}>
        <div className="section-row">
          <div>
            <span className="hero-kicker"><Github size={13} /> PROJECT REPOSITORY</span>
            <h1 style={{ margin: "8px 0 5px" }}>GitHub connection</h1>
            <p className="muted" style={{ margin: 0 }}>
              Connect a public repository to keep project work grounded in real repository activity.
            </p>
          </div>
          <button className="btn" onClick={() => projectId && load(projectId)} disabled={loading || saving}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {!connected ? (
          <div style={{ marginTop: 28 }}>
            <label className="label">Public GitHub repository URL</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ flex: "1 1 420px" }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                onKeyDown={(e) => e.key === "Enter" && connect()}
              />
              <button className="btn btn-primary" onClick={connect} disabled={!url.trim() || saving}>
                <Github size={15} /> {saving ? "Connecting…" : "Connect repository"}
              </button>
            </div>
            <p className="muted small" style={{ marginTop: 10 }}>
              URL-only mode intentionally supports public repositories without storing a GitHub password or token.
              Private-repository OAuth can be added later without changing the project data model.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 28 }}>
            <div className="card" style={{ padding: 20, background: "var(--surface-2, rgba(255,255,255,.03))" }}>
              <div className="section-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar"><Github size={18} /></div>
                  <div>
                    <strong>{repo?.owner}/{repo?.name}</strong>
                    <div className="muted small">Default branch: {repo?.defaultBranch || "unknown"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {repo?.url && <a className="btn" href={repo.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open</a>}
                  <button className="btn" onClick={disconnect} disabled={saving}><Unplug size={14} /> Disconnect</button>
                </div>
              </div>

              <p style={{ margin: "18px 0 0" }}>{repo?.description || "No repository description."}</p>

              <div className="grid stat-grid" style={{ marginTop: 18 }}>
                <div className="card stat"><small>Language</small><strong>{repo?.language || "Mixed"}</strong></div>
                <div className="card stat"><small>Stars</small><strong>{repo?.stars ?? 0}</strong></div>
                <div className="card stat"><small>Forks</small><strong>{repo?.forks ?? 0}</strong></div>
                <div className="card stat"><small>Open issues</small><strong>{repo?.openIssues ?? 0}</strong></div>
              </div>

              {repo?.pushedAt && <p className="muted small" style={{ marginBottom: 0 }}>Last pushed: {new Date(repo.pushedAt).toLocaleString()}</p>}
            </div>
          </div>
        )}

        {message && <div className="auth-error" style={{ marginTop: 16 }}>{message}</div>}
        {warning && <div className="card" style={{ marginTop: 16, padding: 14 }}>{warning}</div>}
      </section>

      <section className="card fade-up delay-1" style={{ padding: 24, marginTop: 18 }}>
        <span className="hero-kicker">HOW THIS IS USED</span>
        <h2 style={{ fontSize: 18, margin: "7px 0 10px" }}>Repository context without taking over the project</h2>
        <div className="milestone-row-list">
          <div className="milestone-row"><div className="milestone-dot" /><div><strong>Repository identity</strong><p>Links the project workspace to its GitHub repository and default branch.</p></div></div>
          <div className="milestone-row"><div className="milestone-dot" /><div><strong>Progress evidence</strong><p>Repository metadata can support future progress-authenticity checks instead of relying only on self-reported updates.</p></div></div>
          <div className="milestone-row"><div className="milestone-dot" /><div><strong>AI context</strong><p>Future AI agents can use repository activity as additional context for planning, dependencies and risk analysis.</p></div></div>
          <div className="milestone-row"><div className="milestone-dot" /><div><strong>Security boundary</strong><p>This version only reads public repository data and never asks students to paste a GitHub password or personal access token.</p></div></div>
        </div>
      </section>
    </main>
  );
}
