
-- KROK 1: Databáze
-- Spusťte tento SQL příkaz v Supabase SQL Editoru pro migraci schématu.

-- 1. Přidání sloupců do tabulky organizations (protože tam se drží subscription_plan)
-- Pokud chcete používat 'profiles', změňte název tabulky níže.
-- Vzhledem k tomu, že MedicaHub je pro organizace/ordinace, doporučuji organizations.

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- (Volitelně) Pokud opravdu chcete 'profiles' podle promptu:
/*
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
*/


-- KROK 2: Dashboard Layout
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB;
