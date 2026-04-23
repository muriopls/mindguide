-- profiles: one per user, auto-created on signup
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_locale text not null default 'de',
  ai_provider text not null default 'claude' check (ai_provider in ('claude', 'openai')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- user_api_keys: encrypted provider keys per user
create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('claude', 'openai')),
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.user_api_keys enable row level security;

create policy "Users can manage own API keys"
  on public.user_api_keys for all
  using (auth.uid() = user_id);
