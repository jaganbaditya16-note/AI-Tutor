import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFaculty } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const facultyId = await requireFaculty();
    const body = await request.json();

    const action = String(body.action || "");
    const projectId = String(body.projectId || "");
    const milestoneId = String(body.milestoneId || "");
    const feedback = String(body.feedback || "").trim();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    if (!["feedback", "milestone_review"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid review action." },
        { status: 400 }
      );
    }

    const supabase = db();

    // Security: faculty can only act on projects assigned to them.
    const { data: assignment, error: assignmentError } = await supabase
      .from("faculty_project_assignments")
      .select("id")
      .eq("faculty_id", facultyId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (assignmentError) {
      console.error("Faculty assignment lookup error:", assignmentError);

      return NextResponse.json(
        { error: "Unable to verify project assignment." },
        { status: 500 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not assigned to this project." },
        { status: 403 }
      );
    }

    // -----------------------------
    // Faculty feedback
    // -----------------------------
    if (action === "feedback") {
      if (!feedback) {
        return NextResponse.json(
          { error: "Feedback cannot be empty." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("faculty_feedback")
        .insert({
          faculty_id: facultyId,
          project_id: projectId,
          feedback,
        })
        .select()
        .single();

      if (error) {
        console.error("Faculty feedback error:", error);

        return NextResponse.json(
          { error: "Unable to save feedback." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        feedback: data,
      });
    }

    // -----------------------------
    // Milestone review
    // -----------------------------
    if (!milestoneId) {
      return NextResponse.json(
        { error: "Milestone ID is required." },
        { status: 400 }
      );
    }

    const reviewStatus = String(body.reviewStatus || "");

    if (!["Approved", "Rejected"].includes(reviewStatus)) {
      return NextResponse.json(
        { error: "Review status must be Approved or Rejected." },
        { status: 400 }
      );
    }

    // Make sure the milestone belongs to the selected project.
    const { data: milestone, error: milestoneLookupError } =
      await supabase
        .from("milestones")
        .select("id, project_id")
        .eq("id", milestoneId)
        .eq("project_id", projectId)
        .maybeSingle();

    if (milestoneLookupError) {
      console.error(
        "Milestone lookup error:",
        milestoneLookupError
      );

      return NextResponse.json(
        { error: "Unable to verify milestone." },
        { status: 500 }
      );
    }

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone does not belong to this project." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("milestones")
      .update({
        faculty_review_status: reviewStatus,
        faculty_review_comment: feedback || null,
        reviewed_by: facultyId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", milestoneId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Milestone review error:", error);

      return NextResponse.json(
        { error: "Unable to update milestone review." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      milestone: data,
    });
  } catch (error) {
    console.error("Faculty review API error:", error);

    return NextResponse.json(
      { error: "Unable to process faculty review." },
      { status: 500 }
    );
  }
}