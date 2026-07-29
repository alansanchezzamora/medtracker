-- MedTracker — prescriptions table (persistence for the prescription reader).
-- Run this in the Supabase dashboard: SQL Editor -> paste -> Run.
-- (Or, with the Supabase CLI linked: `supabase db push`.)

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  patient_name text not null,
  medications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Row-level security: each user can only see and write their own prescriptions.
alter table public.prescriptions enable row level security;

create policy "own_prescriptions"
  on public.prescriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
