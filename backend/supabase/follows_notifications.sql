-- Run manually in Supabase SQL editor (public schema).
-- Follows + in-app notifications for seller-go-live alerts.

CREATE TYPE public.notification_type AS ENUM ('SELLER_LIVE');

CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT follows_follower_seller_unique UNIQUE (follower_id, seller_id),
  CONSTRAINT follows_no_self_follow CHECK (follower_id <> seller_id)
);

CREATE INDEX follows_seller_idx ON public.follows (seller_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_read_idx ON public.notifications (user_id, is_read);
