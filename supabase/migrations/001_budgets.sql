-- Execute somente esta migration no SQL Editor para atualizar um banco ja existente.
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
