import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const userId = await requireUser();
    const body = await request.json();

    const projectId = String(body.projectId || "");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    const supabase = db();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, user_id, title, description, project_type, technology, goal, status, progress, start_date, deadline"
      )
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError) {
      console.error("Project DNA lookup error:", projectError);

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

    const { data: milestones } = await supabase
      .from("milestones")
      .select("title, status, progress, target_date")
      .eq("project_id", projectId);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, status, priority, due_date")
      .eq("project_id", projectId);

    const milestoneCount = milestones?.length || 0;
    const taskCount = tasks?.length || 0;

    const completedMilestones =
      milestones?.filter(
        (milestone) =>
          milestone.status?.toLowerCase() === "completed" ||
          Number(milestone.progress || 0) >= 100
      ).length || 0;

    const completedTasks =
      tasks?.filter(
        (task) =>
          task.status?.toLowerCase() === "completed"
      ).length || 0;

    const technologyText = (
      project.technology || ""
    ).toLowerCase();

    const descriptionText = (
      `${project.description || ""} ${project.goal || ""}`
    ).toLowerCase();

    let complexity: "Low" | "Medium" | "High" = "Medium";

    const complexitySignals = [
      "ai",
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "computer vision",
      "blockchain",
      "iot",
      "real-time",
      "realtime",
      "distributed",
      "microservices",
      "cloud",
      "automation",
    ];

    const complexityScore =
      complexitySignals.filter(
        (signal) =>
          technologyText.includes(signal) ||
          descriptionText.includes(signal)
      ).length;

    if (
      complexityScore >= 3 ||
      milestoneCount >= 8 ||
      taskCount >= 25
    ) {
      complexity = "High";
    } else if (
      complexityScore === 0 &&
      milestoneCount <= 3 &&
      taskCount <= 10
    ) {
      complexity = "Low";
    }

    let deadlinePressure: "Low" | "Medium" | "High" = "Low";

    if (project.deadline) {
      const now = new Date();
      const deadline = new Date(project.deadline);

      const daysRemaining = Math.ceil(
        (deadline.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 14 && project.progress < 80) {
        deadlinePressure = "High";
      } else if (daysRemaining <= 30 && project.progress < 70) {
        deadlinePressure = "Medium";
      }
    }

    let stage =
      "Planning";

    if (project.progress >= 90) {
      stage = "Finalization";
    } else if (project.progress >= 70) {
      stage = "Testing & Refinement";
    } else if (project.progress >= 40) {
      stage = "Implementation";
    } else if (project.progress > 10) {
      stage = "Early Development";
    }

    const strengths: string[] = [];

    if (project.progress >= 70) {
      strengths.push("Strong overall progress");
    }

    if (completedMilestones > 0) {
      strengths.push("Milestone execution");
    }

    if (completedTasks > 0) {
      strengths.push("Task completion activity");
    }

    if (project.technology) {
      strengths.push("Defined technology stack");
    }

    if (strengths.length === 0) {
      strengths.push("Project foundation established");
    }

    const focusAreas: string[] = [];

    if (project.progress < 40) {
      focusAreas.push("Increase implementation progress");
    }

    if (milestoneCount === 0) {
      focusAreas.push("Define project milestones");
    }

    if (taskCount === 0) {
      focusAreas.push("Break the project into actionable tasks");
    }

    if (deadlinePressure === "High") {
      focusAreas.push("Prioritize deadline-critical work");
    }

    if (focusAreas.length === 0) {
      focusAreas.push("Maintain consistent progress and validate completed work");
    }

    const dna = {
      identity: {
        title: project.title,
        type: project.project_type || "Not specified",
        technology: project.technology || "Not specified",
      },
      complexity,
      developmentStage: stage,
      deadlinePressure,
      progress: Number(project.progress || 0),
      structure: {
        milestones: milestoneCount,
        completedMilestones,
        tasks: taskCount,
        completedTasks,
      },
      strengths,
      focusAreas,
    };

    return NextResponse.json({
      success: true,
      dna,
    });
  } catch (error) {
    console.error("Project DNA error:", error);

    return NextResponse.json(
      { error: "Unable to generate Project DNA." },
      { status: 500 }
    );
  }
}