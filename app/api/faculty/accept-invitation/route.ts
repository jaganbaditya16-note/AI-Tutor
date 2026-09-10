import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getValidFacultyInvitation,
  markFacultyInvitationUsed,
} from "@/lib/auth/invitations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = String(body.token || "");
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();

    if (!token || !password || !fullName) {
      return NextResponse.json(
        { error: "Token, full name and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const invitation = await getValidFacultyInvitation(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid, expired, or already used invitation." },
        { status: 400 }
      );
    }

    const supabase = db();

    const {
      data: { user },
      error: createError,
    } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError || !user) {
      return NextResponse.json(
        {
          error:
            createError?.message || "Unable to create faculty account.",
        },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role: "faculty",
      })
      .eq("id", user.id);

    if (profileError) {
      await supabase.auth.admin.deleteUser(user.id);

      return NextResponse.json(
        { error: "Unable to create faculty profile." },
        { status: 500 }
      );
    }

    await markFacultyInvitationUsed(invitation.id);

    return NextResponse.json({
      success: true,
      email: invitation.email,
    });
  } catch (error) {
    console.error("Faculty account creation error:", error);

    return NextResponse.json(
      { error: "Unable to create faculty account." },
      { status: 500 }
    );
  }
}