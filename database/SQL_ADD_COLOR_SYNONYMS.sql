-- 1. Ensure synonyms column exists
ALTER TABLE public.defined_apps ADD COLUMN IF NOT EXISTS synonyms TEXT[] DEFAULT '{}';
COMMENT ON COLUMN public.defined_apps.synonyms IS 'List of alternate names for voice recognition (e.g. colors, mispronunciations)';

-- 2. VoiceLog (Red) - Add "červenou", "vojylok", "loice lock"
UPDATE public.defined_apps 
SET synonyms = array_cat(COALESCE(synonyms, '{}'::text[]), ARRAY['červenou', 'červená', 'red', 'vojylok', 'loice lock', 'loicelock', 'voislog'])
WHERE code = 'voicelog';

-- 3. MedLog (Green) - Add "zelenou"
UPDATE public.defined_apps 
SET synonyms = array_cat(COALESCE(synonyms, '{}'::text[]), ARRAY['zelenou', 'zelená', 'medlog','met lok','met lock','med lock', 'green', 'léky'])
WHERE code = 'medlog';

-- 4. TermoLog (Blue) - Add "modrou"
UPDATE public.defined_apps 
SET synonyms = array_cat(COALESCE(synonyms, '{}'::text[]), ARRAY['modrou', 'modrá', 'blue','termolog', 'termo lock', 'thermo log', 'termo lok','teplota'])
WHERE code = 'termolog';

-- 5. EventLog (Orange) - Add "oranžovou"
UPDATE public.defined_apps 
SET synonyms = array_cat(COALESCE(synonyms, '{}'::text[]), ARRAY['oranžovou', 'oranžová', 'orange' , 'event log','ivent lock','ývent lock','záznamník','zelená'])
WHERE code = 'eventlog';

-- 6. SteriLog (Purple) - Add "fialovou"
UPDATE public.defined_apps 
SET synonyms = array_cat(COALESCE(synonyms, '{}'::text[]), ARRAY['fialovou', 'fialová', 'purple'])
WHERE code = 'sterilog';

-- 7. Cleanup Duplicates
WITH clean_arrays AS (
    SELECT code, ARRAY(SELECT DISTINCT UNNEST(synonyms)) as unique_synonyms
    FROM public.defined_apps
)
UPDATE public.defined_apps
SET synonyms = clean_arrays.unique_synonyms
FROM clean_arrays
WHERE public.defined_apps.code = clean_arrays.code;
