-- ==================================================
-- EDITABLE ADMIN VIEW s INSTEAD OF triggers
-- ==================================================

-- 1. Vytvořit INSTEAD OF UPDATE trigger pro admin_app_management
CREATE OR REPLACE FUNCTION admin_app_management_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update credits v organizations
    IF NEW.credits IS DISTINCT FROM OLD.credits THEN
        UPDATE organizations
        SET credits = NEW.credits
        WHERE id = NEW.organization_id;
    END IF;

    -- Update tier v organizations
    IF NEW.tier IS DISTINCT FROM OLD.tier THEN
        UPDATE organizations
        SET subscription_plan = NEW.tier
        WHERE id = NEW.organization_id;
    END IF;

    -- Update aplikací (termolog)
    IF NEW.termolog IS DISTINCT FROM OLD.termolog THEN
        UPDATE active_apps
        SET is_enabled = NEW.termolog
        WHERE organization_id = NEW.organization_id
          AND app_code = 'termolog';
    END IF;

    -- Update aplikací (eventlog)
    IF NEW.eventlog IS DISTINCT FROM OLD.eventlog THEN
        UPDATE active_apps
        SET is_enabled = NEW.eventlog
        WHERE organization_id = NEW.organization_id
          AND app_code = 'eventlog';
    END IF;

    -- Update aplikací (medlog)
    IF NEW.medlog IS DISTINCT FROM OLD.medlog THEN
        UPDATE active_apps
        SET is_enabled = NEW.medlog
        WHERE organization_id = NEW.organization_id
          AND app_code = 'medlog';
    END IF;

    -- Update aplikací (voicelog)
    IF NEW.voicelog IS DISTINCT FROM OLD.voicelog THEN
        UPDATE active_apps
        SET is_enabled = NEW.voicelog
        WHERE organization_id = NEW.organization_id
          AND app_code = 'voicelog';
    END IF;

    -- Update aplikací (reporty)
    IF NEW.reporty IS DISTINCT FROM OLD.reporty THEN
        UPDATE active_apps
        SET is_enabled = NEW.reporty
        WHERE organization_id = NEW.organization_id
          AND app_code = 'reporty';
    END IF;

    -- Update aplikací (patients)
    IF NEW.patients IS DISTINCT FROM OLD.patients THEN
        UPDATE active_apps
        SET is_enabled = NEW.patients
        WHERE organization_id = NEW.organization_id
          AND app_code = 'patients';
    END IF;

    -- Update aplikací (sterilog)
    IF NEW.sterilog IS DISTINCT FROM OLD.sterilog THEN
        UPDATE active_apps
        SET is_enabled = NEW.sterilog
        WHERE organization_id = NEW.organization_id
          AND app_code = 'sterilog';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Připojit trigger k VIEW
DROP TRIGGER IF EXISTS admin_app_management_update_trigger ON admin_app_management;

CREATE TRIGGER admin_app_management_update_trigger
INSTEAD OF UPDATE ON admin_app_management
FOR EACH ROW
EXECUTE FUNCTION admin_app_management_update();

-- 3. TEST - Nyní můžete editovat přímo ve VIEW!
-- Například v Table Editoru nebo pomocí UPDATE:

/*
-- Změnit credits
UPDATE admin_app_management
SET credits = 1000
WHERE email = 'demo@medicahub.cz';

-- Zapnout VoiceLog
UPDATE admin_app_management
SET voicelog = TRUE
WHERE email = 'demo@medicahub.cz';

-- Změnit tier na PRO
UPDATE admin_app_management
SET tier = 'pro'
WHERE email = 'demo@medicahub.cz';
*/

-- 4. Ověření
SELECT * FROM admin_app_management WHERE email = 'demo@medicahub.cz';
