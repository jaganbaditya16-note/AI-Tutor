import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request:Request){
 try{
  const userId=await requireUser(); const body=await request.json(); const title=String(body.title||"").trim(); const description=String(body.description||"").trim(); const goal=String(body.goal||"").trim(); const technology=String(body.technology||"").trim(); const deadline=body.deadline||null;
  if(!title||!description)return NextResponse.json({error:"Project title and idea are required."},{status:400});
  const key=process.env.OPENROUTER_API_KEY; if(!key)return NextResponse.json({error:"AI service is not configured. Add OPENROUTER_API_KEY to the environment."},{status:503});
  const ai=new OpenAI({apiKey:key,baseURL:"https://openrouter.ai/api/v1",defaultHeaders:{"HTTP-Referer":"http://localhost:3000","X-Title":"ProjectPilot"}});
  const result=await ai.chat.completions.create({model:process.env.OPENROUTER_MODEL||"openai/gpt-5-mini",max_tokens:4500,response_format:{type:"json_object"},messages:[
   {role:"system",content:`You are the orchestrator of an academic project management platform. Transform a student's project idea into an execution-ready blueprint. Return ONLY JSON with this exact shape: {"summary":"","project_type":"","technology":"","goal":"","objectives":[""],"risks":[{"risk":"","severity":"High|Medium|Low","mitigation":""}],"milestones":[{"title":"","description":"","target_days":7}],"tasks":[{"title":"","description":"","priority":"High|Medium|Low","milestone_index":0,"due_days":3}],"mentor_message":""}. Generate 5-8 milestones and 10-16 tasks. Make tasks concrete and sequential. target_days and due_days are relative from project start. If technology is blank, recommend a realistic college-friendly stack.`},
   {role:"user",content:JSON.stringify({title,description,goal,technology,deadline})}
  ]});
  const raw=result.choices[0]?.message?.content; if(!raw)throw new Error("AI returned no plan"); let plan:any; try{plan=JSON.parse(raw)}catch{throw new Error("AI returned invalid plan data")}
  const {data:project,error:projectError}=await db().from("projects").insert({user_id:userId,title,description,project_type:plan.project_type||"Academic project",technology:plan.technology||technology||null,goal:plan.goal||goal||null,status:"Planning",progress:0,deadline}).select().single(); if(projectError)throw projectError;
  const milestones=Array.isArray(plan.milestones)?plan.milestones.slice(0,8):[]; const milestoneRows=milestones.map((m:any)=>({project_id:project.id,title:String(m.title||"Milestone"),description:String(m.description||""),status:"Upcoming",progress:0,target_date:addDays(new Date(),Number(m.target_days)||7)}));
  const {data:createdMilestones,error:milestoneError}=milestoneRows.length?await db().from("milestones").insert(milestoneRows).select():{data:[],error:null}; if(milestoneError)throw milestoneError;
  const tasks=Array.isArray(plan.tasks)?plan.tasks.slice(0,16):[]; const taskRows=tasks.map((t:any)=>({project_id:project.id,title:String(t.title||"Task"),description:String(t.description||""),status:"Pending",priority:["High","Medium","Low"].includes(t.priority)?t.priority:"Medium",due_date:addDays(new Date(),Number(t.due_days)||7)}));
  const {data:createdTasks,error:taskError}=taskRows.length?await db().from("tasks").insert(taskRows).select():{data:[],error:null}; if(taskError)throw taskError;
  return NextResponse.json({success:true,project,milestones:createdMilestones||[],tasks:createdTasks||[],blueprint:{summary:plan.summary,objectives:plan.objectives||[],risks:plan.risks||[],mentor_message:plan.mentor_message||"Your project plan is ready."}});
 }catch(e){const msg=e instanceof Error?e.message:"Failed to generate project plan";return NextResponse.json({error:msg},{status:msg==="UNAUTHORIZED"?401:500})}
}
function addDays(date:Date,days:number){const d=new Date(date);d.setDate(d.getDate()+Math.max(1,Math.min(days,365)));return d.toISOString().slice(0,10)}
