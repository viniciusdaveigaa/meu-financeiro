-- =============================================================================
-- Migration 014: Limite de Cartão de Crédito, Status Pago/Pendente e Transferências
-- =============================================================================

-- 1. Adiciona coluna de limite de crédito na tabela accounts
alter table public.accounts
  add column if not exists credit_limit numeric(14, 2) default null;

-- 2. Adiciona colunas de status de pagamento e grupo de transferência em transactions
alter table public.transactions
  add column if not exists is_paid boolean default true,
  add column if not exists transfer_group_id uuid default null;

-- 3. Índices auxiliares para busca rápida
create index if not exists transactions_is_paid_idx on public.transactions(user_id, is_paid);
create index if not exists transactions_transfer_group_idx on public.transactions(transfer_group_id);

-- 4. Normaliza compras de cartão de crédito existentes para contabilizar no balanço do mês
update public.transactions
set affects_balance = true
where payment_method = 'credit'
  and type = 'expense'
  and affects_balance = false;
