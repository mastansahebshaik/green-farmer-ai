CREATE TABLE IF NOT EXISTS public.request_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, bucket),
  CONSTRAINT request_rate_limits_bucket_check CHECK (char_length(trim(bucket)) BETWEEN 1 AND 64),
  CONSTRAINT request_rate_limits_count_check CHECK (request_count >= 0)
);

ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.request_rate_limits FROM PUBLIC;
REVOKE ALL ON TABLE public.request_rate_limits FROM authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _bucket text,
  _limit integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  next_count integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF char_length(trim(_bucket)) NOT BETWEEN 1 AND 64
     OR _limit < 1
     OR _window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;

  INSERT INTO public.request_rate_limits (
    user_id, bucket, window_started_at, request_count
  )
  VALUES (current_user_id, trim(_bucket), now(), 1)
  ON CONFLICT (user_id, bucket)
  DO UPDATE SET
    window_started_at = CASE
      WHEN now() - public.request_rate_limits.window_started_at
        >= make_interval(secs => _window_seconds)
      THEN now()
      ELSE public.request_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN now() - public.request_rate_limits.window_started_at
        >= make_interval(secs => _window_seconds)
      THEN 1
      WHEN public.request_rate_limits.request_count < _limit + 1
      THEN public.request_rate_limits.request_count + 1
      ELSE public.request_rate_limits.request_count
    END
  RETURNING request_count INTO next_count;

  RETURN next_count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO authenticated;
