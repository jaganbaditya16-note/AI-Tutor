import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request:Request){
 try{
  const userId=await requireUser();const body=await request.json();const message=String(body.message||"").trim();const projectId=String(body.projectId||"");
  if(!message||!projectId)return NextResponse.json({error:"Project and message are required."},{status:400});
  const supabase=db();const {data:project}=await supabase.from("projects").select("*").eq("id",projectId).eq("user_id",userId).single();if(!project)return NextResponse.json({error:"Project not found or access denied."},{status:404});
  const [{data:tasks},{data:milestones}]=await Promise.all([supabase.from("tasks").select("title,status,priority,due_date").eq("project_id",projectId),supabase.from("milestones").select("title,status,progress,target_date").eq("project_id",projectId)]);
  const key=process.env.OPENROUTER_API_KEY;if(!key)return NextResponse.json({error:"AI service is not configured. Add OPENROUTER_API_KEY."},{status:503});
  const ai=new OpenAI({apiKey:key,baseURL:"https://openrouter.ai/api/v1",defaultHeaders:{"X-Title":"ProjectPilot AI Mentor"}});
  const out=await ai.chat.completions.create({model:process.env.OPENROUTER_MODEL||"openai/gpt-5-mini",max_tokens:1800,messages:[
   {role:"system",content:"You are ProjectPilot's senior academic project mentor. Reason over the supplied project, tasks and milestones. Be practical and direct. Identify the highest-leverage next action, blockers, risk, and a realistic sequence when relevant. If asked for code, provide safe implementation guidance. Never claim an action was completed unless the data says so. Keep answers structured with short headings and bullets."},
   {role:"user",content:`PROJECT\n${JSON.stringify(project)}\nTASKS\n${JSON.stringify(tasks||[])}\nMILESTONES\n${JSON.stringify(milestones||[])}\nSTUDENT MESSAGE\n${message}`}
  ]});
  return NextResponse.json({reply:out.choices[0]?.message?.content||"I couldn't produce a mentor response."});
 }catch(e){console.error(e);const msg=e instanceof Error?e.message:"Mentor request failed";return NextResponse.json({error:msg},{status:msg==="UNAUTHORIZED"?401:500})}
}
