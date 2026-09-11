import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function InstructionsPage() {
  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-300">
            <BookOpen size={14} />
            QUICK START GUIDE
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            How to use the platform
          </h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            A simple guide for students, faculty members, and administrators.
            Use the role-specific sign-in pages below; access is checked again
            on the server after login.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          <GuideCard
            icon={<GraduationCap size={20} />}
            title="Student"
            steps={[
              "Create a student account from Sign Up.",
              "Sign in through the normal student Sign In page.",
              "Create a project manually or use Auto Planner.",
              "Update tasks and milestones as work progresses.",
              "Use AI Mentor, Insights, Micro-Learning and project intelligence for guidance.",
            ]}
            href="/sign-in"
            action="Student sign in"
          />
          <GuideCard
            icon={<Users size={20} />}
            title="Faculty"
            steps={[
              "An administrator creates a faculty invitation.",
              "Open the invitation link and create your faculty password.",
              "Sign in through Faculty Sign In.",
              "Only projects assigned to you appear in your dashboard.",
              "Review milestones and send feedback to students.",
            ]}
            href="/faculty/sign-in"
            action="Faculty sign in"
          />
          <GuideCard
            icon={<ShieldCheck size={20} />}
            title="Admin"
            steps={[
              "An administrator account must be created first with the secure create-admin script; normal public sign-up creates student accounts only.",
              "Open Admin Sign In and enter the administrator credentials.",
              "Manage students, faculty and project assignments.",
              "Invite faculty members and give them their invitation link.",
              "Changing /student, /faculty or /admin in the URL does not change the account role; unauthorized access ends on the Access Denied page.",
            ]}
            href="/admin/sign-in"
            action="Admin sign in"
          />
        </div>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <InfoCard
            icon={<Sparkles size={19} />}
            title="Recommended student flow"
            text="Sign in → Auto Planner → review the generated plan → work through tasks → update milestones → use AI Mentor and project intelligence when blocked → collect faculty feedback."
          />
          <InfoCard
            icon={<KeyRound size={19} />}
            title="Important login rule"
            text="Do not share passwords or invitation tokens. If you are a student, typing /admin or /faculty does not grant access. The platform checks the account role on protected server routes."
          />
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Back to home
          </Link>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400"
          >
            Open Auto Planner <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function GuideCard({
  icon,
  title,
  steps,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  steps: string[];
  href: string;
  action: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-xl shadow-black/10">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-2.5 text-indigo-300">
          {icon}
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <ol className="space-y-3 text-sm leading-6 text-slate-300">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-200">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
      >
        {action} <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="mb-3 flex items-center gap-2 text-indigo-300">
        {icon}
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <p className="text-sm leading-6 text-slate-400">{text}</p>
    </section>
  );
}
