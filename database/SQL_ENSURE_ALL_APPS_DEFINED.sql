-- Ensure all core apps are defined in the database for Voice Controller to recognize them.
-- This mirrors the hardcoded APP_DEFINITIONS in the frontend.

-- 1. Settings / Účet
INSERT INTO public.defined_apps (code, label, icon_name, color_class, href, synonyms)
VALUES ('settings', 'Účet', 'UserCog', 'text-slate-600', '/settings', ARRAY['účet', 'nastavení', 'profil', 'konto', 'muj ucet'])
ON CONFLICT (code) DO UPDATE SET 
    synonyms = array_cat(public.defined_apps.synonyms, EXCLUDED.synonyms);

-- 2. VoiceLog
INSERT INTO public.defined_apps (code, label, icon_name, color_class, href, synonyms)
VALUES ('voicelog', 'VoiceLog', 'Mic', 'text-rose-500', '/voicelog', ARRAY['voicelog', 'hlas', 'záznam', 'diktafon', 'červená'])
ON CONFLICT (code) DO UPDATE SET 
    synonyms = array_cat(public.defined_apps.synonyms, EXCLUDED.synonyms);

-- 3. MedLog
INSERT INTO public.defined_apps (code, label, icon_name, color_class, href, synonyms)
VALUES ('medlog', 'MedLog', 'Pill', 'text-emerald-500', '/medlog', ARRAY['medlog', 'léky', 'prášky', 'zelená'])
ON CONFLICT (code) DO UPDATE SET 
    synonyms = array_cat(public.defined_apps.synonyms, EXCLUDED.synonyms);

-- 4. TermoLog
INSERT INTO public.defined_apps (code, label, icon_name, color_class, href, synonyms)
VALUES ('termolog', 'TermoLog', 'Thermometer', 'text-blue-500', '/termolog', ARRAY['termolog', 'teplota', 'tepoměr', 'modrá'])
ON CONFLICT (code) DO UPDATE SET 
    synonyms = array_cat(public.defined_apps.synonyms, EXCLUDED.synonyms);

-- 5. EventLog
INSERT INTO public.defined_apps (code, label, icon_name, color_class, href, synonyms)
VALUES ('eventlog', 'EventLog', 'Calendar', 'text-orange-500', '/eventlog', ARRAY['eventlog', 'události', 'kalendář', 'oranžová'])
ON CONFLICT (code) DO UPDATE SET 
    synonyms = array_cat(public.defined_apps.synonyms, EXCLUDED.synonyms);

-- 6. Clean up duplicates in synonyms
UPDATE public.defined_apps
SET synonyms = ARRAY(SELECT DISTINCT UNNEST(synonyms));
