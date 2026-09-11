"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

const steps = [
  {
    icon: GraduationCap,
    title: "Student access",
    badge: "STUDENT",
    steps: [
      "Open /sign-up if you do not have a student account.",
      "Create your account with your own email and password.",
      "After signing in, use the student dashboard to create or manage projects.",
      "Use Auto Planner to generate a plan, then review and edit the generated work before saving it.",
    ],
  },
  {
    icon: Users,
    title: "Faculty access",
    badge: "FACULTY",
    steps: [
      "A faculty member must first receive an invitation from an authorized admin.",
      "Open the invitation link and complete the faculty account setup.",
      "Use /faculty/sign-in for future faculty logins.",
      "The faculty dashboard shows projects assigned to that faculty member and provides review/feedback tools.",
    ],
  },
  {
    icon: UserCog,
    title: "Admin access",
    badge: "ADMIN",
    steps: [
      "Use /admin to open the protected admin area. If you are not authenticated as an admin, you are sent to /admin/sign-in.",
      "There is no hard-coded admin email, password, or personal name in the application.",
      "For the first administrator, create the account locally with: npm run create-admin (or node scripts/create-admin.mjs). The script reads .env.local and asks for the admin email, password, and full name interactively.",
      "After the admin exists, sign in through /admin/sign-in. Use the admin dashboard to manage faculty invitations, assignments, and administration tasks.",
    ],
  },
];

export default function InstructionsPage() {
  return (
    <main className="instructions-page">
      <header className="instructions-hero fade-up">
        <Link href="/" className="instructions-back">
          <ArrowLeft size={16} />
          Back to ProjectPilot
        </Link>
        <div className="hero-kicker">
          <BookOpen size={14} />
          READ BEFORE USING THE PLATFORM
        </div>
        <h1>How to use ProjectPilot</h1>
        <p>
          Please read these instructions carefully before creating accounts,
          inviting faculty, or testing project workflows. Each role has a
          different dashboard and permission level.
        </p>
      </header>

      <section className="instructions-warning fade-up delay-1">
        <ShieldCheck size={20} />
        <div>
          <strong>Security rule</strong>
          <p>
            Never put a Gmail password, personal password, service-role key,
            AI provider key, or other secret in GitHub source code. Keep real
            credentials in local environment variables or your deployment
            provider's secret settings.
          </p>
        </div>
      </section>

      <section className="instructions-grid">
        {steps.map(({ icon: Icon, title, badge, steps: items }, index) => (
          <article className="instruction-card fade-up" key={title}>
            <div className="instruction-card-head">
              <div className="instruction-icon"><Icon size={20} /></div>
              <span>{badge}</span>
            </div>
            <h2>{index + 1}. {title}</h2>
            <ol>
              {items.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </article>
        ))}
      </section>

      <section className="instructions-card fade-up">
        <div className="instruction-card-head">
          <div className="instruction-icon"><KeyRound size={20} /></div>
          <span>FIRST SETUP</span>
        </div>
        <h2>First administrator setup</h2>
        <p>
          The repository does not contain a pre-created administrator account.
          This prevents the project from shipping with a shared or hard-coded
          password.
        </p>
        <ol>
          <li>Copy .env.example to .env.local.</li>
          <li>Fill in the Supabase URL, anon key, and service-role key locally.</li>
          <li>Run the database schema in supabase/schema.sql.</li>
          <li>Run <code>npm run create-admin</code> if the script is available in your local checkout, otherwise run <code>node scripts/create-admin.mjs</code>.</li>
          <li>Enter the administrator credentials only when prompted in your local terminal.</li>
          <li>Open /admin/sign-in and sign in with that account.</li>
        </ol>
        <p className="instructions-note">
          Do not commit .env.local. The repository's .gitignore already excludes
          .env, .env.local, and local environment variants.
        </p>
      </section>

      <section className="instructions-card fade-up">
        <h2>Role rules to remember</h2>
        <ul className="role-rules">
          <li><strong>Student:</strong> manages their own projects, tasks, milestones, documents, and AI-assisted planning.</li>
          <li><strong>Faculty:</strong> works with projects assigned to them and provides academic review/feedback.</li>
          <li><strong>Admin:</strong> manages platform-level administration, faculty invitations, assignments, and user/project administration.</li>
          <li>Typing /admin or /faculty into the URL does not grant permission. Server-side role checks must still pass.</li>
          <li>AI output is assistance, not automatic approval. Review generated plans and recommendations before relying on them.</li>
        </ul>
      </section>

      <footer className="instructions-footer">
        <Link href="/sign-in">Student sign in</Link>
        <Link href="/faculty/sign-in">Faculty sign in</Link>
        <Link href="/admin/sign-in">Admin sign in</Link>
      </footer>
    </main>
  );
}
