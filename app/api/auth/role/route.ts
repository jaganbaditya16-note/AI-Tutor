import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userId = await requireUser();
    const { data, error } = await db()
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Role lookup error:", error);
      return NextResponse.json(
        { error: "Unable to verify your account role." },
        { status: 500 }
      );
    }

    if (!data?.role) {
      return NextResponse.json(
        { error: "Your account profile is not configured." },
        { status: 403 }
      );
    }

    return NextResponse.json({ role: data.role });
  } catch (error) {
    console.error("Auth role API error:", error);
    return NextResponse.json(
      { error: "You are not signed in." },
      { status: 401 }
    );
  }
}
