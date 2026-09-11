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

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, user_id, title, progress, status, start_date, deadline"
      )
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError) {
      console.error(projectError);
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
        .select("title, description, status, priority, due_date")
        .eq("project_id", projectId),

      supabase
        .from("milestones")
        .select("title, description, status, progress, target_date")
        .eq("project_id", projectId),
    ]);

    const taskList = tasks || [];
    const milestoneList = milestones || [];

    const completedTasks = taskList.filter((task) =>
      ["completed", "complete", "done"].includes(
        String(task.status || "").toLowerCase()
      )
    ).length;

    const completedMilestones = milestoneList.filter(
      (milestone) =>
        String(milestone.status || "").toLowerCase() === "completed" ||
        Number(milestone.progress || 0) >= 100
    ).length;

    const taskEvidence =
      taskList.length > 0
        ? Math.round((completedTasks / taskList.length) * 100)
        : 0;

    const milestoneEvidence =
      milestoneList.length > 0
        ? Math.round(
            (completedMilestones / milestoneList.length) * 100
          )
        : 0;

    let evidenceScore = 0;

    if (taskList.length > 0) {
      evidenceScore += taskEvidence * 0.55;
    }

    if (milestoneList.length > 0) {
      evidenceScore += milestoneEvidence * 0.45;
    }

    if (taskList.length === 0 && milestoneList.length === 0) {
      evidenceScore = project.progress;
    } else if (taskList.length === 0) {
      evidenceScore = milestoneEvidence;
    } else if (milestoneList.length === 0) {
      evidenceScore = taskEvidence;
    }

    evidenceScore = Math.round(
      Math.max(0, Math.min(100, evidenceScore))
    );

    const reportedProgress = Number(project.progress || 0);
    const difference = reportedProgress - evidenceScore;
    const absoluteDifference = Math.abs(difference);

    let consistency: "Strong" | "Moderate" | "Weak" = "Strong";

    if (absoluteDifference >= 30) {
      consistency = "Weak";
    } else if (absoluteDifference >= 15) {
      consistency = "Moderate";
    }

    const observations: string[] = [];

    if (difference >= 30) {
      observations.push(
        "Reported progress is substantially higher than the available task and milestone evidence."
      );
    } else if (difference >= 15) {
      observations.push(
        "Reported progress is somewhat ahead of the available completion evidence."
      );
    } else if (difference <= -30) {
      observations.push(
        "Available completion evidence is substantially ahead of the reported progress."
      );
    } else if (difference <= -15) {
      observations.push(
        "Available completion evidence appears somewhat ahead of the reported progress."
      );
    } else {
      observations.push(
        "Reported progress is reasonably consistent with available project evidence."
      );
    }

    if (taskList.length === 0) {
      observations.push(
        "No project tasks were found, so task completion cannot be used as supporting evidence."
      );
    }

    if (milestoneList.length === 0) {
      observations.push(
        "No milestones were found, so milestone completion cannot be used as supporting evidence."
      );
    }

    if (project.deadline && reportedProgress < 50) {
      const daysRemaining = Math.ceil(
        (new Date(project.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 14) {
        observations.push(
          "The deadline is close while reported progress remains below 50%."
        );
      }
    }

    const recommendations: string[] = [];

    if (consistency === "Weak") {
      recommendations.push(
        "Review the project progress and update it using completed tasks and milestones as evidence."
      );
      recommendations.push(
        "Break large claims of progress into smaller measurable deliverables."
      );
    } else if (consistency === "Moderate") {
      recommendations.push(
        "Review recently completed work and align the reported percentage with measurable deliverables."
      );
    } else {
      recommendations.push(
        "Continue recording completed tasks and milestones to maintain evidence-supported progress."
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        projectId: project.id,
        projectTitle: project.title,
        reportedProgress,
        evidenceSupportedProgress: evidenceScore,
        difference,
        consistency,
        evidence: {
          totalTasks: taskList.length,
          completedTasks,
          taskEvidence,
          totalMilestones: milestoneList.length,
          completedMilestones,
          milestoneEvidence,
        },
        observations,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Progress authenticity analyzer error:", error);

    return NextResponse.json(
      { error: "Unable to analyze progress authenticity." },
      { status: 500 }
    );
  }
}