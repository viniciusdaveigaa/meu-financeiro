-- Caixinhas de reserva e aportes integrados aos lancamentos financeiros.
create table if not exists public.savings_boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  target_amount numeric(12,2) check (target_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.savings_boxes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.savings_boxes enable row level security;
alter table public.savings_contributions enable row level security;

drop policy if exists "Users manage only their savings boxes" on public.savings_boxes;
drop policy if exists "Users manage only their savings contributions" on public.savings_contributions;

create policy "Users manage only their savings boxes"
on public.savings_boxes for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage only their savings contributions"
on public.savings_contributions for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.add_savings_contribution(
  p_box_id uuid,
  p_amount numeric,
  p_date date default current_date
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  box_name text;
begin
  if p_amount <= 0 then
    raise exception 'O aporte deve ser maior que zero';
  end if;

  select name into box_name
  from public.savings_boxes
  where id = p_box_id and user_id = auth.uid();

  if box_name is null then
    raise exception 'Caixinha nao encontrada';
  end if;

  insert into public.savings_contributions (box_id, user_id, amount, date)
  values (p_box_id, auth.uid(), p_amount, p_date);

  insert into public.transactions (user_id, type, description, amount, category, date)
  values (auth.uid(), 'expense', 'Reserva: ' || box_name, p_amount, 'Caixinha', p_date);
end;
$$;

grant execute on function public.add_savings_contribution(uuid, numeric, date) to authenticated;

create index if not exists savings_boxes_user_idx on public.savings_boxes (user_id);
create index if not exists savings_contributions_box_idx on public.savings_contributions (box_id, date desc);
