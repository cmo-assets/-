-- ملاعبك (Mala3bak) — initial schema
-- Roles: player (default), owner (venue manager), admin (super admin).
-- Only 'player' can self-register; 'owner'/'admin' are assigned manually by an admin.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('player', 'owner', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'player',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER helper so RLS policies can check the caller's role
-- without granting broad SELECT access to the profiles table (that table
-- holds admin/owner names & phone numbers, which must stay private).
create function public.current_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Venues & pitches
-- ─────────────────────────────────────────────────────────────────────────
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  city text not null default 'الرياض',
  neighborhood text,
  address text,
  lat double precision not null,
  lng double precision not null,
  created_by uuid references public.profiles (id),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Owners who can manage a venue (an owner account may manage several venues).
create table public.venue_managers (
  venue_id uuid not null references public.venues (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (venue_id, profile_id)
);

create function public.is_venue_manager(target_venue_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.venue_managers
    where venue_id = target_venue_id and profile_id = auth.uid()
  );
$$;

create function public.can_manage_venue(target_venue_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or public.is_venue_manager(target_venue_id);
$$;

create type public.pitch_size as enum ('5x5', '7x7', '11x11');

create table public.pitches (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  size public.pitch_size not null,
  is_indoor boolean not null default false,
  amenities text[] not null default '{}',
  price_per_hour numeric(10, 2) not null,
  slot_duration_minutes int not null default 60,
  capacity_min int not null default 10,
  capacity_max int not null default 14,
  deposit_required boolean not null default false,
  deposit_amount numeric(10, 2) not null default 0,
  advance_booking_deposit_days int not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pitch_images (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Recurring weekly opening hours, e.g. Sunday 06:00–23:00.
create table public.weekly_availability (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

-- One-off overrides: close a date range (maintenance) or open an extra slot.
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  is_closed boolean not null default true,
  reason text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Booking holds (10-minute soft lock during checkout) & bookings
-- ─────────────────────────────────────────────────────────────────────────
create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  held_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Only one active hold per slot at a time.
create unique index booking_holds_active_slot
  on public.booking_holds (pitch_id, starts_at)
  where status = 'active';

create type public.booking_status as enum ('confirmed', 'completed', 'cancelled');
create type public.deposit_status as enum ('not_required', 'pending', 'paid', 'failed');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id),
  user_id uuid not null references public.profiles (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  player_count int not null,
  total_price numeric(10, 2) not null,
  status public.booking_status not null default 'confirmed',
  deposit_status public.deposit_status not null default 'not_required',
  deposit_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- Hard guarantee against double-booking at the database level.
create unique index bookings_active_slot
  on public.bookings (pitch_id, starts_at)
  where status = 'confirmed';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  provider text not null default 'tap',
  provider_charge_id text,
  amount numeric(10, 2) not null,
  currency text not null default 'SAR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Reviews
-- ─────────────────────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (pitch_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Public-safe views (hide admin/owner identity from visitors)
-- ─────────────────────────────────────────────────────────────────────────
create view public.venue_public as
  select id, name_ar, name_en, description_ar, description_en, city,
         neighborhood, address, lat, lng
  from public.venues
  where is_published = true;

create view public.pitch_public as
  select id, venue_id, name_ar, name_en, size, is_indoor, amenities,
         price_per_hour, slot_duration_minutes, capacity_min, capacity_max,
         deposit_required, deposit_amount, advance_booking_deposit_days
  from public.pitches
  where is_active = true;

create view public.pitch_rating_public as
  select pitch_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from public.reviews
  group by pitch_id;

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_managers enable row level security;
alter table public.pitches enable row level security;
alter table public.pitch_images enable row level security;
alter table public.weekly_availability enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.booking_holds enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

-- profiles: nobody can browse other people's profile. Admin/owner identity
-- never leaks — even authenticated players cannot read another profile row.
create policy "profile: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profile: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profile: admin reads all" on public.profiles
  for select using (public.is_admin());
create policy "profile: admin manages roles" on public.profiles
  for update using (public.is_admin());

-- venues: visitors only ever query the venue_public view (views inherit the
-- base table's RLS as the view owner, so this policy also gates it).
create policy "venues: public reads published" on public.venues
  for select using (is_published = true or public.can_manage_venue(id));
create policy "venues: admin writes" on public.venues
  for insert with check (public.is_admin());
create policy "venues: managers update" on public.venues
  for update using (public.can_manage_venue(id));
create policy "venues: admin deletes" on public.venues
  for delete using (public.is_admin());

create policy "venue_managers: managers read own" on public.venue_managers
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "venue_managers: admin writes" on public.venue_managers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "pitches: public reads active" on public.pitches
  for select using (is_active = true or public.can_manage_venue(venue_id));
create policy "pitches: admin inserts" on public.pitches
  for insert with check (public.is_admin());
create policy "pitches: managers update" on public.pitches
  for update using (public.can_manage_venue(venue_id));
create policy "pitches: admin deletes" on public.pitches
  for delete using (public.is_admin());

create policy "pitch_images: public reads" on public.pitch_images
  for select using (true);
create policy "pitch_images: admin writes" on public.pitch_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "weekly_availability: public reads" on public.weekly_availability
  for select using (true);
create policy "weekly_availability: managers write" on public.weekly_availability
  for all using (public.can_manage_venue(
      (select venue_id from public.pitches where id = pitch_id)
    ))
  with check (public.can_manage_venue(
      (select venue_id from public.pitches where id = pitch_id)
    ));

create policy "availability_exceptions: public reads" on public.availability_exceptions
  for select using (true);
create policy "availability_exceptions: managers write" on public.availability_exceptions
  for all using (public.can_manage_venue(
      (select venue_id from public.pitches where id = pitch_id)
    ))
  with check (public.can_manage_venue(
      (select venue_id from public.pitches where id = pitch_id)
    ));

-- booking_holds: a user only ever sees/creates their own hold; venue
-- managers can see holds on their own pitches (for the live calendar).
create policy "holds: own or managed" on public.booking_holds
  for select using (
    held_by = auth.uid()
    or public.can_manage_venue((select venue_id from public.pitches where id = pitch_id))
  );
create policy "holds: create own" on public.booking_holds
  for insert with check (held_by = auth.uid());
create policy "holds: release own" on public.booking_holds
  for update using (held_by = auth.uid());

-- bookings: player sees own bookings; venue managers see bookings for their
-- pitches (never the other way around — a player never sees who manages it).
create policy "bookings: own or managed" on public.bookings
  for select using (
    user_id = auth.uid()
    or public.can_manage_venue((select venue_id from public.pitches where id = pitch_id))
  );
create policy "bookings: create own" on public.bookings
  for insert with check (user_id = auth.uid());
create policy "bookings: managers update status" on public.bookings
  for update using (
    public.can_manage_venue((select venue_id from public.pitches where id = pitch_id))
  );

create policy "payments: own or managed" on public.payments
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.user_id = auth.uid()
             or public.can_manage_venue((select venue_id from public.pitches where id = b.pitch_id)))
    )
  );

create policy "reviews: public reads" on public.reviews
  for select using (true);
create policy "reviews: booked users write" on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.pitch_id = reviews.pitch_id and b.user_id = auth.uid()
    )
  );
create policy "reviews: author updates" on public.reviews
  for update using (user_id = auth.uid());
create policy "reviews: author deletes" on public.reviews
  for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- Storage: pitch photo gallery (public read, admin-only write)
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('pitch-images', 'pitch-images', true)
  on conflict (id) do nothing;

create policy "pitch-images: public read" on storage.objects
  for select using (bucket_id = 'pitch-images');
create policy "pitch-images: admin write" on storage.objects
  for insert with check (bucket_id = 'pitch-images' and public.is_admin());
create policy "pitch-images: admin update" on storage.objects
  for update using (bucket_id = 'pitch-images' and public.is_admin());
create policy "pitch-images: admin delete" on storage.objects
  for delete using (bucket_id = 'pitch-images' and public.is_admin());
