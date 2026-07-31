-- MedTracker schema — prescriptions, profiles, reminders.

-- ---------------------------------------------------------------------------
-- Prescriptions
-- ---------------------------------------------------------------------------
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  patient_name text not null,
  medications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Row-level security: each user can only see and write their own prescriptions.
alter table public.prescriptions enable row level security;

drop policy if exists "own_prescriptions" on public.prescriptions;
create policy "own_prescriptions"
  on public.prescriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Profiles (phone + notification prefs for WhatsApp reminders)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone_number text,
  whatsapp_enabled boolean not null default true,
  email_enabled boolean not null default true,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own_profiles" on public.profiles;
create policy "own_profiles"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Reminders (scheduled dose notifications)
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prescription_id uuid references public.prescriptions (id) on delete set null,
  patient_name text not null,
  medication_name text not null,
  dosage text not null,
  scheduled_at timestamptz not null,
  phone_number text not null,
  timezone text not null default 'UTC',
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'cancelled', 'taken', 'missed')),
  provider_message_id text,
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_due_idx
  on public.reminders (status, scheduled_at)
  where status = 'pending';

alter table public.reminders enable row level security;

drop policy if exists "own_reminders" on public.reminders;
create policy "own_reminders"
  on public.reminders
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

