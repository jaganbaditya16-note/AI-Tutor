import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const PRODUCT_NAME = "AI Guided Project Progress Tracking Platform with Planning & Mentorship Assistance";

export default function Home() {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24}}>
      <section style={{maxWidth:1000,width:"100%",textAlign:"center"}}>
        <p style={{color:"#60a5fa",fontWeight:700,letterSpacing:1}}>AI GUIDED PROJECT PROGRESS TRACKING PLATFORM</p>
        <h1 style={{fontSize:"clamp(38px,7vw,72px)",lineHeight:1.05,margin:"16px 0"}}>Planning &amp; Mentorship Assistance</h1>
        <p style={{fontSize:20,color:"#94a3b8",maxWidth:760,margin:"0 auto 14px"}}>{PRODUCT_NAME}</p>
        <p style={{color:"#64748b",maxWidth:700,margin:"0 auto 32px"}}>Plan academic projects, manage tasks and milestones, track real progress, identify risks and receive AI-powered mentorship.</p>
        <SignedOut><div style={{display:"flex",gap:12,justifyContent:"center"}}><Link href="/sign-in" style={{padding:"13px 22px",borderRadius:10,background:"#2563eb"}}>Sign in</Link><Link href="/sign-up" style={{padding:"13px 22px",borderRadius:10,border:"1px solid #334155"}}>Get started</Link></div></SignedOut>
        <SignedIn><div style={{display:"flex",gap:16,justifyContent:"center",alignItems:"center"}}><Link href="/dashboard" style={{padding:"13px 22px",borderRadius:10,background:"#2563eb"}}>Open platform</Link><UserButton /></div></SignedIn>
      </section>
    </main>
  );
}
