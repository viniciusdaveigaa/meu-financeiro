-- Execute esta migration no SQL Editor depois da 001_budgets.sql.
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('account', 'card')),
  created_at timestamptz not null default now()
);

alter table public.transactions add column if not exists account_id uuid references public.accounts(id) on delete set null;
alter table public.transactions add column if not exists installment_group_id uuid;
alter table public.transactions add column if not exists installment_number integer;
alter table public.transactions add column if not exists installment_total integer;

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  start_date date not null,
  last_generated_month date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.recurring_transactions enable row level security;

drop policy if exists "Users manage only their accounts" on public.accounts;
drop policy if exists "Users manage only their recurring transactions" on public.recurring_transactions;

create policy "Users manage only their accounts" on public.accounts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage only their recurring transactions" on public.recurring_transactions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists accounts_user_idx on public.accounts (user_id);
create index if not exists recurring_transactions_user_idx on public.recurring_transactions (user_id, active);
