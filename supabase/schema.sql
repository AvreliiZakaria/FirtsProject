-- AI Photoshoot schema. Run in Supabase SQL Editor.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  coins_balance int not null default 0,
  total_generated int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_id_idx on public.transactions(user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, username, coins_balance)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'username', ''), 5)
  on conflict (id) do nothing;

  insert into public.transactions (user_id, delta, reason)
  select new.id, 5, 'signup_bonus'
  where not exists (
    select 1 from public.transactions
    where user_id = new.id and reason = 'signup_bonus'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own profile read/write" on public.users;
create policy "own profile read/write" on public.users
for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own transactions read" on public.transactions;
create policy "own transactions read" on public.transactions
for select using (auth.uid() = user_id);

create or replace function public.spend_coins(p_amount int, p_ref text)
returns int language plpgsql security definer set search_path = public as $$
declare ok int;
begin
  if p_amount is null or p_amount <= 0 then return 0; end if;
  update public.users
  set coins_balance = coins_balance - p_amount,
      total_generated = total_generated + 1
  where id = auth.uid() and coins_balance >= p_amount
  returning 1 into ok;
  if ok is null then return 0; end if;
  insert into public.transactions(user_id, delta, reason, ref)
  values (auth.uid(), -p_amount, 'generation', p_ref);
  return ok;
end;
$$;

a create or replace function public.add_coins(p_amount int, p_reason text, p_ref text default null)
returns int language plpgsql security definer set search_path = public as $$
declare new_balance int;
begin
  if p_amount is null or p_amount <= 0 or p_reason not in ('purchase', 'refund') then return null; end if;
  update public.users set coins_balance = coins_balance + p_amount
  where id = auth.uid() returning coins_balance into new_balance;
  if new_balance is null then return null; end if;
  insert into public.transactions(user_id, delta, reason, ref)
  values (auth.uid(), p_amount, p_reason, p_ref);
  return new_balance;
end;
$$;

grant execute on function public.spend_coins(int, text) to authenticated;
grant execute on function public.add_coins(int, text, text) to authenticated;
