import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth/roles";
import { db } from "@/lib/db";

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json(
    { error: message },
    { status: message === "UNAUTHORIZED" ? 401 : 500 }
  );
}

export async function GET() {
  try {
    const userId = await requireStudent();
    const { data, error } = await db()
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ projects: data || [] });
  } catch (error) {
    return errorResponse(error, "Failed to load projects");
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireStudent();
    const body = await req.json();
    const title = String(body.title || "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 }
      );
    }

    const { data, error } = await db()
      .from("projects")
      .insert({
        user_id: userId,
        title,
        description: body.description || null,
        project_type: body.project_type || null,
        technology: body.technology || null,
        goal: body.goal || null,
        start_date: body.start_date || null,
        deadline: body.deadline || null,
        status: "Planning",
        progress: 0,
      })
      .select()
      .single();

    if (error) throw error;

    const { error: eventError } = await db().from("project_events").insert({
      project_id: data.id,
      user_id: userId,
      event_type: "project_created",
      payload: { title },
    });

    // Audit logging should never make a successfully created project appear to fail.
    if (eventError) console.error("Project creation audit error:", eventError);

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create project");
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await requireStudent();
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    const { data: project, error: lookupError } = await db()
      .from("projects")
      .select("id,progress")
      .eq("id", body.id)
      .eq("user_id", userId)
      .single();

    if (lookupError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rawProgress = Number(body.progress);
    if (!Number.isFinite(rawProgress)) {
      return NextResponse.json(
        { error: "Progress must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    const progress = Math.round(Math.max(0, Math.min(100, rawProgress)));
    const status = body.status ? String(body.status).trim() : undefined;
    const update: { progress: number; status?: string } = { progress };

    if (status) update.status = status;

    const { data, error } = await db()
      .from("projects")
      .update(update)
      .eq("id", project.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const { error: eventError } = await db().from("project_events").insert({
      project_id: project.id,
      user_id: userId,
      event_type: "project_updated",
      payload: { progress, status: status || null },
    });

    if (eventError) console.error("Project update audit error:", eventError);

    return NextResponse.json({ project: data });
  } catch (error) {
    return errorResponse(error, "Failed to update project");
  }
}
