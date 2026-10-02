-- Repair the deployed auth profile schema used by the AI Tutor application.
-- This migration is additive and does not remove existing application data.

alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  add column if not exists student_number text;

alter table public.profiles
  add column if not exists department text;

alter table public.profiles
  add column if not exists role text not null default 'student';

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'faculty', 'admin'));

create index if not exists profiles_role_idx
  on public.profiles(role);

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
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    student_number = coalesce(excluded.student_number, public.profiles.student_number),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
