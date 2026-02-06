-- Update MedLog description
UPDATE defined_apps
SET description = 'Digitální evidence vyřazených léků, rychlé záznamy o lécích, přehledná historie a automatické kontroly zásob.'
WHERE code = 'medlog';

-- Update SteriLog to be "Coming Soon" (renders as gray with badge)
UPDATE defined_apps
SET is_coming_soon = true
WHERE code = 'sterilog';
