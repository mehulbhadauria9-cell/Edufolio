-- =========================================================
-- EDUFOLIO — Initial schema, security, and realtime setup
-- =========================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type public.user_role as enum ('student', 'faculty', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.achievement_domain as enum (
    'competitive_programming', 'sports', 'cultural', 'academics', 'technical'
  );
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- ---------- students ----------
create table if not exists public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  name text not null,
  roll_no text not null unique,
  branch text not null,
  year int not null check (year between 1 and 5),
  cgpa numeric(3, 2) check (cgpa >= 0 and cgpa <= 10),
  leetcode_handle text,
  avatar_url text,
  total_points int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_total_points on public.students (total_points desc);
create index if not exists idx_students_name on public.students using gin (to_tsvector('simple', name));
create index if not exists idx_students_roll_no on public.students (roll_no);
create index if not exists idx_students_branch on public.students (branch);

-- ---------- faculty ----------
create table if not exists public.faculty (
  id uuid primary key references public.profiles (id) on delete cascade,
  name text not null,
  department text not null,
  created_at timestamptz not null default now()
);

-- ---------- achievements ----------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  domain public.achievement_domain not null,
  title text not null,
  description text,
  points int not null check (points >= 0),
  date_awarded date not null default current_date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_achievements_student on public.achievements (student_id);
create index if not exists idx_achievements_domain on public.achievements (domain);
create index if not exists idx_achievements_date on public.achievements (date_awarded desc);

-- =========================================================
-- Auto-create profile on new Auth user (defaults to 'student')
-- Privileged roles (faculty/admin) are only ever assigned by
-- the create-user Edge Function using the service role, which
-- runs AFTER auth.users insert and updates this row explicitly.
-- Client-submitted signup metadata is never trusted for role.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Keep students.total_points in sync with achievements
-- =========================================================
create or replace function public.recalc_student_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_student uuid;
begin
  affected_student := coalesce(new.student_id, old.student_id);

  update public.students
  set total_points = (
    select coalesce(sum(points), 0) from public.achievements where student_id = affected_student
  )
  where id = affected_student;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_achievement_change on public.achievements;
create trigger on_achievement_change
  after insert or update or delete on public.achievements
  for each row execute function public.recalc_student_points();

-- =========================================================
-- Helper: current user's role (avoids RLS recursion)
-- =========================================================
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- =========================================================
-- Secure role assignment RPC — admin only, never self-service.
-- =========================================================
create or replace function public.admin_set_role(target_id uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() <> 'admin' then
    raise exception 'Only admins may change roles';
  end if;
  if target_id = auth.uid() then
    raise exception 'Admins cannot change their own role';
  end if;

  update public.profiles set role = new_role where id = target_id;
end;
$$;

revoke all on function public.admin_set_role(uuid, public.user_role) from public;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;

-- =========================================================
-- Guard: students may only edit their own avatar/leetcode handle,
-- never their points, roll number, or branch — even though RLS
-- grants them row-level UPDATE access to their own record.
-- =========================================================
create or replace function public.guard_student_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() = 'student' then
    new.roll_no := old.roll_no;
    new.branch := old.branch;
    new.year := old.year;
    new.cgpa := old.cgpa;
    new.total_points := old.total_points;
  end if;
  return new;
end;
$$;

drop trigger if exists on_student_self_update on public.students;
create trigger on_student_self_update
  before update on public.students
  for each row execute function public.guard_student_self_update();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.faculty enable row level security;
alter table public.achievements enable row level security;

-- ---------- profiles policies ----------
create policy "profiles_select_self_or_staff"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() in ('faculty', 'admin'));

create policy "profiles_no_client_write"
  on public.profiles for update
  using (false);

create policy "profiles_no_client_insert"
  on public.profiles for insert
  with check (false);

-- ---------- students policies ----------
create policy "students_select_all_authenticated"
  on public.students for select
  to authenticated
  using (true);

create policy "students_update_own_allowed_fields"
  on public.students for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "students_staff_insert"
  on public.students for insert
  to authenticated
  with check (public.current_role() in ('faculty', 'admin'));

create policy "students_staff_update"
  on public.students for update
  to authenticated
  using (public.current_role() in ('faculty', 'admin'))
  with check (public.current_role() in ('faculty', 'admin'));

create policy "students_admin_delete"
  on public.students for delete
  to authenticated
  using (public.current_role() = 'admin');

-- ---------- faculty policies ----------
create policy "faculty_select_staff"
  on public.faculty for select
  to authenticated
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "faculty_admin_write"
  on public.faculty for all
  to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------- achievements policies ----------
create policy "achievements_select_authenticated"
  on public.achievements for select
  to authenticated
  using (true);

create policy "achievements_staff_insert"
  on public.achievements for insert
  to authenticated
  with check (public.current_role() in ('faculty', 'admin') and created_by = auth.uid());

create policy "achievements_staff_update"
  on public.achievements for update
  to authenticated
  using (public.current_role() in ('faculty', 'admin'))
  with check (public.current_role() in ('faculty', 'admin'));

create policy "achievements_admin_delete"
  on public.achievements for delete
  to authenticated
  using (public.current_role() = 'admin');

-- =========================================================
-- Storage: avatars bucket, owner-only write, public read
-- =========================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- Realtime
-- =========================================================
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.achievements;
