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
    const data: any = await generateJson({
      client: openRouterClient("ProjectPilot Documentation Agent"), model: aiModel(), maxTokens: 2600,
      system: `You are a technical documentation architect for a college project. Return ONLY compact JSON: {"sections":[{"title":"","points":[""]}],"uml":[""],"testing":[""],"demo_flow":[""]}. Create 6-8 useful sections. Keep points short and grounded only in the project.`,
      user: JSON.stringify(project),
    });
    if (!Array.isArray(data.sections)) throw new Error("AI returned incomplete documentation data. Please try again.");
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Documentation generation failed";
    console.error("AI documentation error:", e);
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHORIZED" ? 401 : 500 });
  }
}
