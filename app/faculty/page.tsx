import { requireFaculty } from "@/lib/auth/roles";

export default async function FacultyPage() {
  await requireFaculty();

  return (
    <main style={{ padding: "40px" }}>
      <h1>Faculty Dashboard</h1>
      <p>Faculty workspace is ready.</p>
    </main>
  );
}