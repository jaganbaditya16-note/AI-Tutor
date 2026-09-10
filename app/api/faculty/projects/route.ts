import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFaculty } from "@/lib/auth/roles";

export async function GET() {
  try {
    const facultyId = await requireFaculty();
    const supabase = db();

    const { data, error } = await supabase
      .from("faculty_project_assignments")
      .select(`
        id,
        assigned_at,
        project_id,
        projects (
          id,
          user_id,
          title,
          description,
          project_type,
          technology,
          goal,
          status,
          progress,
          start_date,
          deadline,
          created_at
        )
      `)
      .eq("faculty_id", facultyId)
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Faculty projects error:", error);

      return NextResponse.json(
        { error: "Unable to load assigned projects." },
        { status: 500 }
      );
    }

    const assignments = data || [];

    const projectIds = assignments
      .map((item: any) => item.projects?.id)
      .filter(Boolean);

    const studentIds = assignments
      .map((item: any) => item.projects?.user_id)
      .filter(Boolean);

    let students: any[] = [];
    let milestones: any[] = [];
    let feedback: any[] = [];

    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, student_number, department")
        .in("id", studentIds);

      students = profiles || [];
    }

    if (projectIds.length > 0) {
      const { data: milestoneData, error: milestoneError } =
        await supabase
          .from("milestones")
          .select(`
            id,
            project_id,
            title,
            description,
            status,
            progress,
            target_date,
            faculty_review_status,
            faculty_review_comment,
            reviewed_by,
            reviewed_at
          `)
          .in("project_id", projectIds)
          .order("target_date", { ascending: true });

      if (milestoneError) {
        console.error("Milestone lookup error:", milestoneError);
      } else {
        milestones = milestoneData || [];
      }

      const { data: feedbackData, error: feedbackError } =
        await supabase
          .from("faculty_feedback")
          .select(`
            id,
            project_id,
            milestone_id,
            feedback,
            created_at
          `)
          .eq("faculty_id", facultyId)
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

      if (feedbackError) {
        console.error("Feedback lookup error:", feedbackError);
      } else {
        feedback = feedbackData || [];
      }
    }

    const studentMap = new Map(
      students.map((student) => [student.id, student])
    );

    const milestonesMap = new Map<string, any[]>();

    for (const milestone of milestones) {
      const existing = milestonesMap.get(milestone.project_id) || [];
      existing.push(milestone);
      milestonesMap.set(milestone.project_id, existing);
    }

    const feedbackMap = new Map<string, any[]>();

    for (const item of feedback) {
      const existing = feedbackMap.get(item.project_id) || [];
      existing.push(item);
      feedbackMap.set(item.project_id, existing);
    }

    const projects = assignments.map((assignment: any) => {
      const project = assignment.projects;

      if (!project) {
        return {
          assignmentId: assignment.id,
          assignedAt: assignment.assigned_at,
          project: null,
          student: null,
          milestones: [],
          feedback: [],
        };
      }

      return {
        assignmentId: assignment.id,
        assignedAt: assignment.assigned_at,
        project,
        student: studentMap.get(project.user_id) || null,
        milestones: milestonesMap.get(project.id) || [],
        feedback: feedbackMap.get(project.id) || [],
      };
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Faculty projects API error:", error);

    return NextResponse.json(
      { error: "Unable to load faculty projects." },
      { status: 500 }
    );
  }
}