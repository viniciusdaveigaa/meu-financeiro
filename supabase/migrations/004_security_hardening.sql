-- Endurece funcoes existentes sem alterar dados.
revoke all on function public.add_savings_contribution(uuid, numeric, date) from public;
revoke all on function public.add_savings_contribution(uuid, numeric, date) from anon;
grant execute on function public.add_savings_contribution(uuid, numeric, date) to authenticated;

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
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
