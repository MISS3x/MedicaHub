-- Allow authenticated users (admins) to view survey results and leads
-- Ideally, we would filter by a specific specific role, but for this MVP, all logged-in users are trusted.

DROP POLICY IF EXISTS "Allow admin read results" ON public.survey_results;
DROP POLICY IF EXISTS "Allow admin read leads" ON public.interest_leads;

CREATE POLICY "Allow authenticated read results" ON public.survey_results
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read leads" ON public.interest_leads
    FOR SELECT
    TO authenticated
    USING (true);
