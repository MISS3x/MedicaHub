-- ==================================================
-- FIX: Přidat UNIQUE constraint na active_apps
-- ==================================================

-- 1. Nejdřív smazat duplicity (kdyby existovaly)
DELETE FROM active_apps a
USING active_apps b
WHERE a.id > b.id
  AND a.organization_id = b.organization_id
  AND a.app_code = b.app_code;

-- 2. Přidat UNIQUE constraint
ALTER TABLE active_apps
ADD CONSTRAINT active_apps_org_app_unique 
UNIQUE (organization_id, app_code);

-- 3. Ověření
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'active_apps'::regclass
  AND conname = 'active_apps_org_app_unique';
