-- MASTER FIX SCRIPT FOR VOICELOG
-- Run this in Supabase SQL Editor to ensure all dependencies for VoiceLog are present.

-- 1. Ensure 'profiles' has credits
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits NUMERIC DEFAULT 0;

-- 2. Ensure 'voicelogs' table exists with correct schema
CREATE TABLE IF NOT EXISTS public.voicelogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT,
    audio_path TEXT, 
    transcript TEXT, 
    status TEXT DEFAULT 'pending', 
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_credits NUMERIC(10, 5) DEFAULT 0
);

-- 3. Ensure RLS is enabled on voicelogs
ALTER TABLE public.voicelogs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for voicelogs (Idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voicelogs' AND policyname = 'Users can view own voicelogs') THEN
        CREATE POLICY "Users can view own voicelogs" ON public.voicelogs FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voicelogs' AND policyname = 'Users can insert own voicelogs') THEN
        CREATE POLICY "Users can insert own voicelogs" ON public.voicelogs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voicelogs' AND policyname = 'Users can update own voicelogs') THEN
        CREATE POLICY "Users can update own voicelogs" ON public.voicelogs FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voicelogs' AND policyname = 'Users can delete own voicelogs') THEN
        CREATE POLICY "Users can delete own voicelogs" ON public.voicelogs FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 5. Create 'deduct_credits' RPC function (CRITICAL for process-audio)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits NUMERIC;
  new_credits NUMERIC;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Init if null
  IF current_credits IS NULL THEN
     current_credits := 0;
  END IF;

  -- Calculate new balance
  new_credits := current_credits - p_amount;

  -- Update profile
  UPDATE profiles
  SET credits = new_credits
  WHERE id = p_user_id;

  RETURN new_credits;
END;
$$;

-- 6. Ensure Storage Bucket Exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('voicelogs', 'voicelogs', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Ensure Storage Policies exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload own audio') THEN
        CREATE POLICY "Users can upload own audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voicelogs' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view own audio') THEN
         CREATE POLICY "Users can view own audio" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'voicelogs' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own audio') THEN
         CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'voicelogs' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END
$$;
