import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();
    const body = await request.json();

    const facultyId = String(body.facultyId || "");
    const projectId = String(body.projectId || "");

    if (!facultyId || !projectId) {
      return NextResponse.json(
        { error: "Faculty and project are required." },
        { status: 400 }
      );
    }

    const supabase = db();

    // Verify selected user is actually faculty.
    const { data: faculty, error: facultyError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", facultyId)
      .eq("role", "faculty")
      .maybeSingle();

    if (facultyError) {
      console.error("Faculty verification error:", facultyError);

      return NextResponse.json(
        { error: "Unable to verify faculty member." },
        { status: 500 }
      );
    }

    if (!faculty) {
      return NextResponse.json(
        { error: "Selected user is not a faculty member." },
        { status: 400 }
      );
    }

    // Verify project exists.
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, title")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Project verification error:", projectError);

      return NextResponse.json(
        { error: "Unable to verify project." },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // Prevent duplicate assignments.
    const { data: existing } = await supabase
      .from("faculty_project_assignments")
      .select("id")
      .eq("faculty_id", facultyId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This faculty member is already assigned to this project." },
        { status: 409 }
      );
    }

    const { data: assignment, error: insertError } = await supabase
      .from("faculty_project_assignments")
      .insert({
        faculty_id: facultyId,
        project_id: projectId,
        assigned_by: adminId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Faculty assignment error:", insertError);

      return NextResponse.json(
        { error: "Unable to assign faculty to project." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Admin assignment API error:", error);

    return NextResponse.json(
      { error: "You do not have permission to assign faculty." },
      { status: 403 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const assignmentId = String(body.assignmentId || "");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required." },
        { status: 400 }
      );
    }

    const supabase = db();

    const { error } = await supabase
      .from("faculty_project_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("Faculty unassignment error:", error);

      return NextResponse.json(
        { error: "Unable to remove assignment." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Admin unassignment API error:", error);

    return NextResponse.json(
      { error: "You do not have permission to remove assignments." },
      { status: 403 }
    );
  }
}