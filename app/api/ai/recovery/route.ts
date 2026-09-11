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
        "id, user_id, title, description, goal, progress, deadline, status"
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
        .select("id, title, description, status, priority, due_date")
        .eq("project_id", projectId),

      supabase
        .from("milestones")
        .select("id, title, description, status, progress, target_date")
        .eq("project_id", projectId),
    ]);

    const taskList = tasks || [];
    const milestoneList = milestones || [];

    const incompleteTasks = taskList.filter((task) => {
      const status = String(task.status || "").toLowerCase();
      return !["completed", "complete", "done"].includes(status);
    });

    const overdueTasks = incompleteTasks.filter((task) => {
      if (!task.due_date) return false;
      return new Date(task.due_date).getTime() < Date.now();
    });

    const completedTasks = taskList.length - incompleteTasks.length;

    let daysRemaining: number | null = null;

    if (project.deadline) {
      daysRemaining = Math.ceil(
        (new Date(project.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
    }

    const risks: string[] = [];

    if (project.progress < 30) {
      risks.push("Project progress is below 30%.");
    }

    if (overdueTasks.length > 0) {
      risks.push(`${overdueTasks.length} task(s) are overdue.`);
    }

    if (daysRemaining !== null && daysRemaining <= 14 && project.progress < 80) {
      risks.push("The deadline is close relative to the current progress.");
    }

    if (taskList.length >= 25 && project.progress < 60) {
      risks.push("The remaining workload is large compared with demonstrated progress.");
    }

    if (milestoneList.length === 0) {
      risks.push("No milestones are available to structure the recovery plan.");
    }

    let severity: "Normal" | "Warning" | "Critical" = "Normal";

    if (
      overdueTasks.length >= 3 ||
      (daysRemaining !== null &&
        daysRemaining <= 7 &&
        project.progress < 80) ||
      (project.progress < 25 && taskList.length >= 20)
    ) {
      severity = "Critical";
    } else if (risks.length >= 2) {
      severity = "Warning";
    }

    const priorityTasks = [...incompleteTasks].sort((a, b) => {
      const priorityRank: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1,
      };

      return (
        (priorityRank[String(b.priority || "").toLowerCase()] || 2) -
        (priorityRank[String(a.priority || "").toLowerCase()] || 2)
      );
    });

    const recoveryActions: string[] = [];

    if (severity === "Critical") {
      recoveryActions.push(
        "Freeze optional features immediately."
      );
      recoveryActions.push(
        "Focus only on the minimum viable project outcome."
      );
      recoveryActions.push(
        "Complete the highest-priority unfinished tasks first."
      );
      recoveryActions.push(
        "Review the recovery plan with a faculty mentor if available."
      );
    } else if (severity === "Warning") {
      recoveryActions.push(
        "Prioritize core deliverables over optional improvements."
      );
      recoveryActions.push(
        "Resolve overdue tasks before adding new major features."
      );
      recoveryActions.push(
        "Break remaining work into smaller measurable tasks."
      );
    } else {
      recoveryActions.push(
        "Continue the planned development process."
      );
      recoveryActions.push(
        "Keep tasks and milestones updated so risks can be detected early."
      );
    }

    const nextTasks = priorityTasks.slice(0, 5).map((task) => ({
      title: task.title,
      priority: task.priority,
      dueDate: task.due_date,
      status: task.status,
    }));

    return NextResponse.json({
      success: true,
      analysis: {
        projectId: project.id,
        projectTitle: project.title,
        severity,
        progress: project.progress,
        daysRemaining,
        workload: {
          totalTasks: taskList.length,
          completedTasks,
          remainingTasks: incompleteTasks.length,
          overdueTasks: overdueTasks.length,
          milestones: milestoneList.length,
        },
        risks,
        recoveryActions,
        immediatePriorityTasks: nextTasks,
        recoveryMode:
          severity === "Critical"
            ? "ACTIVE"
            : severity === "Warning"
              ? "RECOMMENDED"
              : "NOT_REQUIRED",
      },
    });
  } catch (error) {
    console.error("Recovery mode error:", error);

    return NextResponse.json(
      { error: "Unable to generate recovery plan." },
      { status: 500 }
    );
  }
}