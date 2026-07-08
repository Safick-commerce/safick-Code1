-- Remove legacy custom OTP table (password reset now uses Supabase Auth email OTP).
drop table if exists public.password_reset_otps;
