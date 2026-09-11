import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/admin/sign-in");
    }
    throw error;
  }

  return <AdminDashboard />;
}
