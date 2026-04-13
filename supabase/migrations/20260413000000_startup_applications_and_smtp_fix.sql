-- 1. Table pour stocker les candidatures Actero for Startups
CREATE TABLE IF NOT EXISTS startup_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_name TEXT NOT NULL,
  url TEXT NOT NULL,
  email TEXT NOT NULL,
  revenue TEXT NOT NULL,
  platform TEXT NOT NULL,
  motivation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : seuls les admins peuvent voir/gerer les candidatures
ALTER TABLE startup_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to startup_applications"
  ON startup_applications FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin')
    OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%@actero.fr'
  );

CREATE INDEX idx_startup_applications_status ON startup_applications(status);
CREATE INDEX idx_startup_applications_email ON startup_applications(email);

-- 2. Fix: elargir le CHECK constraint sur auth_type pour inclure 'smtp'
ALTER TABLE client_integrations DROP CONSTRAINT IF EXISTS client_integrations_auth_type_check;
ALTER TABLE client_integrations ADD CONSTRAINT client_integrations_auth_type_check
  CHECK (auth_type IN ('oauth', 'api_key', 'smtp'));
