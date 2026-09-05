"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Projects(){
 const [projects,setProjects]=useState<any[]>([]); const [title,setTitle]=useState(""); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 async function load(){setLoading(true);const r=await fetch('/api/projects');const j=await r.json();if(!r.ok)setError(j.error||'Failed to load');else setProjects(j.projects||[]);setLoading(false)}
 useEffect(()=>{load()},[]);
 async function create(){if(!title.trim())return;const r=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title.trim()})});const j=await r.json();if(!r.ok){setError(j.error||'Failed');return}setTitle('');setProjects(p=>[j.project,...p])}
 return <main style={{maxWidth:1100,margin:'auto',padding:32}}><Link href="/dashboard">← Dashboard</Link><h1>Projects</h1><div style={{display:'flex',gap:10,margin:'24px 0'}}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="New project title" style={{flex:1,padding:14,borderRadius:10,border:'1px solid #334155',background:'#0d1929',color:'white'}}/><button onClick={create} style={{padding:'0 20px',border:0,borderRadius:10,background:'#2563eb',color:'white'}}>Create</button></div>{error&&<p style={{color:'#f87171'}}>{error}</p>}{loading?<p>Loading...</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>{projects.map(p=><Link href={`/projects/${p.id}`} key={p.id} style={{padding:20,border:'1px solid #243244',borderRadius:14}}><h2>{p.title}</h2><p style={{color:'#94a3b8'}}>{p.description||'No description yet.'}</p><b>{p.progress}% complete</b></Link>)}</div>}</main>
}
