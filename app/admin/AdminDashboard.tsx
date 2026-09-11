"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

type Person = {
  id: string;
  full_name: string | null;
  student_number?: string | null;
  department: string | null;
  role: string;
};

type Project = {
  id: string;
  user_id: string;
  title: string;
  project_type: string | null;
  technology: string | null;
  status: string;
  progress: number;
  deadline: string | null;
};

type Assignment = {
  id: string;
  faculty_id: string;
  project_id: string;
  assigned_at: string;
};

export default function AdminPage() {
  const [students, setStudents] = useState<Person[]>([]);
  const [faculty, setFaculty] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [facultyId, setFacultyId] = useState("");
  const [projectId, setProjectId] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/management", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load admin dashboard."
        );
      }

      setStudents(data.students || []);
      setFaculty(data.faculty || []);
      setProjects(data.projects || []);
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const facultyMap = useMemo(
    () => new Map(faculty.map((person) => [person.id, person])),
    [faculty]
  );

  const studentMap = useMemo(
    () => new Map(students.map((person) => [person.id, person])),
    [students]
  );

  async function assignFaculty() {
    if (!facultyId || !projectId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to assign faculty."
        );
      }

      setMessage("Faculty member assigned successfully.");
      setFacultyId("");
      setProjectId("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to assign faculty."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(assignmentId: string) {
    if (!confirm("Remove this faculty assignment?")) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/assignments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to remove assignment."
        );
      }

      setMessage("Assignment removed.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-400">
              ADMINISTRATION
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage students, faculty, projects, and faculty assignments.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users size={19} />}
            label="Students"
            value={students.length}
          />

          <StatCard
            icon={<UserCog size={19} />}
            label="Faculty"
            value={faculty.length}
          />

          <StatCard
            icon={<ClipboardList size={19} />}
            label="Projects"
            value={projects.length}
          />

          <StatCard
            icon={<ShieldCheck size={19} />}
            label="Assignments"
            value={assignments.length}
          />
        </section>

        {/* Messages */}
        {error && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Assignment */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Assign Faculty to Project
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Select a faculty member and a student project.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={facultyId}
              onChange={(event) => setFacultyId(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0d1320] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Select faculty</option>

              {faculty.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || "Faculty Member"}
                  {person.department
                    ? ` — ${person.department}`
                    : ""}
                </option>
              ))}
            </select>

            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0d1320] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Select project</option>

              {projects.map((project) => {
                const student = studentMap.get(project.user_id);

                return (
                  <option key={project.id} value={project.id}>
                    {project.title} —{" "}
                    {student?.full_name || "Student"}
                  </option>
                );
              })}
            </select>

            <button
              onClick={assignFaculty}
              disabled={saving || !facultyId || !projectId}
              className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Assign"}
            </button>
          </div>
        </section>

        {/* Assignments */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-lg font-semibold">
              Current Faculty Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Manage who supervises each project.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
              <RefreshCw size={17} className="mr-3 animate-spin" />
              Loading...
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500">
              No faculty assignments yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {assignments.map((assignment) => {
                const project = projectMap.get(assignment.project_id);
                const facultyMember = facultyMap.get(
                  assignment.faculty_id
                );
                const student = project
                  ? studentMap.get(project.user_id)
                  : undefined;

                return (
                  <div
                    key={assignment.id}
                    className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {project?.title || "Unknown Project"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                        <span>
                          Faculty:{" "}
                          {facultyMember?.full_name ||
                            "Unknown Faculty"}
                        </span>

                        <span>
                          Student:{" "}
                          {student?.full_name || "Unknown Student"}
                        </span>

                        {student?.student_number && (
                          <span>{student.student_number}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {project && (
                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-slate-500">
                            Progress
                          </p>
                          <p className="text-sm font-semibold">
                            {project.progress}%
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          removeAssignment(assignment.id)
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300">
        {icon}
      </div>

      <p className="mt-5 text-sm text-slate-500">{label}</p>

      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}