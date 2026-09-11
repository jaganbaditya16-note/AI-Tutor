import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/admin/sign-in");
    }
    throw error;
  }

  return children;
}
