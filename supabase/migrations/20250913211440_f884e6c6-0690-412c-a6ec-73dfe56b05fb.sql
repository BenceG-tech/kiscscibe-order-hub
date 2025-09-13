-- Fix function search path security issue
create or replace function gen_order_code()
returns text language plpgsql 
security definer
set search_path = public
as $$
declare
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  prefix text := substring(letters, (floor(random()*26)+1)::int, 1);
begin
  return prefix || to_char((extract(epoch from now())::bigint % 100000)::int, 'FM00000');
end $$;