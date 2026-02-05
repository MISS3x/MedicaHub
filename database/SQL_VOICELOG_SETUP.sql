-- Create storage bucket for voice logs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voicelogs', 'voicelogs', false)
ON CONFLICT (id) DO NOTHING;

-- Create the voicelogs table
CREATE TABLE IF NOT EXISTS public.voicelogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT,
    audio_path TEXT, -- Path in storage bucket
    transcript TEXT, -- The AI transcription
    status TEXT DEFAULT 'pending', -- pending, processed, error
    duration_seconds INTEGER,
    file_size_bytes BIGINT
);

-- Enable RLS
ALTER TABLE public.voicelogs ENABLE ROW LEVEL SECURITY;

-- Policies for voicelogs table
CREATE POLICY "Users can view own voicelogs"
    ON public.voicelogs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voicelogs"
    ON public.voicelogs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voicelogs"
    ON public.voicelogs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voicelogs"
    ON public.voicelogs FOR DELETE
    USING (auth.uid() = user_id);

-- Storage policies for 'voicelogs' bucket
-- Allow users to upload to their own folder: user_id/filename
CREATE POLICY "Users can upload own audio"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'voicelogs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own audio"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'voicelogs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own audio"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'voicelogs' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
