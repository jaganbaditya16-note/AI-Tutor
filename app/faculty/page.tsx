import { redirect } from "next/navigation";
import { requireFaculty } from "@/lib/auth/roles";
import FacultyDashboard from "./FacultyDashboard";

export default async function FacultyPage() {
  try {
    await requireFaculty();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/faculty/sign-in");
    }
    throw error;
  }

  return <FacultyDashboard />;
}
