import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const GITHUB_REPO_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?$/i;

type GitHubRepo = {
  owner: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  private: boolean;
  pushedAt: string | null;
};

function parseRepoUrl(value: string) {
  const match = GITHUB_REPO_PATTERN.exec(value.trim());
  if (!match) return null;
  return { owner: match[1], name: match[2].replace(/\.git$/i, "") };
}

async function readGitHubRepo(owner: string, name: string): Promise<GitHubRepo> {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "AI-Guided-Project-Platform",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("GitHub repository was not found or is private.");
    if (response.status === 403) throw new Error("GitHub API rate limit reached. Try again later.");
    throw new Error(`GitHub returned ${response.status}.`);
  }

  const repo = await response.json();

  return {
    owner,
    name,
    url: repo.html_url,
    description: repo.description ?? null,
    language: repo.language ?? null,
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: repo.open_issues_count ?? 0,
    private: Boolean(repo.private),
    pushedAt: repo.pushed_at ?? null,
  };
}

async function getOwnedProject(projectId: string, userId: string) {
  const { data, error } = await db()
    .from("projects")
    .select("id,title")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStudent();
    const userId = await requireUser();
    const { id } = await params;
    const project = await getOwnedProject(id, userId);

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const { data: event, error } = await db()
      .from("project_events")
      .select("event_type,payload,created_at")
      .eq("project_id", id)
      .eq("user_id", userId)
      .in("event_type", ["github_connected", "github_disconnected"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!event || event.event_type === "github_disconnected") {
      return NextResponse.json({ connected: false });
    }

    const payload = (event.payload ?? {}) as { owner?: string; name?: string; url?: string };
    if (!payload.owner || !payload.name) {
      return NextResponse.json({ connected: false });
    }

    try {
      const repo = await readGitHubRepo(payload.owner, payload.name);
      return NextResponse.json({ connected: true, repo, connectedAt: event.created_at });
    } catch (error) {
      return NextResponse.json({
        connected: true,
        repo: {
          owner: payload.owner,
          name: payload.name,
          url: payload.url ?? `https://github.com/${payload.owner}/${payload.name}`,
        },
        stale: true,
        warning: error instanceof Error ? error.message : "Live GitHub data is unavailable.",
        connectedAt: event.created_at,
      });
    }
  } catch (error) {
    console.error("GitHub integration GET error:", error);
    return NextResponse.json({ error: "Unable to load GitHub connection." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStudent();
    const userId = await requireUser();
    const { id } = await params;
    const project = await getOwnedProject(id, userId);

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const body = await request.json().catch(() => null);
    const parsed = typeof body?.url === "string" ? parseRepoUrl(body.url) : null;

    if (!parsed) {
      return NextResponse.json(
        { error: "Enter a valid public GitHub repository URL, for example https://github.com/owner/repository." },
        { status: 400 }
      );
    }

    const repo = await readGitHubRepo(parsed.owner, parsed.name);

    if (repo.private) {
      return NextResponse.json(
        { error: "Private repositories require GitHub OAuth and are not connected by URL-only mode." },
        { status: 400 }
      );
    }

    const { error } = await db().from("project_events").insert({
      project_id: id,
      user_id: userId,
      event_type: "github_connected",
      payload: {
        owner: repo.owner,
        name: repo.name,
        url: repo.url,
        defaultBranch: repo.defaultBranch,
        connectedVia: "public-repository-url",
      },
    });

    if (error) throw error;

    return NextResponse.json({ connected: true, repo }, { status: 201 });
  } catch (error) {
    console.error("GitHub integration POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to connect GitHub repository." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStudent();
    const userId = await requireUser();
    const { id } = await params;
    const project = await getOwnedProject(id, userId);

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const { error } = await db().from("project_events").insert({
      project_id: id,
      user_id: userId,
      event_type: "github_disconnected",
      payload: {},
    });

    if (error) throw error;

    return NextResponse.json({ connected: false });
  } catch (error) {
    console.error("GitHub integration DELETE error:", error);
    return NextResponse.json({ error: "Unable to disconnect GitHub repository." }, { status: 500 });
  }
}
