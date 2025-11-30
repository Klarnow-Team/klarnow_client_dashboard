-- Migration: Create Onboarding Tables
-- Creates projects and onboarding_steps tables for storing onboarding data
-- Uses email as the identifier instead of user_id

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Main table for client projects (Launch Kit or Growth Kit)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  
  -- Progress tracking
  onboarding_percent INTEGER DEFAULT 0 CHECK (onboarding_percent >= 0 AND onboarding_percent <= 100),
  onboarding_finished BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(email, kit_type) -- One project per email per kit type
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_email ON projects(email);
CREATE INDEX IF NOT EXISTS idx_projects_kit_type ON projects(kit_type);
CREATE INDEX IF NOT EXISTS idx_projects_onboarding_finished ON projects(onboarding_finished);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects (allow service role to insert/update)
CREATE POLICY "Allow all operations with service role"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ONBOARDING STEPS TABLE
-- ============================================
-- Stores the 3 onboarding steps per project
-- All form data is stored in the fields JSONB column
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 3),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')),
  required_fields_total INTEGER DEFAULT 0,
  required_fields_completed INTEGER DEFAULT 0,
  time_estimate TEXT, -- e.g., "About 5 minutes"
  fields JSONB, -- Store all form data as JSON
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, step_number) -- One step per step number per project
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_project_id ON onboarding_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_status ON onboarding_steps(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_step_number ON onboarding_steps(step_number);

-- Enable RLS
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_steps (allow service role to insert/update)
CREATE POLICY "Allow all operations with service role"
  ON onboarding_steps FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE projects IS 'Main table for client projects. Each project is associated with an email and kit type (LAUNCH or GROWTH).';
COMMENT ON TABLE onboarding_steps IS 'Stores all 3 onboarding steps per project. Form data is stored in the fields JSONB column.';
COMMENT ON COLUMN projects.email IS 'User email address - used as the primary identifier instead of user_id';
COMMENT ON COLUMN onboarding_steps.fields IS 'JSONB column storing all form field data from the onboarding forms';
COMMENT ON COLUMN onboarding_steps.step_number IS 'Step number: 1, 2, or 3';

