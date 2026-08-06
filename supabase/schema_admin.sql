-- ===========================================================================
-- AI Photoshoot — Admin schema (trends + categories + storage)
-- Run this ONCE in the Supabase Dashboard → SQL Editor → New query → Run.
--
-- Adds: categories table, trends table, a public Storage bucket for trend
-- images, RLS policies (public read / service-role write), and seeds the
-- existing 4 categories + 6 trends so the site looks identical after the move
-- from the hardcoded lib/trends.ts into the database.
--
-- NOTE: this runs alongside the earlier schema.sql (users, transactions).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id         bigint generated always as identity primary key,
  slug       text unique not null,          -- 'female', 'male', 'any', or new
  label      text not null,                 -- 'Женские', 'Мужские'...
  sort_order int  not null default 0
);

-- ---------------------------------------------------------------------------
-- 2. Trends (replaces the hardcoded array in lib/trends.ts)
-- ---------------------------------------------------------------------------
create table if not exists public.trends (
  id               bigint generated always as identity primary key,
  slug             text unique not null,
  name             text not null,
  subtitle         text not null,
  category_id      bigint references public.categories(id) on delete set null,
  image            text not null,           -- URL (Unsplash/any) OR Storage path
  price            int  not null default 5,
  prompt           text not null,
  negative_prompt  text not null,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists trends_category_id_idx on public.trends(category_id);
create index if not exists trends_published_idx    on public.trends(is_published);

-- ---------------------------------------------------------------------------
-- 3. Row-Level Security
--    Public can READ published trends + all categories.
--    Writes happen ONLY via the service role (admin API routes), which bypass RLS.
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.trends     enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
  on public.categories for select using (true);

drop policy if exists "public read trends" on public.trends;
create policy "public read trends"
  on public.trends for select using (is_published);

-- ---------------------------------------------------------------------------
-- 4. Storage bucket for trend preview images (uploaded by the admin)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trends', 'trends', true)
on conflict (id) do nothing;

-- Public read for the trends bucket; writes are gated to authenticated users
-- (admin upload uses the service role, which bypasses these policies).
drop policy if exists "trends bucket public read" on storage.objects;
create policy "trends bucket public read"
  on storage.objects for select
  using (bucket_id = 'trends');

drop policy if exists "trends bucket auth write" on storage.objects;
create policy "trends bucket auth write"
  on storage.objects for insert
  with check (bucket_id = 'trends' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 5. Seed: categories + existing 6 trends
--    (idempotent — safe to re-run; on conflict does nothing)
-- ---------------------------------------------------------------------------
insert into public.categories (slug, label, sort_order) values
  ('all',    'Все',      0),
  ('female', 'Женские',  1),
  ('male',   'Мужские',  2),
  ('any',    'Любые',    3)
on conflict (slug) do nothing;

-- Seed trends using a CTE to resolve category_id by slug.
insert into public.trends (slug, name, subtitle, category_id, image, price, prompt, negative_prompt)
values
  ('noir-portrait', 'Noir Portrait', 'Кинематографичный чёрно-белый портрет',
   (select id from public.categories where slug = 'any'),
   'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80', 5,
   'Cinematic black and white portrait, dramatic chiaroscuro lighting, deep shadows, 85mm lens, shallow depth of field, fine film grain, high contrast, professional studio photography, ultra detailed skin texture',
   'lowres, blurry, deformed face, extra fingers, bad anatomy, watermark, text, jpeg artifacts, oversaturated'),

  ('dubai-rooftop', 'Dubai Rooftop', 'Люкс-съёмка на фоне небоскрёбов',
   (select id from public.categories where slug = 'female'),
   'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80', 5,
   'Luxury fashion portrait on a Dubai rooftop at golden hour, glittering skyscrapers and burj khalifa in the background, elegant evening outfit, warm cinematic light, shot on 50mm f/1.4, editorial magazine quality, sharp focus',
   'lowres, blurry, deformed face, distorted hands, extra limbs, watermark, text, logo, oversaturated, cartoon'),

  ('tokyo-neon', 'Tokyo Neon', 'Неоновый ночной Токио',
   (select id from public.categories where slug = 'any'),
   'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80', 5,
   'Cyberpunk portrait on a rainy Tokyo street at night, vibrant neon signs reflecting on wet pavement, bokeh lights, teal and magenta color grade, cinematic 35mm film look, ultra detailed, moody atmosphere',
   'lowres, blurry, deformed face, bad anatomy, extra fingers, watermark, text, daytime, dull colors'),

  ('old-money', 'Old Money', 'Сдержанная элегантность на вилле',
   (select id from public.categories where slug = 'male'),
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80', 5,
   'Sophisticated old money portrait, classic tailored linen suit, mediterranean villa terrace with cypress trees, soft natural daylight, timeless editorial style, shot on medium format, muted warm tones, refined and elegant',
   'lowres, blurry, deformed face, casual clothes, sportswear, text, watermark, oversaturated, modern props'),

  ('amalfi-coast', 'Amalfi Coast', 'Солнечная приморская съёмка',
   (select id from public.categories where slug = 'female'),
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', 5,
   'Sun-drenched portrait on the Amalfi coast, flowing white summer dress, turquoise sea and pastel cliffside houses behind, bright airy lighting, soft golden highlights, vacation editorial photography, 50mm lens',
   'lowres, blurry, deformed face, bad anatomy, extra fingers, watermark, text, dark lighting, indoor'),

  ('studio-mono', 'Studio Mono', 'Чистая студийная классика',
   (select id from public.categories where slug = 'any'),
   'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80', 5,
   'Clean studio portrait against a seamless grey backdrop, soft three-point lighting, neutral wardrobe, minimal styling, crisp focus on the eyes, professional headshot quality, 85mm f/1.8, balanced contrast',
   'lowres, blurry, deformed face, busy background, extra fingers, watermark, text, harsh shadows, oversaturated')
on conflict (slug) do nothing;
