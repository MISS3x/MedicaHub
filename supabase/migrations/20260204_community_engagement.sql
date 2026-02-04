-- Migration: Community Engagement (Beta Testing & Feature Voting)
-- Created: 2026-02-04

-- =====================================================
-- 1. BETA TESTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS beta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  practice_type TEXT, -- e.g., "Soukromá ordinace", "Nemocnice", "Klinika"
  phone TEXT,
  notes TEXT, -- Additional info from doctor
  status TEXT DEFAULT 'pending', -- pending, approved, contacted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_beta_requests_status ON beta_requests(status);
CREATE INDEX IF NOT EXISTS idx_beta_requests_created ON beta_requests(created_at DESC);

-- =====================================================
-- 2. FEATURE REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, spam, implemented, rejected
  votes INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false, -- Admin must approve to show publicly
  admin_notes TEXT, -- Internal notes from admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_approved ON feature_requests(approved);
CREATE INDEX IF NOT EXISTS idx_feature_requests_votes ON feature_requests(votes DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created ON feature_requests(created_at DESC);

-- =====================================================
-- 3. FEATURE VOTES TABLE (prevents duplicate voting)
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  voter_email TEXT NOT NULL,
  voter_fingerprint TEXT, -- Browser fingerprint for anonymous tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One vote per email per request
  UNIQUE(request_id, voter_email)
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_feature_votes_request ON feature_votes(request_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE beta_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

-- Public can INSERT beta requests
CREATE POLICY "Anyone can submit beta request" ON beta_requests
  FOR INSERT WITH CHECK (true);

-- Public can READ their own beta requests
CREATE POLICY "Users can view their own beta requests" ON beta_requests
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Admins can view/edit all beta requests
CREATE POLICY "Admins can manage beta requests" ON beta_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public can INSERT feature requests
CREATE POLICY "Anyone can submit feature request" ON feature_requests
  FOR INSERT WITH CHECK (true);

-- Public can READ approved requests
CREATE POLICY "Anyone can view approved feature requests" ON feature_requests
  FOR SELECT USING (approved = true);

-- Admins can manage all feature requests
CREATE POLICY "Admins can manage feature requests" ON feature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public can INSERT votes
CREATE POLICY "Anyone can vote" ON feature_votes
  FOR INSERT WITH CHECK (true);

-- Public can READ votes
CREATE POLICY "Anyone can view votes" ON feature_votes
  FOR SELECT USING (true);

-- Public can DELETE their own votes (for un-voting)
CREATE POLICY "Users can remove their own votes" ON feature_votes
  FOR DELETE USING (auth.jwt() ->> 'email' = voter_email);

-- Admins can manage all votes
CREATE POLICY "Admins can manage all votes" ON feature_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update vote count when votes are added/removed
CREATE OR REPLACE FUNCTION update_feature_request_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_requests
    SET votes = votes + 1, updated_at = NOW()
    WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_requests
    SET votes = GREATEST(votes - 1, 0), updated_at = NOW()
    WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update vote counts
DROP TRIGGER IF EXISTS trigger_update_votes ON feature_votes;
CREATE TRIGGER trigger_update_votes
AFTER INSERT OR DELETE ON feature_votes
FOR EACH ROW EXECUTE FUNCTION update_feature_request_votes();

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_beta_requests_timestamp ON beta_requests;
CREATE TRIGGER update_beta_requests_timestamp
BEFORE UPDATE ON beta_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_requests_timestamp ON feature_requests;
CREATE TRIGGER update_feature_requests_timestamp
BEFORE UPDATE ON feature_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
