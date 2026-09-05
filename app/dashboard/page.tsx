import { currentUser, UserButton } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Dashboard() {
  const user = await currentUser();
  const name = user?.firstName || "Student";
  return <main style={{minHeight:"100vh",padding:32,maxWidth:1200,margin:"auto"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:48}}><div><p style={{color:"#60a5fa",margin:0}}>AI TUTOR</p><h1 style={{margin:"8px 0"}}>Welcome, {name} 👋</h1><p style={{color:"#94a3b8"}}>Your project workspace is ready.</p></div><UserButton /></header>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18}}>
      {[['AI Mentor','Get guidance for your project.','/mentor'],['Projects','Create and manage projects.','/projects'],['Tasks','Plan and track your work.','/tasks']].map(([title,text,href])=><Link key={href} href={href} style={{padding:24,border:"1px solid #243244",borderRadius:16,background:"#0d1929"}}><h2>{title}</h2><p style={{color:"#94a3b8"}}>{text}</p><span style={{color:"#60a5fa"}}>Open →</span></Link>)}
    </div>
  </main>;
}
