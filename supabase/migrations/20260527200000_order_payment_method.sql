-- Payment method tracking on orders
alter table public.orders
  add column if not exists payment_method text default 'card'
    check (payment_method in ('card', 'apple_pay', 'wire_transfer'));

alter table public.orders
  add column if not exists wire_reference text;

update public.orders
set payment_method = 'card'
where payment_method is null;
