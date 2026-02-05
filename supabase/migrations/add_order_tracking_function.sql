-- Public order tracking by order_number: returns only status and display info (no PII).
-- Callable by anon so the Track Order page can look up status without auth.
create or replace function get_order_tracking(order_num text)
returns table (
  order_number text,
  status text,
  summary text,
  total numeric,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select o.order_number, o.status, o.summary, o.total, o.created_at
  from orders o
  where o.order_number is not null
    and upper(trim(o.order_number)) = upper(trim(order_num))
  limit 1;
$$;

grant execute on function get_order_tracking(text) to anon;
grant execute on function get_order_tracking(text) to authenticated;
