-- Migration 008: Tabela de perfis e configurações de usuário
-- Permite leitura, inserção e atualização do próprio perfil com RLS

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Remove políticas antigas se existirem
drop policy if exists "Users read their own profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
drop policy if exists "Users insert their own profile" on public.profiles;
drop policy if exists "Users manage only their profile" on public.profiles;

-- Política abrangente para o usuário gerenciar o próprio registro de perfil
create policy "Users manage only their profile"
on public.profiles for all
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Trigger automático para novos usuários inserirem o perfil a partir do metadata
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

-- Registra o trigger se não existir
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

