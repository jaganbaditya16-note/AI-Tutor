import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const userId = await requireStudent();
    const body = await request.json();

    const projectId = String(body.projectId || "");
    const feature = String(body.feature || "").trim();

    if (!projectId || !feature) {
      return NextResponse.json(
        { error: "Project ID and feature are required." },
        { status: 400 }
      );
    }

    const supabase = db();

    const { data: project, error } = await supabase
      .from("projects")
      .select(
        "id, user_id, title, description, goal, technology, progress, deadline"
      )
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Unable to load project." },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const [{ data: tasks }, { data: milestones }] = await Promise.all([
      supabase
        .from("tasks")
        .select("title, description, status, priority")
        .eq("project_id", projectId),

      supabase
        .from("milestones")
        .select("title, description, status, progress")
        .eq("project_id", projectId),
    ]);

    const text = `${feature} ${project.description || ""} ${
      project.goal || ""
    } ${project.technology || ""}`.toLowerCase();

    let complexity: "Low" | "Medium" | "High" = "Low";
    let effort: "Small" | "Moderate" | "Large" = "Small";
    let risk: "Low" | "Medium" | "High" = "Low";

    const highComplexitySignals = [
      "machine learning",
      "deep learning",
      "computer vision",
      "blockchain",
      "real-time",
      "realtime",
      "distributed",
      "microservices",
      "payment gateway",
      "recommendation system",
      "facial recognition",
    ];

    const mediumComplexitySignals = [
      "api",
      "authentication",
      "notification",
      "analytics",
      "chat",
      "search",
      "database",
      "integration",
      "file upload",
      "dashboard",
    ];

    const highMatches = highComplexitySignals.filter((item) =>
      text.includes(item)
    ).length;

    const mediumMatches = mediumComplexitySignals.filter((item) =>
      text.includes(item)
    ).length;

    if (highMatches >= 1) {
      complexity = "High";
      effort = "Large";
      risk = "High";
    } else if (mediumMatches >= 1) {
      complexity = "Medium";
      effort = "Moderate";
      risk = "Medium";
    }

    const taskCount = (tasks || []).length;
    const milestoneCount = (milestones || []).length;

    if (taskCount >= 25 && project.progress < 70) {
      risk = risk === "Low" ? "Medium" : "High";
    }

    let daysRemaining: number | null = null;

    if (project.deadline) {
      daysRemaining = Math.ceil(
        (new Date(project.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 14 && project.progress < 80) {
        risk = "High";
      }
    }

    const projectFit =
      text.includes(feature.toLowerCase()) ||
      feature
        .toLowerCase()
        .split(/\s+/)
        .some(
          (word) =>
            word.length > 4 &&
            `${project.description || ""} ${project.goal || ""}`
              .toLowerCase()
              .includes(word)
        );

    const recommendations: string[] = [];

    if (risk === "High") {
      recommendations.push(
        "Do not add this feature without reviewing its deadline and implementation impact."
      );
      recommendations.push(
        "Consider moving it to a future enhancement unless it is essential to the core project."
      );
    } else if (risk === "Medium") {
      recommendations.push(
        "The feature is potentially feasible, but break it into smaller implementation tasks."
      );
      recommendations.push(
        "Confirm that it does not delay higher-priority project requirements."
      );
    } else {
      recommendations.push(
        "The feature appears reasonably feasible within the current project context."
      );
    }

    if (!projectFit) {
      recommendations.push(
        "The feature does not clearly match the current project goal, so verify its necessity before implementation."
      );
    }

    let recommendation:
      | "Recommended"
      | "Review First"
      | "Not Recommended" = "Recommended";

    if (risk === "High") {
      recommendation = "Not Recommended";
    } else if (risk === "Medium" || !projectFit) {
      recommendation = "Review First";
    }

    return NextResponse.json({
      success: true,
      analysis: {
        projectId: project.id,
        projectTitle: project.title,
        feature,
        complexity,
        effort,
        risk,
        projectFit,
        recommendation,
        daysRemaining,
        currentProgress: project.progress,
        currentWorkload: {
          tasks: taskCount,
          milestones: milestoneCount,
        },
        recommendations,
      },
    });
  } catch (error) {
    console.error("Feature feasibility checker error:", error);

    return NextResponse.json(
      { error: "Unable to check feature feasibility." },
      { status: 500 }
    );
  }
}