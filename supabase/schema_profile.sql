-- ===========================================================================
-- AI Photoshoot — Generations history (for the user profile)
-- Run this ONCE in the Supabase Dashboard → SQL Editor → New query → Run.
--
-- Adds a `generations` table that records every successful image the user
-- created, so the profile page can show history + download links.
-- Runs alongside the earlier schema.sql / schema_admin.sql.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Generations — one row per successfully produced image.
-- ---------------------------------------------------------------------------
create table if not exists public.generations (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.users(id) on delete cascade,
  image        text not null,          -- /uploads/<uuid>.jpg (local URL)
  trend_slug   text,                   -- which trend/preset was used
  trend_name   text,                   -- denormalized name (preserves history if trend is deleted)
  created_at   timestamptz not null default now()
);

create index if not exists generations_user_id_idx on public.generations(user_id);
create index if not exists generations_created_at_idx on public.generations(created_at desc);

-- ---------------------------------------------------------------------------
-- 2. RLS — a user can only see & delete their own generations.
--    Writes happen via the generate route under the user's session, so the
--    default policy (own rows) is enough; no extra service-role insert needed.
-- ---------------------------------------------------------------------------
alter table public.generations enable row level security;

drop policy if exists "own generations read" on public.generations;
create policy "own generations read"
  on public.generations for select
  using (auth.uid() = user_id);

drop policy if exists "own generations insert" on public.generations;
create policy "own generations insert"
  on public.generations for insert
  with check (auth.uid() = user_id);

drop policy if exists "own generations delete" on public.generations;
create policy "own generations delete"
  on public.generations for delete
  using (auth.uid() = user_id);
