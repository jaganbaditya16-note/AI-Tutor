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
        "id, user_id, title, description, technology, goal, progress, deadline"
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

    const [{ data: tasks }, { data: milestones }] =
      await Promise.all([
        supabase
          .from("tasks")
          .select(
            "id, title, description, status, priority, due_date"
          )
          .eq("project_id", projectId),

        supabase
          .from("milestones")
          .select(
            "id, title, description, status, progress, target_date"
          )
          .eq("project_id", projectId),
      ]);

    const taskList = tasks || [];
    const milestoneList = milestones || [];

    const dependencies: {
      dependency: string;
      reason: string;
      affectedArea: string;
      severity: "Low" | "Medium" | "High";
      recommendation: string;
    }[] = [];

    const text = `${project.description || ""} ${
      project.goal || ""
    } ${project.technology || ""}`.toLowerCase();

    // Authentication / authorization dependency
    if (
      text.includes("login") ||
      text.includes("authentication") ||
      text.includes("user account") ||
      text.includes("dashboard")
    ) {
      const hasAuthTask = taskList.some((task) =>
        `${task.title} ${task.description || ""}`
          .toLowerCase()
          .match(/auth|login|sign.?in|user/)
      );

      if (!hasAuthTask) {
        dependencies.push({
          dependency: "Authentication / User Management",
          reason:
            "The project appears to require user accounts, but no explicit authentication task was found.",
          affectedArea: "Core application access",
          severity: "Medium",
          recommendation:
            "Create a dedicated authentication task before building dependent dashboard features.",
        });
      }
    }

    // Database dependency
    if (
      text.includes("database") ||
      text.includes("supabase") ||
      text.includes("mysql") ||
      text.includes("postgres") ||
      text.includes("mongodb")
    ) {
      const hasDatabaseTask = taskList.some((task) =>
        `${task.title} ${task.description || ""}`
          .toLowerCase()
          .match(/database|schema|supabase|mysql|postgres|mongo/)
      );

      if (!hasDatabaseTask) {
        dependencies.push({
          dependency: "Database / Data Model",
          reason:
            "The technology or project description indicates persistent data is required, but no database task was detected.",
          affectedArea: "Data layer",
          severity: "High",
          recommendation:
            "Define the database schema and data relationships before implementing data-dependent features.",
        });
      }
    }

    // API dependency
    if (
      text.includes("api") ||
      text.includes("backend") ||
      text.includes("external service") ||
      text.includes("integration")
    ) {
      const hasApiTask = taskList.some((task) =>
        `${task.title} ${task.description || ""}`
          .toLowerCase()
          .match(/api|backend|integration|endpoint|service/)
      );

      if (!hasApiTask) {
        dependencies.push({
          dependency: "Backend API / Integration Layer",
          reason:
            "The project mentions backend or integrations, but no corresponding implementation task was found.",
          affectedArea: "Application services",
          severity: "Medium",
          recommendation:
            "Define API endpoints and integration requirements before connecting the frontend.",
        });
      }
    }

    // Testing dependency
    const hasTestingTask = taskList.some((task) =>
      `${task.title} ${task.description || ""}`
        .toLowerCase()
        .match(/test|testing|qa|debug|validation/)
    );

    if (project.progress >= 50 && !hasTestingTask) {
      dependencies.push({
        dependency: "Testing / Validation",
        reason:
          "The project is more than halfway complete but no explicit testing task was detected.",
        affectedArea: "Quality assurance",
        severity: "High",
        recommendation:
          "Add testing and validation tasks before continuing major feature development.",
      });
    }

    // Deployment dependency
    if (
      project.progress >= 70 &&
      !taskList.some((task) =>
        `${task.title} ${task.description || ""}`
          .toLowerCase()
          .match(/deploy|deployment|hosting|production/)
      )
    ) {
      dependencies.push({
        dependency: "Deployment / Production Setup",
        reason:
          "The project is approaching completion without an explicit deployment task.",
        affectedArea: "Release",
        severity: "Medium",
        recommendation:
          "Plan hosting, environment variables, production configuration, and deployment testing.",
      });
    }

    // Documentation dependency
    if (
      project.progress >= 60 &&
      !taskList.some((task) =>
        `${task.title} ${task.description || ""}`
          .toLowerCase()
          .match(/documentation|readme|report|manual/)
      )
    ) {
      dependencies.push({
        dependency: "Project Documentation",
        reason:
          "The project is progressing toward completion without a visible documentation task.",
        affectedArea: "Submission / maintenance",
        severity: "Low",
        recommendation:
          "Add documentation for setup, architecture, features, and usage.",
      });
    }

    // Milestone structure dependency
    if (milestoneList.length === 0 && project.progress > 0) {
      dependencies.push({
        dependency: "Milestone Structure",
        reason:
          "Project progress exists but no milestones have been defined.",
        affectedArea: "Project planning",
        severity: "Medium",
        recommendation:
          "Break the remaining work into measurable milestones.",
      });
    }

    const highRisk = dependencies.filter(
      (item) => item.severity === "High"
    ).length;

    const mediumRisk = dependencies.filter(
      (item) => item.severity === "Medium"
    ).length;

    let overallRisk: "Low" | "Medium" | "High" = "Low";

    if (highRisk >= 2 || dependencies.length >= 5) {
      overallRisk = "High";
    } else if (highRisk >= 1 || mediumRisk >= 2) {
      overallRisk = "Medium";
    }

    return NextResponse.json({
      success: true,
      analysis: {
        projectId: project.id,
        projectTitle: project.title,
        overallRisk,
        totalDependencies: dependencies.length,
        highRisk,
        mediumRisk,
        dependencies,
      },
    });
  } catch (error) {
    console.error("Dependency detector error:", error);

    return NextResponse.json(
      { error: "Unable to detect hidden dependencies." },
      { status: 500 }
    );
  }
}