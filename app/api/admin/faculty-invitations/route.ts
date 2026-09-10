import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { createFacultyInvitation } from "@/lib/auth/invitations";

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Faculty email is required." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const result = await createFacultyInvitation(email, adminId);

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      token: result.token,
    });
  } catch (error) {
    console.error("Faculty invitation error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 }
    );
  }
}