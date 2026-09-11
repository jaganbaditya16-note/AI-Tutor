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

    const { data: project, error } = await supabase
      .from("projects")
      .select(
        "id, user_id, title, description, goal, technology, progress, deadline, status"
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

    const overdueTasks = taskList.filter((task) => {
      if (!task.due_date) return false;

      const status = String(task.status || "").toLowerCase();

      return (
        new Date(task.due_date).getTime() < Date.now() &&
        !["completed", "complete", "done"].includes(status)
      );
    }).length;

    const completedMilestones = milestoneList.filter(
      (milestone) =>
        String(milestone.status || "").toLowerCase() === "completed" ||
        Number(milestone.progress || 0) >= 100
    ).length;

    const evidenceProgress =
      taskList.length > 0
        ? Math.round((completedTasks / taskList.length) * 100)
        : project.progress;

    // Agent 1: Optimist
    const optimist = {
      position: "Project is recoverable and progressing.",
      reasoning:
        project.progress >= 50
          ? "The project has already crossed the halfway point and has measurable progress."
          : "The project still has time to establish momentum if the core work is prioritized.",
      recommendation:
        "Focus on the highest-value remaining deliverables and maintain steady progress.",
    };

    // Agent 2: Risk Analyst
    const risks: string[] = [];

    if (overdueTasks > 0) {
      risks.push(`${overdueTasks} unfinished task(s) are past their due date.`);
    }

    if (project.deadline && project.progress < 70) {
      const daysRemaining = Math.ceil(
        (new Date(project.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 14) {
        risks.push("The project deadline is very close.");
      } else if (daysRemaining <= 30) {
        risks.push("The project deadline is approaching.");
      }
    }

    if (taskList.length === 0) {
      risks.push("There is limited task evidence available.");
    }

    if (milestoneList.length === 0) {
      risks.push("No milestones have been defined.");
    }

    const riskAgent = {
      position:
        risks.length >= 2
          ? "Project requires immediate risk management."
          : "Project has manageable risks.",
      risks,
      recommendation:
        risks.length >= 2
          ? "Resolve overdue work, clarify milestones, and protect the deadline by reducing optional scope."
          : "Continue monitoring deadlines and convert major work into measurable tasks.",
    };

    // Agent 3: Scope Strategist
    const scopeStrategist = {
      position:
        taskList.length >= 25
          ? "Scope should be controlled carefully."
          : "Current workload appears manageable.",
      reasoning:
        taskList.length >= 25
          ? "A large task list can increase completion risk and reduce focus on the core objective."
          : "The visible task count does not indicate severe scope expansion.",
      recommendation:
        taskList.length >= 25
          ? "Prioritize must-have features and postpone optional enhancements."
          : "Keep the current scope focused on the original project goal.",
    };

    // Debate resolution
    let finalDecision = "Continue with the current plan.";
    let confidence = 70;

    if (risks.length >= 2 || overdueTasks >= 3) {
      finalDecision =
        "Enter controlled recovery mode: prioritize core deliverables, resolve overdue work, and avoid optional scope.";
      confidence = 88;
    } else if (project.progress >= 75 && overdueTasks === 0) {
      finalDecision =
        "Continue toward completion with emphasis on testing, validation, and final delivery.";
      confidence = 90;
    } else if (project.progress < 30 && taskList.length >= 20) {
      finalDecision =
        "Reduce scope before continuing. The current workload is large relative to demonstrated progress.";
      confidence = 85;
    }

    return NextResponse.json({
      success: true,
      analysis: {
        projectId: project.id,
        projectTitle: project.title,
        projectProgress: project.progress,
        evidenceProgress,
        agents: {
          optimist,
          riskAnalyst: riskAgent,
          scopeStrategist,
        },
        finalDecision,
        confidence,
        debateSummary:
          "The agents compared project momentum, measurable evidence, risks, deadlines, and scope before producing the final recommendation.",
      },
    });
  } catch (error) {
    console.error("Multi-agent debate error:", error);

    return NextResponse.json(
      { error: "Unable to run project debate." },
      { status: 500 }
    );
  }
}