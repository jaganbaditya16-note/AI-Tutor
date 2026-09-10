import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/roles";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = db();

    const [
      { data: students, error: studentsError },
      { data: faculty, error: facultyError },
      { data: projects, error: projectsError },
      { data: assignments, error: assignmentsError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, student_number, department, role")
        .eq("role", "student")
        .order("full_name"),

      supabase
        .from("profiles")
        .select("id, full_name, department, role")
        .eq("role", "faculty")
        .order("full_name"),

      supabase
        .from("projects")
        .select(
          "id, user_id, title, project_type, technology, status, progress, deadline"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("faculty_project_assignments")
        .select("id, faculty_id, project_id, assigned_at"),
    ]);

    if (studentsError || facultyError || projectsError || assignmentsError) {
      console.error({
        studentsError,
        facultyError,
        projectsError,
        assignmentsError,
      });

      return NextResponse.json(
        { error: "Unable to load admin management data." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      students: students || [],
      faculty: faculty || [],
      projects: projects || [],
      assignments: assignments || [],
    });
  } catch (error) {
    console.error("Admin management API error:", error);

    return NextResponse.json(
      { error: "You do not have permission to access this data." },
      { status: 403 }
    );
  }
}