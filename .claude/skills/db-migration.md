# Skill: Datenbank-Migration (Supabase)

Erstelle und verwalte Supabase-Datenbankmigrationen für MindGuide.

## Migration-Datei erstellen
```bash
# Dateiname: YYYYMMDDHHMMSS_beschreibung.sql
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_<name>.sql
```

## Migrations-Vorlage
Jede Migration muss beinhalten:
1. Tabellen-Definition
2. RLS aktivieren
3. RLS-Policies (CRUD separat)
4. Indexes für häufige Queries

```sql
-- Migration: YYYYMMDDHHMMSS_create_example.sql

-- Tabelle
create table if not exists public.example (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS immer aktivieren
alter table public.example enable row level security;

-- Policies
create policy "Users can view own records"
  on public.example for select
  using (auth.uid() = user_id);

create policy "Users can create own records"
  on public.example for insert
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on public.example for update
  using (auth.uid() = user_id);

create policy "Users can delete own records"
  on public.example for delete
  using (auth.uid() = user_id);

-- Index
create index on public.example(user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at
  before update on public.example
  for each row execute function update_updated_at();
```

## Migration anwenden (lokal)
```bash
supabase db push         # auf lokale Supabase Instanz
supabase db push --local # explizit lokal
```

## Regeln
- **IMMER RLS aktivieren** — nie eine Tabelle ohne Row Level Security
- **IMMER Policies** für alle 4 CRUD-Operationen
- Migrations sind **irreversibel** — gut überlegen bevor man pusht
- user_id immer als Foreign Key auf `auth.users(id)`
- `on delete cascade` für user-owned Daten
