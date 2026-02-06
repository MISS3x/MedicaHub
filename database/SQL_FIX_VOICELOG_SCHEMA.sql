-- 1. Ensure 'voicelogs' table exists (SAFE: Does nothing if table exists)
CREATE TABLE IF NOT EXISTS public.voicelogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT,
    audio_path TEXT, 
    transcript TEXT, 
    status TEXT DEFAULT 'pending', 
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_credits NUMERIC(10, 5) DEFAULT 0
);

-- 2. Add missing columns to existing table (SAFE: Checks if column exists)
ALTER TABLE public.voicelogs 
ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_credits NUMERIC(10, 5) DEFAULT 0;

-- 3. Ensure the deduct_credits function exists (Required for API)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits NUMERIC;
  new_credits NUMERIC;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Init if null
  IF current_credits IS NULL THEN
     current_credits := 0;
  END IF;

  -- Calculate new balance
  new_credits := current_credits - p_amount;

  -- Update profile
  UPDATE profiles
  SET credits = new_credits
  WHERE id = p_user_id;

  RETURN new_credits;
END;
$$;

-- 4. Verify the results
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'voicelogs';
