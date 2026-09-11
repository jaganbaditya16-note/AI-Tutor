import { redirect } from "next/navigation";
import { requireFaculty } from "@/lib/auth/roles";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireFaculty();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/faculty/sign-in");
    }
    throw error;
  }

  return children;
}
