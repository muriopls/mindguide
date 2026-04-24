-- ─────────────────────────────────────────────────────────────
-- Phase: Parental Controls
-- Adds account types, chat persistence, misuse detection
-- ─────────────────────────────────────────────────────────────

-- 1. Extend profiles with account_type and parent linkage
alter table public.profiles
  add column account_type text not null default 'standalone'
    check (account_type in ('standalone', 'parent', 'child')),
  add column parent_id uuid references public.profiles(id) on delete set null;

create index profiles_parent_id_idx on public.profiles(parent_id)
  where parent_id is not null;

-- 2. conversations
create table public.conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text,
  provider      text not null check (provider in ('claude', 'openai')),
  locale        text not null check (locale in ('de', 'en')),
  created_at    timestamptz not null default now(),
  ended_at      timestamptz,
  message_count int not null default 0
);

alter table public.conversations enable row level security;
create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_created_at_idx on public.conversations(user_id, created_at desc);

-- 3. messages
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;
create index messages_conversation_id_idx on public.messages(conversation_id, created_at asc);

-- 4. misuse_flags
create table public.misuse_flags (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  child_id        uuid not null references public.profiles(id) on delete cascade,
  parent_id       uuid not null references public.profiles(id) on delete cascade,
  reason          text not null,
  severity        text not null check (severity in ('low', 'medium', 'high')),
  reviewed        boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (conversation_id)
);

alter table public.misuse_flags enable row level security;
create index misuse_flags_parent_id_idx on public.misuse_flags(parent_id, reviewed, created_at desc);
create index misuse_flags_child_id_idx on public.misuse_flags(child_id);

-- 5. Helper functions for RLS policies
create or replace function public.get_parent_id(uid uuid)
returns uuid
language sql
security definer
stable
as $$
  select parent_id from public.profiles where id = uid;
$$;

create or replace function public.is_parent_of(parent_uid uuid, child_uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = child_uid and parent_id = parent_uid
  );
$$;

-- 6. RLS policies — profiles (additions)
create policy "Parent reads child profiles"
  on public.profiles for select
  using (parent_id = auth.uid());

create policy "Parent updates child profiles"
  on public.profiles for update
  using (parent_id = auth.uid());

-- 7. RLS policies — user_api_keys (addition)
create policy "Child reads parent API key"
  on public.user_api_keys for select
  using (user_id = public.get_parent_id(auth.uid()));

-- 8. RLS policies — conversations
create policy "Users manage own conversations"
  on public.conversations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Parent reads child conversations"
  on public.conversations for select
  using (public.is_parent_of(auth.uid(), user_id));

-- 9. RLS policies — messages
create policy "Users manage own messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Parent reads child messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.is_parent_of(auth.uid(), c.user_id)
    )
  );

-- 10. RLS policies — misuse_flags
-- INSERT is intentionally not granted to any regular user (service role only)
create policy "Parent reads own child flags"
  on public.misuse_flags for select
  using (parent_id = auth.uid());

create policy "Parent marks flag reviewed"
  on public.misuse_flags for update
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

-- Atomic message counter (avoids race condition from read-then-update)
create or replace function public.increment_message_count(conv_id uuid)
returns void language sql security definer as $$
  update public.conversations
  set message_count = message_count + 1
  where id = conv_id;
$$;
