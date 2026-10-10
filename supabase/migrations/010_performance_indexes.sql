-- ====================================================================
-- Migration 010: Índices de alta performance para acelerar caixinhas, contas, extrato e recorrências
-- ====================================================================

-- 1. Transações por usuário e data (acelera o extrato e o gráfico de 12 meses)
create index if not exists transactions_user_date_idx 
on public.transactions (user_id, date desc);

-- 2. Contas e cartões por usuário (acelera a listagem de contas)
create index if not exists accounts_user_created_idx 
on public.accounts (user_id, created_at);

-- 3. Transações recorrentes ativas por usuário (acelera o processamento de recorrências)
create index if not exists recurring_user_active_idx 
on public.recurring_transactions (user_id, active, start_date);

-- 4. Caixinhas de reserva por usuário
create index if not exists savings_boxes_user_created_idx 
on public.savings_boxes (user_id, created_at);

-- 5. Aportes de caixinhas por caixinha e valor (acelera a soma do saldo acumulado)
create index if not exists savings_contrib_box_amount_idx 
on public.savings_contributions (box_id, amount);

create index if not exists savings_contrib_user_idx 
on public.savings_contributions (user_id);
