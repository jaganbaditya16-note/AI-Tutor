"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock3,
  Loader2,
  Target,
  Zap,
} from "lucide-react";
import AppShell from "@/app/components/AppShell";
import { createClient } from "@/lib/supabase/browser";

type Lesson = {
  title: string;
  reason: string;
  objective: string;
  mission: string;
  estimatedMinutes: number;
  priority: "High" | "Medium" | "Low";
};

export default function MicroLearningPage() {
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Please sign in to continue.");
          setLoading(false);
          return;
        }

        const { data: projects, error: projectError } =
          await supabase
            .from("projects")
            .select("id, title")
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            })
            .limit(1);

        if (projectError) {
          throw new Error(
            "Unable to load your project."
          );
        }

        const project = projects?.[0];

        if (!project) {
          setError(
            "Create a project first to receive personalized learning."
          );
          setLoading(false);
          return;
        }

        setProjectId(project.id);
        setProjectTitle(project.title);

        const response = await fetch(
          "/api/ai/micro-learning",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: project.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to generate learning."
          );
        }

        setLessons(
          data.learning?.lessons || []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load personalized learning."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, []);

  async function refreshLessons() {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/ai/micro-learning",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to refresh lessons."
        );
      }

      setLessons(
        data.learning?.lessons || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh lessons."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Personalized Micro-Learning"
      subtitle="Short project-specific lessons designed around what you are building."
    >
      <section
        className="card fade-up"
        style={{
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div className="section-row">
          <div>
            <span className="hero-kicker">
              <BookOpen size={13} /> PROJECT LEARNING
            </span>

            <h2 style={{ margin: "6px 0 4px" }}>
              Learn what your project needs
            </h2>

            <p className="muted small">
              Personalized learning based on your
              project, technology, progress and
              unfinished work.
            </p>
          </div>

          <button
            className="btn"
            onClick={refreshLessons}
            disabled={loading || !projectId}
          >
            {loading ? (
              <Loader2 size={14} />
            ) : (
              <Zap size={14} />
            )}
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <section
          className="card"
          style={{
            padding: 20,
            marginBottom: 20,
          }}
        >
          <strong>{error}</strong>
        </section>
      )}

      {!error && projectTitle && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 20,
          }}
        >
          <span className="muted small">
            CURRENT PROJECT
          </span>

          <strong
            style={{
              display: "block",
              marginTop: 5,
            }}
          >
            {projectTitle}
          </strong>
        </div>
      )}

      {loading && !lessons.length ? (
        <section
          className="card"
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          <Loader2
            size={24}
            className="spin"
          />

          <p className="muted">
            Creating your learning path...
          </p>
        </section>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {lessons.map((lesson, index) => (
            <LessonCard
              key={`${lesson.title}-${index}`}
              lesson={lesson}
              index={index}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function LessonCard({
  lesson,
  index,
}: {
  lesson: Lesson;
  index: number;
}) {
  return (
    <article
      className="card fade-up"
      style={{
        padding: 22,
      }}
    >
      <div className="section-row">
        <div
          className="avatar"
          style={{
            flexShrink: 0,
          }}
        >
          <BookOpen size={17} />
        </div>

        <span className="badge">
          {lesson.priority}
        </span>
      </div>

      <span
        className="hero-kicker"
        style={{
          display: "block",
          marginTop: 18,
        }}
      >
        LESSON {index + 1}
      </span>

      <h3
        style={{
          margin: "6px 0 8px",
        }}
      >
        {lesson.title}
      </h3>

      <p
        className="muted"
        style={{
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {lesson.reason}
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          <Target size={14} />

          <strong
            style={{
              fontSize: 13,
            }}
          >
            Learning objective
          </strong>
        </div>

        <p
          className="muted small"
          style={{
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {lesson.objective}
        </p>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          <Zap size={14} />

          <strong
            style={{
              fontSize: 13,
            }}
          >
            Mini mission
          </strong>
        </div>

        <p
          className="small"
          style={{
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {lesson.mission}
        </p>
      </div>

      <div
        className="muted small"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 14,
        }}
      >
        <Clock3 size={13} />
        About {lesson.estimatedMinutes} minutes
      </div>
    </article>
  );
}