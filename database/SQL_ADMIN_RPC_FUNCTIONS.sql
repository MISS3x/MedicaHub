-- ==================================================
-- RPC FUNKCE pro Admin Panel
-- ==================================================

-- 1. Funkce pro toggle aplikace podle emailu (už máme)
-- toggle_app() - viz SQL_ADMIN_VIEW.sql

-- 2. Funkce pro update credits podle emailu
CREATE OR REPLACE FUNCTION update_credits_by_email(
    user_email TEXT,
    new_credits INTEGER
) RETURNS void AS $$
BEGIN
    UPDATE organizations
    SET credits = new_credits
    WHERE id = (
        SELECT p.organization_id
        FROM profiles p
        JOIN auth.users au ON au.id = p.id
        WHERE au.email = user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Funkce pro získání admin dat (alternativa k VIEW)
CREATE OR REPLACE FUNCTION get_admin_app_data()
RETURNS TABLE (
    email TEXT,
    organization TEXT,
    tier TEXT,
    credits INTEGER,
    termolog BOOLEAN,
    eventlog BOOLEAN,
    medlog BOOLEAN,
    voicelog BOOLEAN,
    reporty BOOLEAN,
    patients BOOLEAN,
    sterilog BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.email::TEXT,
        o.name::TEXT,
        o.subscription_plan::TEXT as tier,
        o.credits::INTEGER,
        BOOL_OR(CASE WHEN aa.app_code = 'termolog' THEN aa.is_enabled ELSE false END) as termolog,
        BOOL_OR(CASE WHEN aa.app_code = 'eventlog' THEN aa.is_enabled ELSE false END) as eventlog,
        BOOL_OR(CASE WHEN aa.app_code = 'medlog' THEN aa.is_enabled ELSE false END) as medlog,
        BOOL_OR(CASE WHEN aa.app_code = 'voicelog' THEN aa.is_enabled ELSE false END) as voicelog,
        BOOL_OR(CASE WHEN aa.app_code = 'reporty' THEN aa.is_enabled ELSE false END) as reporty,
        BOOL_OR(CASE WHEN aa.app_code = 'patients' THEN aa.is_enabled ELSE false END) as patients,
        BOOL_OR(CASE WHEN aa.app_code = 'sterilog' THEN aa.is_enabled ELSE false END) as sterilog
    FROM organizations o
    LEFT JOIN profiles p ON p.organization_id = o.id
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN active_apps aa ON aa.organization_id = o.id
    WHERE au.email IS NOT NULL
    GROUP BY au.email, o.name, o.subscription_plan, o.credits
    ORDER BY au.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Funkce toggle_app_for_email (alias pro toggle_app)
CREATE OR REPLACE FUNCTION toggle_app_for_email(
    user_email TEXT,
    app_name TEXT,
    new_status BOOLEAN
) RETURNS void AS $$
BEGIN
    UPDATE active_apps
    SET is_enabled = new_status
    WHERE organization_id = (
        SELECT p.organization_id
        FROM profiles p
        JOIN auth.users au ON au.id = p.id
        WHERE au.email = user_email
    )
    AND app_code = app_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TEST
SELECT * FROM get_admin_app_data();
