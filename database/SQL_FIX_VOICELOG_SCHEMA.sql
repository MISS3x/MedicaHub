-- Add missing columns for AI usage tracking to voicelogs table
ALTER TABLE public.voicelogs 
ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_credits NUMERIC(10, 5) DEFAULT 0;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'voicelogs';
