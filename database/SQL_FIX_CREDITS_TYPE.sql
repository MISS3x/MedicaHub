-- Fix credits column type to support small fractional deductions
-- We need to change both organizations.credits and ensure consistency

ALTER TABLE public.organizations 
ALTER COLUMN credits TYPE NUMERIC(15, 6) 
USING credits::NUMERIC(15, 6);

-- Verify policies just in case (optional, existing policies stick)
