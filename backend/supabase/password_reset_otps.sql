-- Password reset OTP codes (4-digit). Run in Supabase SQL Editor after profiles exist.
-- Backend stores bcrypt-hashed codes and sends plain codes via nodemailer.

create table if not exists public.password_reset_otps (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  hashed_code text not null,
  expires_at  timestamptz not null,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists password_reset_otps_email_created_idx
  on public.password_reset_otps (email, created_at desc);

alter table public.password_reset_otps enable row level security;

-- No client policies: only the backend (service role / direct DB) reads/writes this table.
