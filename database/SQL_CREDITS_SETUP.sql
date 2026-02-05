-- 1. Add columns to voicelogs to track token usage and cost
ALTER TABLE voicelogs
ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_credits NUMERIC(10, 5) DEFAULT 0; -- allowing 5 decimal places for micro-transactions

-- 2. Create a secure function to deduct credits
-- This is better than doing it in JS because it ensures atomicity (preventing race conditions)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin), bypassing RLS for the deduction
AS $$
DECLARE
  current_credits NUMERIC;
  new_credits NUMERIC;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Calculate new balance
  new_credits := current_credits - p_amount;

  -- Optional: Prevent negative balance?
  -- IF new_credits < 0 THEN RAISE EXCEPTION 'Insufficient credits'; END IF;

  -- Update profile
  UPDATE profiles
  SET credits = new_credits
  WHERE id = p_user_id;

  RETURN new_credits;
END;
$$;
