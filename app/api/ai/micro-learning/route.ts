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
        "id, user_id, title, description, goal, technology, progress"
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

    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, description, status, priority")
      .eq("project_id", projectId);

    const taskList = tasks || [];

    const pendingTasks = taskList.filter((task) => {
      const status = String(task.status || "").toLowerCase();

      return !["completed", "complete", "done"].includes(status);
    });

    const projectText =
      `${project.title} ${project.description || ""} ${
        project.goal || ""
      } ${project.technology || ""}`.toLowerCase();

    const lessons: {
      title: string;
      reason: string;
      objective: string;
      mission: string;
      estimatedMinutes: number;
      priority: "High" | "Medium" | "Low";
    }[] = [];

    if (
      projectText.includes("api") ||
      projectText.includes("backend") ||
      projectText.includes("integration")
    ) {
      lessons.push({
        title: "API Fundamentals",
        reason: "Your project uses backend APIs or integrations.",
        objective:
          "Understand how API endpoints connect frontend applications with backend services.",
        mission:
          "Identify one API used by your project and write down its request, response, and purpose.",
        estimatedMinutes: 15,
        priority: "High",
      });
    }

    if (
      projectText.includes("database") ||
      projectText.includes("supabase") ||
      projectText.includes("mysql") ||
      projectText.includes("postgres") ||
      projectText.includes("mongodb")
    ) {
      lessons.push({
        title: "Database Design",
        reason: "Your project requires persistent application data.",
        objective:
          "Understand tables, relationships, and how application data should be structured.",
        mission:
          "Draw the main tables used by your project and identify the relationship between them.",
        estimatedMinutes: 20,
        priority: "High",
      });
    }

    if (
      projectText.includes("authentication") ||
      projectText.includes("login") ||
      projectText.includes("user account")
    ) {
      lessons.push({
        title: "Authentication Basics",
        reason: "Your project includes user accounts or authentication.",
        objective:
          "Understand secure sign-in, sessions, and user identity.",
        mission:
          "Map the login flow from user input to authenticated application access.",
        estimatedMinutes: 15,
        priority: "High",
      });
    }

    if (
      projectText.includes("ai") ||
      projectText.includes("artificial intelligence") ||
      projectText.includes("machine learning")
    ) {
      lessons.push({
        title: "AI Feature Fundamentals",
        reason: "Your project contains an AI or machine-learning component.",
        objective:
          "Understand how inputs, models, prompts, outputs, and validation fit together.",
        mission:
          "Describe one AI feature in your project using: input → processing → output → validation.",
        estimatedMinutes: 20,
        priority: "High",
      });
    }

    if (
      projectText.includes("dashboard") ||
      projectText.includes("analytics") ||
      projectText.includes("report")
    ) {
      lessons.push({
        title: "Data Visualization",
        reason: "Your project presents analytics, dashboards, or reports.",
        objective:
          "Learn how to present important project information clearly.",
        mission:
          "Choose three important metrics for your dashboard and explain why each matters.",
        estimatedMinutes: 15,
        priority: "Medium",
      });
    }

    if (
      projectText.includes("mobile") ||
      projectText.includes("android") ||
      projectText.includes("ios")
    ) {
      lessons.push({
        title: "Mobile Application Planning",
        reason: "Your project targets mobile users.",
        objective:
          "Understand mobile-first interface and application planning.",
        mission:
          "Identify the three most important screens in your mobile application.",
        estimatedMinutes: 15,
        priority: "Medium",
      });
    }

    const hasTestingTask = taskList.some((task) =>
      `${task.title} ${task.description || ""}`
        .toLowerCase()
        .match(/test|testing|qa|debug|validation/)
    );

    if (project.progress >= 40 && !hasTestingTask) {
      lessons.push({
        title: "Testing & Validation",
        reason:
          "Your project has progressed significantly but has limited visible testing work.",
        objective:
          "Learn how to validate features before considering them complete.",
        mission:
          "Choose one completed feature and create three test cases for it.",
        estimatedMinutes: 20,
        priority: "High",
      });
    }

    if (pendingTasks.length > 0) {
      lessons.push({
        title: "Task Decomposition",
        reason:
          "Your project still contains unfinished work that may benefit from smaller steps.",
        objective:
          "Learn how to break large project tasks into achievable actions.",
        mission:
          `Take this pending task: "${pendingTasks[0].title}" and divide it into three smaller implementation steps.`,
        estimatedMinutes: 10,
        priority: "Medium",
      });
    }

    if (lessons.length === 0) {
      lessons.push({
        title: "Project Planning Essentials",
        reason:
          "There is not enough project-specific information to identify a technical lesson.",
        objective:
          "Learn how to define clear project goals, deliverables, and milestones.",
        mission:
          "Write your project's core objective in one sentence and list three measurable deliverables.",
        estimatedMinutes: 15,
        priority: "Medium",
      });
    }

    const recommendedLessons = lessons.slice(0, 5);

    return NextResponse.json({
      success: true,
      learning: {
        projectId: project.id,
        projectTitle: project.title,
        projectProgress: project.progress,
        lessons: recommendedLessons,
        totalLessons: recommendedLessons.length,
      },
    });
  } catch (error) {
    console.error("Micro-learning error:", error);

    return NextResponse.json(
      { error: "Unable to generate personalized learning." },
      { status: 500 }
    );
  }
}