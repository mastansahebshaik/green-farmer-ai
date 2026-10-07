CREATE OR REPLACE FUNCTION public.get_admin_farmer_stats()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  village text,
  language text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  scan_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not an admin account';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.village,
    COALESCE(p.language, 'en')::text,
    COALESCE(u.created_at, p.created_at),
    u.last_sign_in_at,
    COUNT(s.id)::bigint
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON p.id = u.id
  LEFT JOIN public.scans AS s ON s.user_id = u.id
  GROUP BY u.id, u.email, p.full_name, p.village, p.language, u.created_at, p.created_at, u.last_sign_in_at
  ORDER BY COALESCE(u.created_at, p.created_at) DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_farmer_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_farmer_stats() TO authenticated;
