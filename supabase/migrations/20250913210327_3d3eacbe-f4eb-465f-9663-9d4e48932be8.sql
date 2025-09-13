-- ===== Alap táblák =====
create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort int not null default 0,
  created_at timestamptz default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text,
  price_huf int not null,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  allergens text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_menu_items_active on menu_items(is_active);

create table if not exists item_modifiers (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references menu_items(id) on delete cascade,
  name text not null,
  type text not null check (type in ('choice','addon')),
  required boolean not null default false,
  sort int not null default 0
);

create table if not exists item_modifier_options (
  id uuid primary key default gen_random_uuid(),
  modifier_id uuid references item_modifiers(id) on delete cascade,
  label text not null,
  price_delta_huf int not null default 0,
  is_default boolean not null default false,
  sort int not null default 0
);

-- Napi/hetimenü
create table if not exists daily_offers (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  note text,
  price_huf int,
  created_at timestamptz default now(),
  unique(date)
);

create table if not exists daily_offer_items (
  id uuid primary key default gen_random_uuid(),
  daily_offer_id uuid references daily_offers(id) on delete cascade,
  item_id uuid references menu_items(id) on delete cascade
);

-- Rendelések
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  created_at timestamptz not null default now(),
  pickup_time timestamptz,
  name text not null,
  phone text not null,
  notes text,
  total_huf int not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash','pos','card_online')),
  status text not null default 'new' check (status in ('new','prepping','ready','completed','cancelled'))
);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_status on orders(status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_id uuid references menu_items(id),
  name_snapshot text not null,            -- név pillanatfelvétel
  unit_price_huf int not null,
  qty int not null default 1,
  line_total_huf int not null
);

create table if not exists order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  label_snapshot text not null,
  price_delta_huf int not null default 0
);

-- Idősáv kapacitás
create table if not exists capacity_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  timeslot time not null,     -- pl. 11:30:00
  max_orders int not null default 8,
  booked_orders int not null default 0,
  unique(date, timeslot)
);

-- Beállítások
create table if not exists settings (
  key text primary key,
  value_json jsonb not null
);

-- Hírlevél
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- ===== Segéd: automatikus kód generátor (A123 formátum) =====
create or replace function gen_order_code()
returns text language plpgsql as $$
declare
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  prefix text := substring(letters, (floor(random()*26)+1)::int, 1);
begin
  return prefix || to_char((extract(epoch from now())::bigint % 100000)::int, 'FM00000');
end $$;

-- ===== Minta beállítások =====
insert into settings(key, value_json) values
('opening_hours', '{"mon_fri":"07:00-15:00","sat":"08:00-14:00","sun":"closed"}')
on conflict (key) do nothing;

-- ===== Minta kategóriák/ételek (opcionális) =====
insert into menu_categories(name,sort) values ('Levesek',1),('Főételek',2),('Köretek',3)
on conflict do nothing;