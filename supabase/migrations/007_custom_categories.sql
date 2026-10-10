-- Migration 007: Categorias Personalizadas Sincronizadas
-- Cria tabela de categorias personalizadas com suporte a ícone, cor e sincronização multi-dispositivos

create table if not exists public.custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  icon_name text not null default 'Tag',
  color text not null default '#475569',
  bg text not null default '#f1f5f9',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Ativa segurança RLS (cada usuário gerencia apenas as suas próprias categorias)
alter table public.custom_categories enable row level security;

drop policy if exists "Users manage only their custom categories" on public.custom_categories;

create policy "Users manage only their custom categories"
on public.custom_categories for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists custom_categories_user_idx on public.custom_categories (user_id);

