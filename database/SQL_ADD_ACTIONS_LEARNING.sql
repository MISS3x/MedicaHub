
-- 1. Add 'actions' column to defined_apps for granular command mapping
-- Structure: { "NAVIGATE": ["...", "..."], "NEW_RECORD": ["..."] }
ALTER TABLE public.defined_apps ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '{}'::jsonb;

-- 2. Populate defaults
-- VoiceLog
UPDATE public.defined_apps 
SET actions = '{
    "NAVIGATE": ["otevři", "spusť", "jdi na", "ukaž", "open", "start", "show"],
    "NEW_RECORD": ["nový záznam", "nahrát", "diktovat", "start", "new record"]
}'::jsonb
WHERE code = 'voicelog';

-- EventLog
UPDATE public.defined_apps 
SET actions = '{
    "NAVIGATE": ["otevři", "spusť", "jdi na", "ukaž", "open", "start", "show"],
    "NEW_TASK": ["nová poznámka", "nový úkol", "přidat úkol", "zapiš"]
}'::jsonb
WHERE code = 'eventlog';

-- TermoLog
UPDATE public.defined_apps 
SET actions = '{
    "NAVIGATE": ["otevři", "spusť", "jdi na", "ukaž", "open", "start", "show"],
    "CHECK_STATUS": ["zkontroluj teploty", "stav senzorů"]
}'::jsonb
WHERE code = 'termolog';

-- MedLog
UPDATE public.defined_apps 
SET actions = '{
    "NAVIGATE": ["otevři", "spusť", "jdi na", "ukaž", "open", "start", "show"],
    "LOG_MEDS": ["zadat léky", "podání léku", "zapiš lék"]
}'::jsonb
WHERE code = 'medlog';


-- 3. Procedure to LEARN an ACTION synonym
-- Usage: learn_app_action('voicelog', 'NEW_RECORD', 'začni nahrávat')
CREATE OR REPLACE FUNCTION learn_app_action(
    p_app_code TEXT,
    p_action_key TEXT,
    p_synonym TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_actions JSONB;
    v_new_list JSONB;
    v_norm_synonym TEXT;
BEGIN
    v_norm_synonym := trim(lower(p_synonym));

    SELECT actions INTO v_current_actions FROM public.defined_apps WHERE code = p_app_code;
    
    IF v_current_actions IS NULL THEN
        v_current_actions := '{}'::jsonb;
    END IF;

    -- Get existing list for this action key (or empty array)
    v_new_list := COALESCE(v_current_actions->p_action_key, '[]'::jsonb);

    -- Append if not exists
    -- Utilize a trick to add unique: convert to set, add, convert back? 
    -- Or just simple check in array. JSONB manipulation in Postgres can be verbose.
    -- Simple approach: just append, distinct logic can be handled by app or sophisticated sql.
    -- Better: check existence.
    IF NOT (v_new_list @> to_jsonb(v_norm_synonym)) THEN
        v_new_list := v_new_list || to_jsonb(v_norm_synonym);
    END IF;

    -- Update the specific key in the json
    v_current_actions := jsonb_set(v_current_actions, ARRAY[p_action_key], v_new_list);

    -- Save back
    UPDATE public.defined_apps 
    SET actions = v_current_actions 
    WHERE code = p_app_code;

    RETURN v_current_actions;
END;
$$;
