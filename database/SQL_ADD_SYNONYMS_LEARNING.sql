
-- 1. Add synonyms column to existing defined_apps table
-- This keeps everything in one place as per "Micro-apps ecosystem"
ALTER TABLE public.defined_apps ADD COLUMN IF NOT EXISTS synonyms TEXT[] DEFAULT '{}';

-- 2. Update existing apps with initial synonyms from JSON
UPDATE public.defined_apps SET synonyms = ARRAY['hlasové záznamy', 'diktafón', 'nahrávání', 'audiorecord', 'hlas', 'záznam', 'voicelog', 'voice lock', 'lock', 'vojs'] WHERE code = 'voicelog';
UPDATE public.defined_apps SET synonyms = ARRAY['poznámky', 'deník', 'záznamník', 'event log', 'aplikace poznámky', 'kalendář', 'plán'] WHERE code = 'eventlog';
UPDATE public.defined_apps SET synonyms = ARRAY['léky', 'medikace', 'medlog', 'metlog', 'prášky'] WHERE code = 'medlog';
UPDATE public.defined_apps SET synonyms = ARRAY['teplota', 'termometr', 'teplotní log', 'termo', 'senzor', 'termolog', 'thermo'] WHERE code = 'termolog';
UPDATE public.defined_apps SET synonyms = ARRAY['sterilizace', 'sterilog', 'stery'] WHERE code = 'sterilog';
UPDATE public.defined_apps SET synonyms = ARRAY['reporty', 'statistiky', 'přehled', 'report'] WHERE code = 'reporty';
UPDATE public.defined_apps SET synonyms = ARRAY['pacienti', 'kartotéka', 'lidé'] WHERE code = 'patients';

-- Also add Settings/Account which wasn't in defined_apps but should be if we want to voice control it nicely
-- Or we handle it separately. For consistency, let's Insert it if it doesn't exist.
INSERT INTO public.defined_apps (code, label, icon_name, color_class, href, synonyms)
VALUES ('settings', 'Nastavení', 'UserCog', 'text-slate-600', '/settings', ARRAY['nastavení', 'účet', 'profil'])
ON CONFLICT (code) DO UPDATE SET synonyms = EXCLUDED.synonyms;


-- 3. Procedure to ADD a synonym (Learning Mode)
CREATE OR REPLACE FUNCTION add_app_synonym(
    p_app_code TEXT,
    p_synonym TEXT
) RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_synonyms TEXT[];
    v_normalized_synonym TEXT;
BEGIN
    -- Normalize input (lowercase, trim)
    v_normalized_synonym := trim(lower(p_synonym));

    -- Check if app exists
    IF NOT EXISTS (SELECT 1 FROM public.defined_apps WHERE code = p_app_code) THEN
        RAISE EXCEPTION 'Aplikace s kódem % neexistuje', p_app_code;
    END IF;

    -- Add synonym if not exists
    UPDATE public.defined_apps
    SET synonyms = array_append(synonyms, v_normalized_synonym)
    WHERE code = p_app_code
    AND NOT (synonyms @> ARRAY[v_normalized_synonym]) -- Avoid duplicates
    RETURNING synonyms INTO v_current_synonyms;

    RETURN v_current_synonyms;
END;
$$;
