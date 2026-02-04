-- ==================================================
-- CREATE TEST USERS for existing organizations
-- ==================================================

-- 1. Vytvoř testovací uživatele pro MRCK NovaDent
-- (Musíš mít organization_id z tabulky organizations)

DO $$
DECLARE
    test_user_id UUID;
    novadent_org_id UUID;
BEGIN
    -- Najdi MRCK NovaDent organization
    SELECT id INTO novadent_org_id 
    FROM organizations 
    WHERE name = 'MRCK NovaDent' 
    LIMIT 1;

    IF novadent_org_id IS NOT NULL THEN
        -- Vytvoř auth uživatele
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'test@novadent.cz',
            crypt('TestPassword123!', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            ''
        )
        RETURNING id INTO test_user_id;

        -- Vytvoř profil
        INSERT INTO profiles (id, full_name, organization_id)
        VALUES (test_user_id, 'Test NovaDent', novadent_org_id);

        RAISE NOTICE 'Created user for MRCK NovaDent: %', test_user_id;
    END IF;
END $$;

-- Stejný postup pro další organizace...

-- TEST: Zkontroluj kolik účtů je teď v admin VIEW
SELECT COUNT(*) as total_users FROM admin_app_management;
SELECT email, organization, tier FROM admin_app_management;
