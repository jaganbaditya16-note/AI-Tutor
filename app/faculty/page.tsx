"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
  XCircle,
} from "lucide-react";

type Student = {
  id: string;
  full_name: string | null;
  student_number: string | null;
  department: string | null;
};

type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  project_type: string | null;
  technology: string | null;
  goal: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  deadline: string | null;
  created_at: string;
};

type Milestone = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  target_date: string | null;
  faculty_review_status: "Pending" | "Approved" | "Rejected";
  faculty_review_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type Feedback = {
  id: string;
  project_id: string;
  milestone_id: string | null;
  feedback: string;
  created_at: string;
};

type FacultyProject = {
  assignmentId: string;
  assignedAt: string;
  project: Project;
  student: Student | null;
  milestones: Milestone[];
  feedback: Feedback[];
};

function getHealth(project: Project) {
  if (project.progress >= 75) return "Healthy";
  if (project.progress >= 40) return "Needs Attention";
  return "At Risk";
}

function getHealthClass(project: Project) {
  const health = getHealth(project);

  if (health === "Healthy") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (health === "Needs Attention") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-red-500/20 bg-red-500/10 text-red-400";
}

function isOverdue(project: Project) {
  if (!project.deadline) return false;

  const deadline = new Date(project.deadline);
  const today = new Date();

  deadline.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);

  return deadline < today && project.progress < 100;
}

