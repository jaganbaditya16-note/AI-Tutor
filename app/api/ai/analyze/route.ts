import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiModel, generateJson, openRouterClient } from "@/lib/ai-json";

export async function POST(request: Request) {
  try {
    const userId = await requireUser();
    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: "Project is required." }, { status: 400 });
    const supabase = db();
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).eq("user_id", userId).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const [{ data: tasks }, { data: milestones }] = await Promise.all([
      supabase.from("tasks").select("title,status,priority,due_date").eq("project_id", projectId),
      supabase.from("milestones").select("title,status,progress,target_date").eq("project_id", projectId),
    ]);
    const insights: any = await generateJson({
      client: openRouterClient("ProjectPilot AI Analyzer"), model: aiModel(), maxTokens: 4200,
      system: `You are ProjectPilot's AI project intelligence team. Analyze only the supplied live project data. Return ONLY compact JSON: {"health":{"score":0,"label":"Healthy|Watch|At Risk","summary":""},"risks":[{"risk":"","severity":"High|Medium|Low","mitigation":""}],"technology":[{"area":"","recommendation":"","reason":""}],"plan":[{"phase":"","actions":[""]}],"documentation":{"next":"","checklist":[""]},"viva":[{"question":"","answer":""}],"next_actions":[""]}. Use at most 5 risks, 5 next_actions and 4 checklist items. Keep every string concise. Never invent completed work. Health score is execution readiness/risk, not project quality.`,
      user: JSON.stringify({ project, tasks: tasks || [], milestones: milestones || [] }),
    });
    if (!insights.health || !Array.isArray(insights.risks) || !Array.isArray(insights.next_actions)) throw new Error("AI returned incomplete insight data. Please refresh again.");
    const { error: insightError } = await supabase.from("project_insights").upsert({ project_id: projectId, insights, generated_at: new Date().toISOString() }, { onConflict: "project_id" });
    if (insightError) throw insightError;
    await supabase.from("project_events").insert({ project_id: projectId, user_id: userId, event_type: "ai_analysis", payload: { health: insights.health } });
    return NextResponse.json({ insights });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    console.error("AI insights error:", e);
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 500 });
  }
}
