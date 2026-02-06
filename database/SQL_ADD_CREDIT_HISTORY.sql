
-- 1. Create History Table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC(10, 5) NOT NULL,
    description TEXT,
    app_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_transactions' AND policyname = 'Users view own org transactions') THEN
        CREATE POLICY "Users view own org transactions" ON credit_transactions
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
    END IF;
END
$$;

-- 2. CREATE add_credits (For Purchases/Gifts)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Nákup kreditů',
  p_app_id TEXT DEFAULT 'system'
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_new_credits NUMERIC;
BEGIN
    -- Get User's Organization
    SELECT organization_id INTO v_org_id FROM profiles WHERE id = p_user_id;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'User has no organization assigned.';
    END IF;

    -- Update Organization Credits (ADD)
    UPDATE organizations
    SET credits = COALESCE(credits, 0) + p_amount
    WHERE id = v_org_id
    RETURNING credits INTO v_new_credits;

    -- Log Transaction (Positive Amount)
    INSERT INTO credit_transactions (organization_id, user_id, amount, description, app_id)
    VALUES (v_org_id, p_user_id, p_amount, p_description, p_app_id);

    RETURN v_new_credits;
END;
$$;


-- 3. REPLACE deduct_credits (For Usage)
DROP FUNCTION IF EXISTS deduct_credits(uuid, numeric);

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Využití služby',
  p_app_id TEXT DEFAULT 'system'
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_new_credits NUMERIC;
BEGIN
    -- Get User's Organization
    SELECT organization_id INTO v_org_id FROM profiles WHERE id = p_user_id;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'User has no organization assigned.';
    END IF;

    -- Update Organization Credits (SUBTRACT)
    UPDATE organizations
    SET credits = COALESCE(credits, 0) - p_amount
    WHERE id = v_org_id
    RETURNING credits INTO v_new_credits;

    -- Log Transaction (Negative Amount)
    INSERT INTO credit_transactions (organization_id, user_id, amount, description, app_id)
    VALUES (v_org_id, p_user_id, -p_amount, p_description, p_app_id);

    RETURN v_new_credits;
END;
$$;
