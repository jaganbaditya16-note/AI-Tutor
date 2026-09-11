import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const userId = await requireStudent();
    const body = await request.json();
    const projectId = String(body.projectId || "");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
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

    const taskList = tasks || [];
    const milestoneList = milestones || [];

    const originalText =
      `${project.title} ${project.description || ""} ${
        project.goal || ""
      } ${project.technology || ""}`.toLowerCase();

    const currentText = [
      ...taskList.map(
        (task) => `${task.title} ${task.description || ""}`
      ),
      ...milestoneList.map(
        (milestone) =>
          `${milestone.title} ${milestone.description || ""}`
      ),
    ]
      .join(" ")
      .toLowerCase();

    const scopeSignals = [
      "payment",
      "chat",
      "messaging",
      "notification",
      "analytics",
      "dashboard",
      "admin",
      "authentication",
      "login",
      "mobile app",
      "android",
      "ios",
      "ai",
      "machine learning",
      "recommendation",
      "search",
      "report",
      "export",
      "integration",
      "api",
      "blockchain",
      "iot",
      "real-time",
      "realtime",
    ];

    const detectedFeatures = scopeSignals.filter((feature) =>
      currentText.includes(feature)
    );

    const originalFeatures = scopeSignals.filter((feature) =>
      originalText.includes(feature)
    );

    const addedFeatures = detectedFeatures.filter(
      (feature) => !originalFeatures.includes(feature)
    );

    const originalWords = new Set(
      originalText
        .split(/\s+/)
        .map((word) => word.replace(/[^a-z0-9-]/g, ""))
        .filter((word) => word.length > 4)
    );

    const currentWords = new Set(
      currentText
        .split(/\s+/)
        .map((word) => word.replace(/[^a-z0-9-]/g, ""))
        .filter((word) => word.length > 4)
    );

    let newConceptCount = 0;

    currentWords.forEach((word) => {
      if (!originalWords.has(word)) {
        newConceptCount++;
      }
    });

    const taskCount = taskList.length;
    const milestoneCount = milestoneList.length;

    let driftScore = 0;

    driftScore += Math.min(addedFeatures.length * 15, 45);
    driftScore += Math.min(Math.floor(newConceptCount / 10) * 5, 25);

    if (taskCount >= 20) {
      driftScore += 10;
    }

    if (taskCount >= 30) {
      driftScore += 10;
    }

    if (project.progress < 50 && taskCount >= 20) {
      driftScore += 10;
    }

    driftScore = Math.min(driftScore, 100);

    let level: "Low" | "Medium" | "High" = "Low";

    if (driftScore >= 60) {
      level = "High";
    } else if (driftScore >= 30) {
      level = "Medium";
    }

    const recommendations: string[] = [];

    if (level === "High") {
      recommendations.push(
        "Freeze optional features and focus on the original project goal."
      );
      recommendations.push(
        "Review newly added features with your mentor before continuing."
      );
    } else if (level === "Medium") {
      recommendations.push(
        "Review whether newly added features are necessary for the core objective."
      );
      recommendations.push(
        "Move optional features to a future enhancement list if the deadline is tight."
      );
    } else {
      recommendations.push(
        "Project scope currently appears reasonably aligned with the original goal."
      );
    }

    if (project.deadline && project.progress < 50) {
      const deadline = new Date(project.deadline);
      const daysRemaining = Math.ceil(
        (deadline.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 30) {
        recommendations.push(
          "Because the deadline is approaching, avoid adding non-essential features."
        );
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        projectId: project.id,
        projectTitle: project.title,
        driftScore,
        level,
        originalFeatures,
        detectedFeatures,
        addedFeatures,
        taskCount,
        milestoneCount,
        recommendation: recommendations,
      },
    });
  } catch (error) {
    console.error("Scope drift detector error:", error);

    return NextResponse.json(
      { error: "Unable to analyze project scope drift." },
      { status: 500 }
    );
  }
}