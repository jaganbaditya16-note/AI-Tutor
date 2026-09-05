import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiModel, generateJson, openRouterClient } from "@/lib/ai-json";

export async function POST(request: Request) {
  let createdProjectId = "";
  try {
    const userId = await requireUser();
    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const goal = String(body.goal || "").trim();
    const technology = String(body.technology || "").trim();
    const deadline = body.deadline || null;
    if (!title || !description) return NextResponse.json({ error: "Project title and idea are required." }, { status: 400 });

    const plan: any = await generateJson({
      client: openRouterClient("ProjectPilot AI Planner"), model: aiModel(), maxTokens: 6500,
      system: `You are ProjectPilot's academic project orchestrator. Return ONLY compact JSON with this exact shape: {"summary":"","project_type":"","technology":"","goal":"","objectives":[""],"risks":[{"risk":"","severity":"High|Medium|Low","mitigation":""}],"milestones":[{"title":"","description":"","target_days":7}],"tasks":[{"title":"","description":"","priority":"High|Medium|Low","milestone_index":0,"due_days":3}],"mentor_message":""}. Generate 5-8 milestones and 10-16 concrete tasks. Keep every description short. Relative target_days/due_days start from today. If technology is blank, choose a practical college-friendly stack. Never claim work is completed.`,
      user: JSON.stringify({ title, description, goal, technology, deadline }),
    });
    if (!Array.isArray(plan.milestones) || !Array.isArray(plan.tasks)) throw new Error("AI returned an incomplete project plan. Please try again.");

    const supabase = db();
    const { data: project, error: projectError } = await supabase.from("projects").insert({
      user_id: userId, title, description, project_type: String(plan.project_type || "Academic project"),
      technology: String(plan.technology || technology || ""), goal: String(plan.goal || goal || ""), status: "Planning", progress: 0, deadline,
    }).select().single();
    if (projectError) throw projectError;
    createdProjectId = project.id;

    const milestoneRows = plan.milestones.slice(0, 8).map((m: any) => ({ project_id: project.id, title: String(m.title || "Milestone"), description: String(m.description || ""), status: "Upcoming", progress: 0, target_date: addDays(new Date(), Number(m.target_days) || 7) }));
    const { data: createdMilestones, error: milestoneError } = await supabase.from("milestones").insert(milestoneRows).select();
    if (milestoneError) throw milestoneError;

    const taskRows = plan.tasks.slice(0, 16).map((t: any) => ({ project_id: project.id, title: String(t.title || "Task"), description: String(t.description || ""), status: "Pending", priority: ["High", "Medium", "Low"].includes(t.priority) ? t.priority : "Medium", due_date: addDays(new Date(), Number(t.due_days) || 7) }));
    const { data: createdTasks, error: taskError } = await supabase.from("tasks").insert(taskRows).select();
    if (taskError) throw taskError;

    await supabase.from("project_events").insert({ project_id: project.id, user_id: userId, event_type: "ai_plan_created", payload: { milestone_count: createdMilestones?.length || 0, task_count: createdTasks?.length || 0 } });
    return NextResponse.json({ success: true, project, milestones: createdMilestones || [], tasks: createdTasks || [], blueprint: { summary: String(plan.summary || ""), objectives: Array.isArray(plan.objectives) ? plan.objectives : [], risks: Array.isArray(plan.risks) ? plan.risks : [], mentor_message: String(plan.mentor_message || "Your project plan is ready.") } });
  } catch (e) {
    if (createdProjectId) { try { await db().from("projects").delete().eq("id", createdProjectId); } catch {} }
    const msg = e instanceof Error ? e.message : "Failed to generate project plan";
    console.error("AI planner error:", e);
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 500 });
  }
}

function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + Math.max(1, Math.min(Number.isFinite(days) ? days : 7, 365))); return d.toISOString().slice(0, 10); }
