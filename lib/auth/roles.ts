import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type UserRole = "student" | "faculty" | "admin";

export async function getUserRole(): Promise<UserRole> {
  const userId = await requireUser();

  const { data, error } = await db()
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("USER_PROFILE_NOT_FOUND");
  }

  return data.role as UserRole;
}

export function getDashboardForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "faculty":
      return "/faculty";
    default:
      return "/dashboard";
  }
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<string> {
  const userId = await requireUser();
  const role = await getUserRole();

  if (!allowedRoles.includes(role)) {
    redirect(getDashboardForRole(role));
  }

  return userId;
}

export async function requireAdmin(): Promise<string> {
  return requireRole(["admin"]);
}

export async function requireFaculty(): Promise<string> {
  return requireRole(["faculty"]);
}

export async function requireStudent(): Promise<string> {
  return requireRole(["student"]);
}