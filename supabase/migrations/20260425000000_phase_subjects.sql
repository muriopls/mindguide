-- ─────────────────────────────────────────────────────────────
-- Phase 5: Subjects & Learning Companion
-- Adds student subject assignments and subject context on conversations
-- ─────────────────────────────────────────────────────────────

-- 1. Subject assignments per student
create table public.student_subjects (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  subject_slug text not null,
  created_at   timestamptz not null default now(),
  unique (student_id, subject_slug)
);

alter table public.student_subjects enable row level security;

create index student_subjects_student_id_idx on public.student_subjects(student_id);

-- 2. Add subject context to conversations
alter table public.conversations
  add column subject_slug text;

create index conversations_subject_idx on public.conversations(user_id, subject_slug)
  where subject_slug is not null;

-- 3. RLS: students manage their own subject assignments
create policy "Students manage own subjects" on public.student_subjects for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- 4. RLS: parent reads child subject assignments
create policy "Parent reads child subjects" on public.student_subjects for select
  using (public.is_parent_of(auth.uid(), student_id));

-- 5. RLS: parent manages child subject assignments
create policy "Parent manages child subjects" on public.student_subjects
  for insert with check (public.is_parent_of(auth.uid(), student_id));

create policy "Parent deletes child subjects" on public.student_subjects
  for delete using (public.is_parent_of(auth.uid(), student_id));
