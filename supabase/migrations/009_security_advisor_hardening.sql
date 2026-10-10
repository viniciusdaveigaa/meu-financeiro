-- ====================================================================
-- Migration 009: Resolução completa dos avisos do Supabase Security Advisor
-- 1. Restringe funções SECURITY DEFINER (search_path e revoke execute)
-- 2. Restringe políticas RLS explicitamente a "TO authenticated"
-- ====================================================================

-- 1. FUNÇÕES DO BANCO
-- Fixa search_path e remove execução direta por usuários para o trigger handle_new_user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set name = coalesce(excluded.name, public.profiles.name);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- Remove funções legadas ou não utilizadas de seed caso existam
drop function if exists public.seed_default_categories();
drop function if exists public.seed_default_categories(uuid);

-- 2. POLÍTICAS RLS (TO authenticated)
-- Remove o aviso "Anonymous Sign-Ins Allowed" garantindo que somente usuários com login tenham acesso

-- transactions
alter table public.transactions enable row level security;
drop policy if exists "Users manage only their transactions" on public.transactions;
drop policy if exists "Users manage their own transactions" on public.transactions;
create policy "Users manage only their transactions"
on public.transactions for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- accounts
alter table public.accounts enable row level security;
drop policy if exists "Users manage only their accounts" on public.accounts;
create policy "Users manage only their accounts"
on public.accounts for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- budgets
alter table public.budgets enable row level security;
drop policy if exists "Users manage only their budgets" on public.budgets;
create policy "Users manage only their budgets"
on public.budgets for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- custom_categories
alter table public.custom_categories enable row level security;
drop policy if exists "Users manage only their custom categories" on public.custom_categories;
create policy "Users manage only their custom categories"
on public.custom_categories for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- profiles
alter table public.profiles enable row level security;
drop policy if exists "Users read their own profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
drop policy if exists "Users insert their own profile" on public.profiles;
drop policy if exists "Users manage only their profile" on public.profiles;
create policy "Users manage only their profile"
on public.profiles for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- recurring_transactions
alter table public.recurring_transactions enable row level security;
drop policy if exists "Users manage only their recurring transactions" on public.recurring_transactions;
create policy "Users manage only their recurring transactions"
on public.recurring_transactions for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- savings_boxes
alter table public.savings_boxes enable row level security;
drop policy if exists "Users manage only their savings boxes" on public.savings_boxes;
create policy "Users manage only their savings boxes"
on public.savings_boxes for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- savings_contributions
alter table public.savings_contributions enable row level security;
drop policy if exists "Users manage only their savings contributions" on public.savings_contributions;
create policy "Users manage only their savings contributions"
on public.savings_contributions for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

