"use client";

import { useState } from "react";
import {
  Brain,
  BookOpen,
  ChevronDown,
  Loader2,
  ShieldAlert,
  Target,
  Wrench,
  Zap,
} from "lucide-react";

type Result = {
  title: string;
  data: any;
};

const analyses = [
  {
    key: "predict",
    title: "Outcome Predictor",
    endpoint: "/api/ai/predict",
    icon: Target,
  },
  {
    key: "dna",
    title: "Project DNA",
    endpoint: "/api/ai/dna",
    icon: Brain,
  },
  {
    key: "dependencies",
    title: "Hidden Dependencies",
    endpoint: "/api/ai/dependencies",
    icon: ShieldAlert,
  },
  {
    key: "scope",
    title: "Scope Drift",
    endpoint: "/api/ai/scope-drift",
    icon: Target,
  },
  {
    key: "authenticity",
    title: "Progress Authenticity",
    endpoint: "/api/ai/authenticity",
    icon: ShieldAlert,
  },
  {
    key: "debate",
    title: "Multi-Agent Debate",
    endpoint: "/api/ai/debate",
    icon: Brain,
  },
  {
    key: "recovery",
    title: "Recovery Mode",
    endpoint: "/api/ai/recovery",
    icon: Zap,
  },
  {
    key: "micro-learning",
    title: "Personalized Micro-Learning",
    endpoint: "/api/ai/micro-learning",
    icon: BookOpen,
  },
];

export default function ProjectIntelligence({
  projectId,
}: {
  projectId: string;
}) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function runAnalysis(
    key: string,
    title: string,
    endpoint: string
  ) {
    setLoading(key);
    setOpen(key);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Analysis failed."
        );
      }

      setResults((current) => ({
        ...current,
        [key]: {
          title,
          data,
        },
      }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [key]: {
          title,
          data: {
            error:
              error instanceof Error
                ? error.message
                : "Unable to run analysis.",
          },
        },
      }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <section
      className="card fade-up"
      style={{
        padding: 24,
        marginTop: 20,
      }}
    >
      <div className="section-row">
        <div>
          <span className="hero-kicker">
            <Brain size={13} /> AI PROJECT INTELLIGENCE
          </span>

          <h2 style={{ marginBottom: 4 }}>
            Project analysis
          </h2>

          <p
            className="muted small"
            style={{ margin: 0 }}
          >
            Understand risks, progress, feasibility,
            recovery needs and learning opportunities.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 18,
        }}
      >
        {analyses.map((analysis) => {
          const Icon = analysis.icon;
          const isOpen = open === analysis.key;
          const isLoading =
            loading === analysis.key;
          const result = results[analysis.key];

          return (
            <div
              key={analysis.key}
              style={{
                border:
                  "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  result
                    ? setOpen(
                        isOpen
                          ? null
                          : analysis.key
                      )
                    : runAnalysis(
                        analysis.key,
                        analysis.title,
                        analysis.endpoint
                      )
                }
                style={{
                  width: "100%",
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  padding: 15,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span className="stat-icon">
                  <Icon size={17} />
                </span>

                <span style={{ flex: 1 }}>
                  <strong
                    style={{
                      display: "block",
                    }}
                  >
                    {analysis.title}
                  </strong>

                  <small className="muted">
                    {result
                      ? "View analysis"
                      : "Run analysis"}
                  </small>
                </span>

                {isLoading ? (
                  <Loader2
                    size={16}
                    className="spin"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  />
                )}
              </button>

              {isOpen && result && (
                <div
                  style={{
                    borderTop:
                      "1px solid var(--border)",
                    padding: 15,
                    fontSize: 13,
                  }}
                >
                  {result.data.error ? (
                    <p style={{ margin: 0 }}>
                      {result.data.error}
                    </p>
                  ) : (
                    <AnalysisView
                      data={result.data}
                    />
                  )}

                  <button
                    type="button"
                    className="btn"
                    style={{
                      marginTop: 12,
                    }}
                    onClick={() =>
                      runAnalysis(
                        analysis.key,
                        analysis.title,
                        analysis.endpoint
                      )
                    }
                  >
                    Run again
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FEATURE FEASIBILITY */}
      <FeatureFeasibility
        projectId={projectId}
        runAnalysis={runAnalysis}
      />
    </section>
  );
}

function FeatureFeasibility({
  projectId,
  runAnalysis,
}: {
  projectId: string;
  runAnalysis: (
    key: string,
    title: string,
    endpoint: string
  ) => void;
}) {
  const [feature, setFeature] = useState("");

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 20,
        borderTop:
          "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span className="stat-icon">
          <Wrench size={17} />
        </span>

        <div>
          <strong>
            Feature Feasibility Checker
          </strong>

          <div className="muted small">
            Check whether a new feature fits your
            project.
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <input
          value={feature}
          onChange={(event) =>
            setFeature(event.target.value)
          }
          placeholder="Example: Add real-time chat"
          style={{
            flex: 1,
            minWidth: 220,
            padding: "10px 12px",
            borderRadius: 10,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
            color: "inherit",
          }}
        />

        <button
          type="button"
          className="btn btn-primary"
          disabled={!feature.trim()}
          onClick={async () => {
            try {
              const response = await fetch(
                "/api/ai/feasibility",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    projectId,
                    feature,
                  }),
                }
              );

              const data =
                await response.json();

              if (!response.ok) {
                throw new Error(
                  data.error ||
                    "Unable to check feature."
                );
              }

              window.alert(
                JSON.stringify(
                  data.analysis,
                  null,
                  2
                )
              );
            } catch (error) {
              window.alert(
                error instanceof Error
                  ? error.message
                  : "Unable to check feature."
              );
            }
          }}
        >
          Check Feature
        </button>
      </div>
    </div>
  );
}

function AnalysisView({
  data,
}: {
  data: any;
}) {
  const analysis =
    data.analysis || data;

  const entries = Object.entries(
    analysis
  )
    .filter(
      ([key]) =>
        !["projectId"].includes(key)
    )
    .slice(0, 12);

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
      }}
    >
      {entries.map(([key, value]) => (
        <div key={key}>
          <strong>
            {key
              .replace(
                /([A-Z])/g,
                " $1"
              )
              .replace(
                /^./,
                (char) =>
                  char.toUpperCase()
              )}
            :
          </strong>{" "}
          <span className="muted">
            {typeof value ===
            "object"
              ? JSON.stringify(
                  value,
                  null,
                  2
                )
              : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}