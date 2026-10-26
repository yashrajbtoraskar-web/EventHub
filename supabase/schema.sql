-- ============================================================
-- Event & Workshop Portal – Supabase schema
-- Run the whole file once: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ---------- tables ----------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  role text not null default 'candidate' check (role in ('admin', 'candidate'))
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  date date not null,
  time time not null,
  venue text not null,
  image text,
  description text,
  total_seats int not null check (total_seats > 0),
  status text not null default 'Upcoming' check (status in ('Upcoming', 'Ongoing', 'Completed'))
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (event_id, email)            -- DB-level duplicate protection
);

-- ---------- helpers ----------
-- Profile row apne aap ban jaye jab koi signup kare
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- view: events + registered count (guest bhi seats dekh sake) ----------
create or replace view events_with_counts as
  select e.*,
         (select count(*) from registrations r where r.event_id = e.id)::int as registered_count
  from events e;
grant select on events_with_counts to anon, authenticated;

-- ---------- RPC: seat booking (row lock + all rules in one transaction) ----------
create or replace function register_for_event(p_event uuid, p_name text, p_email text, p_phone text)
returns registrations
language plpgsql security definer set search_path = public as $$
declare
  ev events;
  taken int;
  reg registrations;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if is_admin() then raise exception 'FORBIDDEN'; end if;

  -- row lock: do candidates ek hi aakhri seat na le sakein
  select * into ev from events where id = p_event for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if ev.status <> 'Upcoming' then raise exception 'CLOSED'; end if;

  select count(*) into taken from registrations where event_id = p_event;
  if taken >= ev.total_seats then raise exception 'FULL'; end if;

  insert into registrations (event_id, user_id, full_name, email, phone)
  values (p_event, auth.uid(), p_name, lower(p_email), p_phone)
  returning * into reg;
  return reg;
exception
  when unique_violation then raise exception 'DUPLICATE';
end $$;

revoke execute on function register_for_event(uuid, text, text, text) from public, anon;
grant execute on function register_for_event(uuid, text, text, text) to authenticated;

-- ---------- Row Level Security (asli security yahin hai) ----------
alter table profiles      enable row level security;
alter table events        enable row level security;
alter table registrations enable row level security;

-- profiles: apna profile ya admin sab dekh sake
create policy "profile read" on profiles
  for select using (id = auth.uid() or is_admin());

-- events: sab dekh sakte hain, sirf admin badal sakta hai
create policy "events read" on events
  for select using (true);
create policy "events admin write" on events
  for all using (is_admin()) with check (is_admin());

-- registrations: insert sirf RPC se (direct insert policy nahi)
create policy "regs read" on registrations
  for select using (user_id = auth.uid() or is_admin());
create policy "regs update own" on registrations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "regs delete own or admin" on registrations
  for delete using (user_id = auth.uid() or is_admin());

-- ---------- sample events (optional, demo ke liye) ----------
insert into events (title, category, date, time, venue, description, total_seats, status) values
  ('React & Frontend Summit', 'Technology', current_date + 6, '10:00', 'Hinjewadi Tech Park, Pune',
   'A full-day summit on modern React, performance and accessibility.', 120, 'Upcoming'),
  ('Startup Pitch Night', 'Business', current_date + 10, '18:30', 'The Hive Co-working, Koregaon Park',
   'Early-stage founders pitch to investors and mentors.', 60, 'Upcoming'),
  ('UI/UX Design Sprint Workshop', 'Design', current_date + 14, '11:00', 'Design Studio, Baner',
   'Hands-on sprint: research, wireframes and a clickable prototype.', 40, 'Upcoming'),
  ('Git & GitHub Workshop', 'Workshop', current_date + 3, '14:00', 'Online (Google Meet)',
   'Branching, pull requests and resolving merge conflicts.', 80, 'Upcoming'),
  ('Node.js Meetup', 'Technology', current_date - 5, '17:00', 'Kharadi Tech Hub',
   'Past meetup on Node.js streams and async patterns.', 80, 'Completed');

-- ---------- admin banane ke liye (signup ke baad run karo) ----------
-- update profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@eventhub.com');
