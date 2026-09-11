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
-- ============================================================
-- ROLE SYSTEM
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  student_number text,
  department text,
  role text not null default 'student'
    check (role in ('student', 'faculty', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles
  add column if not exists student_number text;

create index if not exists profiles_role_idx
  on profiles(role);

alter table profiles enable row level security;

-- Users cannot directly change their own role.
-- Profile access is handled by trusted server-side code.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    student_number,
    role
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'student_number',
    'student'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    student_number = excluded.student_number;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- ============================================================
-- FACULTY INVITATIONS
-- ============================================================

create table if not exists faculty_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists faculty_invitations_email_idx
  on faculty_invitations(email);

create index if not exists faculty_invitations_expires_idx
  on faculty_invitations(expires_at);

alter table faculty_invitations enable row level security;


-- ============================================================
-- FACULTY PROJECT ASSIGNMENTS
-- ============================================================

create table if not exists faculty_project_assignments (
  id uuid primary key default gen_random_uuid(),

  faculty_id uuid not null
    references auth.users(id)
    on delete cascade,

  project_id uuid not null
    references projects(id)
    on delete cascade,

  assigned_by uuid
    references auth.users(id)
    on delete set null,

  assigned_at timestamptz not null default now(),

  unique (faculty_id, project_id)
);

create index if not exists faculty_assignments_faculty_idx
  on faculty_project_assignments(faculty_id);

create index if not exists faculty_assignments_project_idx
  on faculty_project_assignments(project_id);

alter table faculty_project_assignments enable row level security;

-- ============================================================
-- FACULTY FEEDBACK
-- ============================================================

create table if not exists faculty_feedback (
  id uuid primary key default gen_random_uuid(),

  faculty_id uuid not null
    references auth.users(id)
    on delete cascade,

  project_id uuid not null
    references projects(id)
    on delete cascade,

  milestone_id uuid
    references milestones(id)
    on delete cascade,

  feedback text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faculty_feedback_project_idx
  on faculty_feedback(project_id);

create index if not exists faculty_feedback_faculty_idx
  on faculty_feedback(faculty_id);

alter table faculty_feedback enable row level security;

alter table public.milestones
add column if not exists faculty_review_status text
default 'Pending'
check (
  faculty_review_status in (
    'Pending',
    'Approved',
    'Rejected'
  )
);

alter table public.milestones
add column if not exists faculty_review_comment text;

alter table public.milestones
add column if not exists reviewed_by uuid
references auth.users(id)
on delete set null;

alter table public.milestones
add column if not exists reviewed_at timestamptz;