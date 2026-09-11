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
      console.error("Project lookup error:", projectError);

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
      .select(
        "title, status, progress, target_date"
      )
      .eq("project_id", projectId)
      .order("target_date", { ascending: true });

    const { data: tasks } = await supabase
      .from("tasks")
      .select(
        "title, status, priority, due_date"
      )
      .eq("project_id", projectId);

    const now = new Date();

    const startDate = project.start_date
      ? new Date(project.start_date)
      : now;

    const elapsedDays = Math.max(
      1,
      Math.ceil(
        (now.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const progress = Number(project.progress || 0);

    const dailyProgress = progress / elapsedDays;

    const remainingProgress = Math.max(0, 100 - progress);

    const estimatedRemainingDays =
      dailyProgress > 0
        ? Math.ceil(remainingProgress / dailyProgress)
        : null;

    let predictedCompletionDate: string | null = null;

    if (estimatedRemainingDays !== null) {
      const predicted = new Date(now);
      predicted.setDate(
        predicted.getDate() + estimatedRemainingDays
      );

      predictedCompletionDate = predicted
        .toISOString()
        .split("T")[0];
    }

    let daysUntilDeadline: number | null = null;

    if (project.deadline) {
      const deadline = new Date(project.deadline);

      daysUntilDeadline = Math.ceil(
        (deadline.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }

    let risk: "Low" | "Medium" | "High" = "Low";

    if (
      progress < 30 &&
      daysUntilDeadline !== null &&
      daysUntilDeadline < 30
    ) {
      risk = "High";
    } else if (
      progress < 60 &&
      daysUntilDeadline !== null &&
      daysUntilDeadline < 45
    ) {
      risk = "Medium";
    }

    if (
      predictedCompletionDate &&
      project.deadline &&
      predictedCompletionDate > project.deadline
    ) {
      risk = "High";
    }

    const completionProbability =
      risk === "Low"
        ? Math.min(95, Math.max(70, progress + 40))
        : risk === "Medium"
        ? Math.min(75, Math.max(45, progress + 20))
        : Math.min(55, Math.max(15, progress + 10));

    let recommendation =
      "Continue at the current pace and maintain regular progress.";

    if (risk === "Medium") {
      recommendation =
        "Increase weekly progress and prioritize the most important milestones.";
    }

    if (risk === "High") {
      recommendation =
        "Create a recovery plan, prioritize essential features, and review the deadline.";
    }

    return NextResponse.json({
      success: true,
      prediction: {
        projectId: project.id,
        projectTitle: project.title,
        currentProgress: progress,
        risk,
        completionProbability,
        predictedCompletionDate,
        deadline: project.deadline,
        daysUntilDeadline,
        estimatedRemainingDays,
        recommendation,
        milestones: milestones || [],
        tasks: tasks || [],
      },
    });
  } catch (error) {
    console.error("Outcome prediction error:", error);

    return NextResponse.json(
      { error: "Unable to generate project prediction." },
      { status: 500 }
    );
  }
}