-- Migration 011: Retirada de Caixinhas, Controle de Cartões de Crédito/Débito e Faturas, e Preferências de Tema
-- Preserva 100% dos dados existentes com valores padrão seguros e políticas RLS intactas.

-- 1. Melhorias na tabela de Contas e Cartões (Crédito vs Débito e Datas de Fatura)
alter table public.accounts 
add column if not exists card_type text check (card_type in ('credit', 'debit')) default 'credit';

alter table public.accounts 
add column if not exists closing_day integer check (closing_day between 1 and 31);

alter table public.accounts 
add column if not exists due_day integer check (due_day between 1 and 31);

-- 2. Melhorias na tabela de Transações (Visibilidade no Extrato e Associação com Faturas)
alter table public.transactions 
add column if not exists show_in_statement boolean not null default true;

alter table public.transactions 
add column if not exists invoice_month text; -- Formato 'YYYY-MM' da fatura

alter table public.transactions 
add column if not exists is_invoice_payment boolean not null default false;

alter table public.transactions 
add column if not exists payment_method text check (payment_method in ('debit', 'credit', 'pix', 'money', 'transfer', 'other'));

-- Índice de performance para transações por fatura e visibilidade
create index if not exists transactions_invoice_idx on public.transactions (account_id, invoice_month);
create index if not exists transactions_statement_vis_idx on public.transactions (user_id, show_in_statement);

-- 3. Suporte a Retiradas nas Caixinhas de Reserva
alter table public.savings_contributions 
add column if not exists type text not null default 'deposit' check (type in ('deposit', 'withdrawal'));

-- RPC para Resgate/Retirada Segura de Caixinha com verificação atômica de saldo
create or replace function public.withdraw_savings_v2(
  p_box_id uuid,
  p_amount numeric,
  p_date date default current_date,
  p_show_in_statement boolean default true,
  p_account_id uuid default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  box_name text;
  current_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'O valor de resgate deve ser maior que zero';
  end if;

  select name into box_name
  from public.savings_boxes
  where id = p_box_id and user_id = auth.uid();

  if box_name is null then
    raise exception 'Caixinha não encontrada';
  end if;

  -- Calcula o saldo disponível somando aportes e subtraindo retiradas
  select coalesce(sum(case when type = 'withdrawal' then -amount else amount end), 0)
  into current_balance
  from public.savings_contributions
  where box_id = p_box_id and user_id = auth.uid();

  if p_amount > current_balance then
    raise exception 'Valor de resgate (R$ %) é superior ao saldo disponível na caixinha (R$ %)', p_amount, current_balance;
  end if;

  -- 1. Registra o resgate no histórico da caixinha
  insert into public.savings_contributions (
    box_id,
    user_id,
    amount,
    date,
    type
  ) values (
    p_box_id,
    auth.uid(),
    p_amount,
    p_date,
    'withdrawal'
  );

  -- 2. Registra a movimentação no extrato financeiro (entrada de saldo devolvida à conta)
  insert into public.transactions (
    user_id,
    type,
    description,
    amount,
    affects_balance,
    show_in_statement,
    category,
    date,
    account_id
  ) values (
    auth.uid(),
    'income',
    'Resgate: ' || box_name,
    p_amount,
    true,
    p_show_in_statement,
    'Caixinha',
    p_date,
    p_account_id
  );
end;
$$;

revoke all on function public.withdraw_savings_v2(uuid, numeric, date, boolean, uuid) from public;
revoke all on function public.withdraw_savings_v2(uuid, numeric, date, boolean, uuid) from anon;
grant execute on function public.withdraw_savings_v2(uuid, numeric, date, boolean, uuid) to authenticated;

-- 4. Preferências de Tema e Cores no Perfil do Usuário
alter table public.profiles
add column if not exists theme_preferences jsonb;

