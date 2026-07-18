-- Execute este arquivo no SQL Editor do seu projeto Supabase.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  description text not null check (char_length(description) between 1 and 120),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users manage only their transactions"
on public.transactions for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- Execute esta secao tambem para ativar orcamentos mensais.
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, month, category)
);

alter table public.budgets enable row level security;

create policy "Users manage only their budgets"
on public.budgets for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists budgets_user_month_idx on public.budgets (user_id, month);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read their own profile"
on public.profiles
for select
using ((select auth.uid()) = id);

create policy "Users update their own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
