import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Dashboard() {
  const user = await currentUser();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}.
          </p>
        </div>
        <UserButton />
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
        <Card
          title="AI Mentor"
          description="Get AI-powered guidance for your project."
          href="/mentor"
        />
        <Card
          title="Projects"
          description="Create and manage your academic projects."
          href="/projects"
        />
        <Card
          title="Tasks"
          description="Track your project tasks and progress."
          href="/tasks"
        />
      </div>
    </main>
  );
}

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: 24,
        border: "1px solid #243244",
        borderRadius: 16,
        background: "#0d1a2b",
      }}
    >
      <h2>{title}</h2>
      <p style={{ color: "#94a3b8" }}>{description}</p>
    </Link>
  );
}
