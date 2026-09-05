import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24}}>
      <section style={{maxWidth:900,width:"100%",textAlign:"center"}}>
        <p style={{color:"#60a5fa",fontWeight:700}}>AI PROJECT MENTOR</p>
        <h1 style={{fontSize:"clamp(42px,8vw,76px)",margin:"12px 0"}}>Build smarter with your AI Tutor.</h1>
        <p style={{fontSize:20,color:"#94a3b8",maxWidth:700,margin:"0 auto 32px"}}>Plan projects, generate tasks, track progress and get AI guidance from one workspace.</p>
        <SignedOut><div style={{display:"flex",gap:12,justifyContent:"center"}}><Link href="/sign-in" style={{padding:"13px 22px",borderRadius:10,background:"#2563eb"}}>Sign in</Link><Link href="/sign-up" style={{padding:"13px 22px",borderRadius:10,border:"1px solid #334155"}}>Create account</Link></div></SignedOut>
        <SignedIn><div style={{display:"flex",gap:16,justifyContent:"center",alignItems:"center"}}><Link href="/dashboard" style={{padding:"13px 22px",borderRadius:10,background:"#2563eb"}}>Open dashboard</Link><UserButton /></div></SignedIn>
      </section>
    </main>
  );
}
