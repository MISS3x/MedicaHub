-- Function to get beta count safely for public (ignoring RLS for the count)
CREATE OR REPLACE FUNCTION get_beta_request_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM beta_requests;
$$;
