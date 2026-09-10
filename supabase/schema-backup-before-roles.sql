create extension if not exists pgcrypto;

create table if not exists projects (id uuid primary key default gen_random_uuid(), user_id text not null, title text not null, description text, project_type text, technology text, goal text, status text not null default 'Planning', progress integer not null default 0 check (progress between 0 and 100), start_date date default current_date, deadline date, created_at timestamptz not null default now());
create table if not exists tasks (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade, title text not null, description text, status text not null default 'Pending', priority text not null default 'Medium', due_date date, created_at timestamptz not null default now());
create table if not exists milestones (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade, title text not null, description text, status text not null default 'Upcoming', progress integer not null default 0 check (progress between 0 and 100), target_date date, created_at timestamptz not null default now());
create table if not exists project_insights (id uuid primary key default gen_random_uuid(), project_id uuid not null unique references projects(id) on delete cascade, insights jsonb not null default '{}'::jsonb, generated_at timestamptz not null default now());
create table if not exists project_events (id uuid primary key default gen_random_uuid(), project_id uuid references projects(id) on delete cascade, user_id text not null, event_type text not null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

create index if not exists projects_user_idx on projects(user_id);
create index if not exists tasks_project_idx on tasks(project_id);
create index if not exists milestones_project_idx on milestones(project_id);
create index if not exists project_events_project_idx on project_events(project_id);

alter table projects enable row level security;
alter table tasks enable row level security;
alter table milestones enable row level security;
alter table project_insights enable row level security;
alter table project_events enable row level security;

-- The web app uses authenticated server-side Supabase access with the service role.
-- RLS remains enabled so public/anon clients cannot directly read or mutate project data.
