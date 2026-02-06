-- Create a table to define all available apps in the ecosystem
CREATE TABLE IF NOT EXISTS public.defined_apps (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT,
    icon_name TEXT NOT NULL,
    color_class TEXT NOT NULL,
    href TEXT NOT NULL,
    is_coming_soon BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.defined_apps ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Public can read defined apps" ON public.defined_apps;

CREATE POLICY "Public can read defined apps" 
ON public.defined_apps FOR SELECT 
TO anon, authenticated 
USING (true);

-- Populate with initial data
INSERT INTO public.defined_apps (code, label, description, icon_name, color_class, href, is_coming_soon, sort_order)
VALUES
    ('voicelog', 'VoiceLog', 'Inteligentní hlasové poznámky s AI přepisem. Diktujte nálezy a nechte umělou inteligenci vytvořit strukturovanou zprávu.', 'Mic', 'text-rose-500', '/voicelog', FALSE, 1),
    ('eventlog', 'EventLog', 'Centrální provozní kalendář. Automatické hlídání termínů revizí, objednávek a expirací. Nic vám neuteče.', 'Calendar', 'text-orange-500', '/eventlog', FALSE, 2),
    ('medlog', 'MedLog', 'Digitální evidence podávání léků. Rychlé záznamy, přehledná historie a automatické kontroly.', 'Pill', 'text-emerald-500', '/medlog', FALSE, 3),
    ('termolog', 'TermoLog', 'Monitoring teplot v lednicích a skladech. Automatické grafy a upozornění na vybočení z limitů.', 'Thermometer', 'text-blue-500', '/termolog', FALSE, 4),
    ('sterilog', 'SteriLog', 'Deník sterilizací podle legislativy. Sledujte šarže, exspirace a procesy na jednom místě.', 'Sparkles', 'text-purple-500', '/sterilog', FALSE, 5),
    ('patients', 'Pacienti', 'Kartotéka pacientů moderní doby. Rychlý přístup k anamnéze a dokumentaci.', 'Users', 'text-sky-500', '#', TRUE, 6),
    ('reporty', 'Reporty', 'Pokročilé statistiky a výkazy pro pojišťovny a management ordinace.', 'BarChart3', 'text-indigo-500', '#', TRUE, 7)
ON CONFLICT (code) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color_class = EXCLUDED.color_class,
    href = EXCLUDED.href,
    is_coming_soon = EXCLUDED.is_coming_soon,
    sort_order = EXCLUDED.sort_order;
