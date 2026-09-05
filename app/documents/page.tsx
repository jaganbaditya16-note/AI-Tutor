"use client";
import { useEffect, useState } from "react";
import { BookOpen, FileText, Loader2, Sparkles } from "lucide-react";
import AppShell from "@/app/components/AppShell";

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((x) => typeof x === "string" ? [x] : x && typeof x === "object" ? Object.values(x as Record<string, unknown>).map(String) : [String(x)]);
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
  return value == null ? [] : [String(value)];
}

export default function Documents() {
  const [projects, setProjects] = useState<any[]>([]), [id, setId] = useState(""), [data, setData] = useState<any>(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  useEffect(() => { fetch("/api/projects").then(r => r.json()).then(x => { const list = x.projects || []; setProjects(list); if (list[0]) setId(list[0].id); }).catch(() => setError("Could not load projects.")); }, []);
  async function generate() {
    if (!id) return; setLoading(true); setError("");
    try { const r = await fetch("/api/ai/document", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id }) }); const x = await r.json(); if (!r.ok) throw new Error(x.error || "Documentation generation failed."); setData(x); }
    catch (e) { setError(e instanceof Error ? e.message : "Documentation generation failed."); }
    finally { setLoading(false); }
  }
  return <AppShell title="Documentation" subtitle="Turn your project context into a clean report, UML and testing blueprint.">
    <div className="docs-toolbar card"><div><span className="hero-kicker"><FileText size={13}/> DOCUMENTATION AGENT</span><h2>Never start the report from a blank page.</h2></div><div style={{display:"flex",gap:8}}><select className="select" value={id} onChange={e=>setId(e.target.value)}>{projects.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select><button className="btn btn-primary" onClick={generate} disabled={!id||loading}>{loading?<Loader2 size={14} className="spin"/>:<Sparkles size={14}/>} {loading?"Writing…":"Generate outline"}</button></div></div>
    {error&&<div className="auth-error">{error}</div>}
    {data?.sections ? <div className="docs-grid">{Array.isArray(data.sections) && data.sections.map((section:any,i:number)=><section className="card doc-card" key={i}><span>{String(i+1).padStart(2,"0")}</span><h3>{section?.title || `Section ${i+1}`}</h3><ul>{asList(section?.points).map((x,j)=><li key={j}>{x}</li>)}</ul></section>)}<section className="card doc-card"><span>UML</span><h3>Diagrams to create</h3><ul>{asList(data.uml).map((x,i)=><li key={i}>{x}</li>)}</ul></section><section className="card doc-card"><span>TEST</span><h3>Testing plan</h3><ul>{asList(data.testing).map((x,i)=><li key={i}>{x}</li>)}</ul></section><section className="card doc-card"><span>DEMO</span><h3>Demo flow</h3><ul>{asList(data.demo_flow).map((x,i)=><li key={i}>{x}</li>)}</ul></section></div> : <div className="card empty-state"><div className="empty-icon"><BookOpen size={20}/></div><h3>Your report blueprint is ready to generate.</h3><p>AI will organize problem, requirements, architecture, implementation, testing and demo evidence around your actual project.</p><button className="btn btn-primary" onClick={generate} disabled={!id||loading}>{loading?"Writing outline…":"Generate documentation outline"}</button></div>}
  </AppShell>;
}
