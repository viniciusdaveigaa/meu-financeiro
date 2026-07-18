-- Permite guardar dinheiro em uma caixinha sem obrigatoriamente registrar uma saida.
create or replace function public.add_savings_contribution_v2(
  p_box_id uuid,
  p_amount numeric,
  p_date date default current_date,
  p_count_as_expense boolean default true
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
  where id = p_box_id
    and user_id = auth.uid();

  if box_name is null then
    raise exception 'Caixinha nao encontrada';
  end if;

  insert into public.savings_contributions (
    box_id,
    user_id,
    amount,
    date
  ) values (
    p_box_id,
    auth.uid(),
    p_amount,
    p_date
  );

  if p_count_as_expense then
    insert into public.transactions (
      user_id,
      type,
      description,
      amount,
      category,
      date
    ) values (
      auth.uid(),
      'expense',
      'Reserva: ' || box_name,
      p_amount,
      'Caixinha',
      p_date
    );
  end if;
end;
$$;

revoke all on function public.add_savings_contribution_v2(uuid, numeric, date, boolean) from public;
revoke all on function public.add_savings_contribution_v2(uuid, numeric, date, boolean) from anon;
grant execute on function public.add_savings_contribution_v2(uuid, numeric, date, boolean) to authenticated;
