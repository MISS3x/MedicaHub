-- Enable Realtime for voicelogs table
-- Check if table is already in publication. 
-- Since we can't do IF NOT EXISTS easily for publication addition in standard SQL script without PL/pgSQL block,
-- we'll try to add it. If it fails, it might be already added.
-- Best approach: Re-create publication or just run alter (it usually doesn't fail if already there, just no-op or warning, wait, in pg it throws error if already in).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'voicelogs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.voicelogs;
  END IF;
END
$$;
