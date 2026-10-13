-- Migration 013: Ampliação do limite de caracteres do campo description na tabela transactions
-- Permite descrições de lançamentos mais detalhadas (como transferências Pix completas)
-- sem causar violação de restrição check (transactions_description_check).

alter table public.transactions 
  drop constraint if exists transactions_description_check;

alter table public.transactions 
  add constraint transactions_description_check 
  check (char_length(trim(description)) between 1 and 255);

