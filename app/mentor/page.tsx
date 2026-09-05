"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, ChevronRight, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import AppShell from "@/app/components/AppShell";

type Project = { id: string; title: string; progress: number };

type Message = { role: "user" | "assistant"; content: string };

export default function Mentor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.projects) ? data.projects : [];
        setProjects(list);
        if (list[0]) setProjectId(list[0].id);
      })
      .catch(() => setError("Unable to load projects."));
  }, []);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = message.trim();
    if (!text || !projectId || loading) return;

    setLoading(true);
    setError("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setMessage("");

    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Mentor unavailable.");
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: data.reply || "No response returned." },
        ]);
      }
    } catch {
      setError("Unable to reach the mentor. Check your server configuration.");
    } finally {
      setLoading(false);
    }
  }

  const selectedProject = projects.find((project) => project.id === projectId);

  return (
    <AppShell
      title="AI Mentor"
      subtitle="A context-aware senior project guide that knows your plan, progress and blockers."
    >
      <div className="mentor-grid">
        <section className="card mentor-chat fade-up">
          <div className="mentor-head">
            <div className="ai-spark"><Bot size={21} /></div>
            <div>
              <strong>ProjectPilot Mentor</strong>
              <span><i /> Context engine online</span>
            </div>
          </div>

          <div className="mentor-body">
            {messages.length === 0 ? (
              <div className="mentor-welcome">
                <div className="mentor-orb"><Sparkles size={26} /></div>
                <h2>What should we solve next?</h2>
                <p>Ask about architecture, implementation, debugging, testing, documentation, deadlines or your next best action.</p>
                <div className="prompt-chips">
                  <button onClick={() => setMessage("What should I work on next?")}>What should I work on next?</button>
                  <button onClick={() => setMessage("What is the biggest risk in my current plan?")}>Find my biggest risk</button>
                  <button onClick={() => setMessage("Review my milestones and suggest improvements.")}>Review my plan</button>
                </div>
              </div>
            ) : (
              <div className="mentor-messages">
                {messages.map((item, index) => (
                  <div key={`${item.role}-${index}`} className={`message ${item.role}`}>
                    <div className="reply-label">{item.role === "user" ? "You" : <><Bot size={14} /> Mentor</>}</div>
                    <div className="reply-text">{item.content}</div>
                  </div>
                ))}
                {loading && <div className="message assistant"><div className="reply-label"><Bot size={14} /> Mentor</div><div className="reply-text"><Loader2 size={16} className="spin" /> Thinking through your project…</div></div>}
              </div>
            )}
          </div>

          <form className="mentor-input" onSubmit={send}>
            <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={projectId ? "Ask your mentor anything…" : "Create a project first"} disabled={!projectId || loading} />
            <button className="btn btn-primary" disabled={!projectId || loading || !message.trim()}>{loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}</button>
          </form>
          {error && <div className="auth-error" style={{ marginTop: 10 }}>{error}</div>}
        </section>

        <aside className="grid" style={{ alignContent: "start" }}>
          <div className="card" style={{ padding: 20 }}>
            <span className="hero-kicker"><MessageSquare size={12} /> PROJECT CONTEXT</span>
            <h3 style={{ margin: "8px 0 15px" }}>Mentor is watching</h3>
            <label className="label">Choose project</label>
            <select className="select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setMessages([]); }}>
              {projects.length === 0 && <option value="">No projects yet</option>}
              {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
            {selectedProject && (
              <div style={{ marginTop: 17 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8190aa" }}>
                  <span>Progress</span><strong>{selectedProject.progress || 0}%</strong>
                </div>
                <div className="progress" style={{ marginTop: 7 }}>
                  <span style={{ width: `${selectedProject.progress || 0}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <span className="hero-kicker"><Sparkles size={12} /> QUICK ACTIONS</span>
            <div className="quick-links">
              <Link href="/planner">Generate a new plan <ChevronRight size={14} /></Link>
              <Link href="/projects">Review project workspace <ChevronRight size={14} /></Link>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