export default function FacultyPage() {
  const [projects, setProjects] = useState<FacultyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<FacultyProject | null>(null);

  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [reviewingMilestone, setReviewingMilestone] = useState<string | null>(
    null
  );
  const [actionMessage, setActionMessage] = useState("");

  async function loadProjects(): Promise<FacultyProject[]> {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/faculty/projects", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load projects.");
      }

      const nextProjects = data.projects || [];
      setProjects(nextProjects);
      return nextProjects;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load faculty projects."
      );
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const stats = useMemo(() => {
    const active = projects.filter(
      (item) => item.project && item.project.progress < 100
    ).length;

    const atRisk = projects.filter(
      (item) => item.project && getHealth(item.project) === "At Risk"
    ).length;

    const overdue = projects.filter(
      (item) => item.project && isOverdue(item.project)
    ).length;

    const students = new Set(
      projects.map((item) => item.student?.id).filter(Boolean)
    ).size;

    return { active, atRisk, overdue, students };
  }, [projects]);

  async function submitFeedback() {
    if (!selected || !feedbackText.trim()) return;

    try {
      setSavingFeedback(true);
      setActionMessage("");

      const response = await fetch("/api/faculty/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "feedback",
          projectId: selected.project.id,
          feedback: feedbackText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save feedback.");
      }

      setFeedbackText("");
      setActionMessage("Feedback saved successfully.");
      const refreshedProjects = await loadProjects();
      const refreshed = refreshedProjects.find(
        (item) => item.project.id === selected.project.id
      );
      if (refreshed) setSelected(refreshed);
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Unable to save feedback."
      );
    } finally {
      setSavingFeedback(false);
    }
  }

  async function reviewMilestone(
    milestoneId: string,
    reviewStatus: "Approved" | "Rejected"
  ) {
    if (!selected) return;

    try {
      setReviewingMilestone(milestoneId);
      setActionMessage("");

      const response = await fetch("/api/faculty/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "milestone_review",
          projectId: selected.project.id,
          milestoneId,
          reviewStatus,
          feedback: feedbackText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to review milestone.");
      }

      setFeedbackText("");
      setActionMessage(`Milestone ${reviewStatus.toLowerCase()}.`);

      await loadProjects();

      const response2 = await fetch("/api/faculty/projects", {
        cache: "no-store",
      });

      const refreshedData = await response2.json();

      const refreshed = (refreshedData.projects || []).find(
        (item: FacultyProject) => item.project.id === selected.project.id
      );

      if (refreshed) {
        setSelected(refreshed);
      }
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Unable to review milestone."
      );
    } finally {
      setReviewingMilestone(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-400">
              FACULTY WORKSPACE
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Faculty Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Monitor projects, guide students, review milestones, and
              identify projects that need attention.
            </p>
          </div>

          <button
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users size={19} />}
            label="Assigned Students"
            value={stats.students}
          />

          <StatCard
            icon={<FolderKanban size={19} />}
            label="Active Projects"
            value={stats.active}
          />

          <StatCard
            icon={<ShieldAlert size={19} />}
            label="Projects At Risk"
            value={stats.atRisk}
            danger={stats.atRisk > 0}
          />

          <StatCard
            icon={<Clock3 size={19} />}
            label="Overdue Projects"
            value={stats.overdue}
            danger={stats.overdue > 0}
          />
        </section>

        {error && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <p className="font-semibold">Unable to load dashboard</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-lg font-semibold">Assigned Projects</h2>
            <p className="mt-1 text-sm text-slate-400">
              Projects currently assigned to you.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
              <RefreshCw size={17} className="mr-3 animate-spin" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <FolderKanban size={30} className="mb-4 text-slate-500" />
              <h3 className="font-semibold">No projects assigned yet</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Projects assigned by an administrator will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {projects.map((item) => {
                if (!item.project) return null;

                const project = item.project;

                return (
                  <div
                    key={item.assignmentId}
                    className="p-6 transition hover:bg-white/[0.025]"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold">
                            {project.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getHealthClass(
                              project
                            )}`}
                          >
                            {getHealth(project)}
                          </span>

                          {isOverdue(project) && (
                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-2">
                            <Users size={14} />
                            {item.student?.full_name || "Student"}
                          </span>

                          {item.student?.student_number && (
                            <span>{item.student.student_number}</span>
                          )}

                          {project.technology && (
                            <span>{project.technology}</span>
                          )}
                        </div>
                      </div>

                      <div className="w-full xl:w-80">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-slate-400">Progress</span>
                          <span>{project.progress}%</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(
                                Math.max(project.progress, 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {project.deadline && (
                          <div className="hidden text-right sm:block">
                            <p className="text-xs text-slate-500">Deadline</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {new Date(project.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelected(item);
                            setActionMessage("");
                            setFeedbackText("");
                          }}
                          className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-auto my-8 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0d1320] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">
                  Faculty Review
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {selected.project.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selected.student?.full_name || "Student"}
                  {selected.student?.student_number
                    ? ` • ${selected.student.student_number}`
                    : ""}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Detail label="Progress" value={`${selected.project.progress}%`} />
              <Detail label="Status" value={selected.project.status} />
              <Detail
                label="Technology"
                value={selected.project.technology || "Not specified"}
              />
              <Detail
                label="Deadline"
                value={
                  selected.project.deadline
                    ? new Date(
                        selected.project.deadline
                      ).toLocaleDateString()
                    : "Not specified"
                }
              />
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-semibold">Milestones</h3>

              {selected.milestones.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-500">
                  No milestones available.
                </div>
              ) : (
                <div className="space-y-3">
                  {selected.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="font-medium">{milestone.title}</h4>

                          <p className="mt-1 text-xs text-slate-500">
                            Progress: {milestone.progress}%
                            {milestone.target_date
                              ? ` • Target: ${new Date(
                                  milestone.target_date
                                ).toLocaleDateString()}`
                              : ""}
                          </p>

                          <span
                            className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-xs ${
                              milestone.faculty_review_status === "Approved"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : milestone.faculty_review_status === "Rejected"
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {milestone.faculty_review_status}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            disabled={reviewingMilestone === milestone.id}
                            onClick={() =>
                              reviewMilestone(milestone.id, "Approved")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>

                          <button
                            disabled={reviewingMilestone === milestone.id}
                            onClick={() =>
                              reviewMilestone(milestone.id, "Rejected")
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>

                      {milestone.faculty_review_comment && (
                        <p className="mt-3 border-t border-white/10 pt-3 text-sm text-slate-400">
                          {milestone.faculty_review_comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <MessageSquare size={17} />
                Faculty Feedback
              </h3>

              <textarea
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                placeholder="Write guidance, feedback, or a review comment..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
              />

              <div className="mt-3 flex items-center justify-between gap-4">
                {actionMessage ? (
                  <p className="text-sm text-slate-400">{actionMessage}</p>
                ) : (
                  <span />
                )}

                <button
                  onClick={submitFeedback}
                  disabled={savingFeedback || !feedbackText.trim()}
                  className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingFeedback ? "Saving..." : "Send Feedback"}
                </button>
              </div>
            </div>

            {selected.feedback.length > 0 && (
              <div className="mt-7">
                <h3 className="mb-3 font-semibold">Previous Feedback</h3>

                <div className="space-y-2">
                  {selected.feedback.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-sm leading-6 text-slate-300">
                        {item.feedback}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 inline-flex text-slate-300">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500">{label}</p>

      <p
        className={`mt-1 text-3xl font-bold ${
          danger ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}