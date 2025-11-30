-- Klarnow Client Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Create admins table (for admin users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS for admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (auth.uid() = user_id);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  onboarding_finished BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Onboarding Tracking Table
-- Dedicated table to track email and onboarding completion status
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  onboarding_finished BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  kit_type TEXT CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_email ON user_onboarding(email);

-- Create index on onboarding_finished for filtering
CREATE INDEX IF NOT EXISTS idx_user_onboarding_finished ON user_onboarding(onboarding_finished);

-- Enable RLS for user_onboarding
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding
CREATE POLICY "Users can view their own onboarding status"
  ON user_onboarding FOR SELECT
  USING (true); -- Allow public read for email lookup

CREATE POLICY "Admins can view all onboarding statuses"
  ON user_onboarding FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all onboarding statuses"
  ON user_onboarding FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Function to sync onboarding status to user_onboarding table
CREATE OR REPLACE FUNCTION sync_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  existing_completed_at TIMESTAMPTZ;
BEGIN
  -- Get email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id
  LIMIT 1;
  
  -- Get existing onboarding_completed_at if record exists
  IF user_email IS NOT NULL THEN
    SELECT onboarding_completed_at INTO existing_completed_at
    FROM user_onboarding
    WHERE email = user_email
    LIMIT 1;
    
    -- Insert or update user_onboarding
    INSERT INTO user_onboarding (email, onboarding_finished, kit_type, onboarding_completed_at, updated_at)
    VALUES (
      user_email,
      NEW.onboarding_finished,
      NEW.kit_type,
      CASE 
        WHEN NEW.onboarding_finished = true AND existing_completed_at IS NULL 
        THEN NOW() 
        ELSE existing_completed_at 
      END,
      NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      onboarding_finished = NEW.onboarding_finished,
      kit_type = NEW.kit_type,
      onboarding_completed_at = CASE 
        WHEN NEW.onboarding_finished = true AND user_onboarding.onboarding_completed_at IS NULL 
        THEN NOW() 
        ELSE user_onboarding.onboarding_completed_at 
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync onboarding status when projects table is updated
DROP TRIGGER IF EXISTS trigger_sync_user_onboarding ON projects;
CREATE TRIGGER trigger_sync_user_onboarding
AFTER INSERT OR UPDATE OF onboarding_finished ON projects
FOR EACH ROW
EXECUTE FUNCTION sync_user_onboarding();

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (true); -- Allow public read for email lookup

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (true); -- Allow updates (will be restricted by application logic)

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  
  -- Progress tracking
  onboarding_percent INTEGER DEFAULT 0 CHECK (onboarding_percent >= 0 AND onboarding_percent <= 100),
  onboarding_finished BOOLEAN DEFAULT false,
  current_day_of_14 INTEGER CHECK (current_day_of_14 >= 1 AND current_day_of_14 <= 14),
  
  -- Communication fields
  next_from_us TEXT,
  next_from_you TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, kit_type) -- One project per kit type per user
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update all projects
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Onboarding Steps Table
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 3),
  step_id TEXT NOT NULL, -- 'STEP_1', 'STEP_2', 'STEP_3'
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  required_fields_total INTEGER DEFAULT 0,
  required_fields_completed INTEGER DEFAULT 0,
  time_estimate TEXT, -- e.g., "About 5 minutes"
  fields JSONB, -- Store form data as JSON
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, step_number)
);

-- Enable RLS
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view steps for their projects"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps for their projects"
  ON onboarding_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all steps"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all steps"
  ON onboarding_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Phases Table
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_id TEXT NOT NULL, -- 'PHASE_1', 'PHASE_2', etc.
  title TEXT NOT NULL,
  subtitle TEXT,
  day_range TEXT NOT NULL, -- e.g., "Days 0-2"
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, phase_number)
);

-- Enable RLS
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view phases for their projects"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all phases"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all phases"
  ON phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Checklist Items Table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view checklist items for their projects"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM phases 
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = checklist_items.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all checklist items"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all checklist items"
  ON checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Phase Links Table
CREATE TABLE IF NOT EXISTS phase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE phase_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view phase links for their projects"
  ON phase_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM phases 
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = phase_links.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all phase links"
  ON phase_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Function to calculate onboarding percentage
CREATE OR REPLACE FUNCTION calculate_onboarding_percent(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_required INTEGER;
  total_completed INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(required_fields_total), 0),
    COALESCE(SUM(required_fields_completed), 0)
  INTO total_required, total_completed
  FROM onboarding_steps
  WHERE project_id = p_project_id;
  
  IF total_required = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((total_completed::FLOAT / total_required::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update onboarding_percent
CREATE OR REPLACE FUNCTION update_onboarding_percent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET onboarding_percent = calculate_onboarding_percent(NEW.project_id),
      updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_onboarding_percent ON onboarding_steps;
CREATE TRIGGER trigger_update_onboarding_percent
AFTER INSERT OR UPDATE ON onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_percent();

-- Function to initialize Launch Kit project
CREATE OR REPLACE FUNCTION initialize_launch_kit_project(p_project_id UUID)
RETURNS void AS $$
DECLARE
  v_phase_1_id UUID;
  v_phase_2_id UUID;
  v_phase_3_id UUID;
  v_phase_4_id UUID;
BEGIN
  -- Insert onboarding steps
  INSERT INTO onboarding_steps (project_id, step_number, step_id, title, time_estimate, required_fields_total)
  VALUES
    (p_project_id, 1, 'STEP_1', 'Tell us who you are', 'About 5 minutes', 7),
    (p_project_id, 2, 'STEP_2', 'Show us your brand', 'About 8 minutes', 7),
    (p_project_id, 3, 'STEP_3', 'Switch on the site', 'About 5 minutes', 4);
  
  -- Insert phases and get their IDs
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 1, 'PHASE_1', 'Inputs & clarity', 'Lock the message and plan.', 'Days 0-2')
  RETURNING id INTO v_phase_1_id;
  
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 2, 'PHASE_2', 'Words that sell', 'We write your 3 pages.', 'Days 3-5')
  RETURNING id INTO v_phase_2_id;
  
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 3, 'PHASE_3', 'Design & build', 'We turn copy into a 3 page site.', 'Days 6-10')
  RETURNING id INTO v_phase_3_id;
  
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 4, 'PHASE_4', 'Test', 'We connect domain, test and go live.', 'Days 11-14')
  RETURNING id INTO v_phase_4_id;
  
  -- Insert checklist items for Phase 1
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_1_id, 'Onboarding steps completed', 1),
    (v_phase_1_id, 'Brand / strategy call completed', 2),
    (v_phase_1_id, 'Simple 14 day plan agreed', 3);
  
  -- Insert checklist items for Phase 2
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_2_id, 'Draft homepage copy ready', 1),
    (v_phase_2_id, 'Draft offer / services page ready', 2),
    (v_phase_2_id, 'Draft contact / about copy ready', 3),
    (v_phase_2_id, 'You reviewed and approved copy', 4);
  
  -- Insert checklist items for Phase 3
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_3_id, 'Site layout built for all 3 pages', 1),
    (v_phase_3_id, 'Mobile checks done', 2),
    (v_phase_3_id, 'Testimonials and proof added', 3),
    (v_phase_3_id, 'Staging link shared with you', 4);
  
  -- Insert checklist items for Phase 4
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_4_id, 'Forms tested', 1),
    (v_phase_4_id, 'Domain connected', 2),
    (v_phase_4_id, 'Final tweaks applied', 3),
    (v_phase_4_id, 'Loom walkthrough recorded and shared', 4);
END;
$$ LANGUAGE plpgsql;

-- Function to initialize Growth Kit project
CREATE OR REPLACE FUNCTION initialize_growth_kit_project(p_project_id UUID)
RETURNS void AS $$
DECLARE
  v_phase_1_id UUID;
  v_phase_2_id UUID;
  v_phase_3_id UUID;
  v_phase_4_id UUID;
BEGIN
  -- Insert onboarding steps for Growth Kit
  INSERT INTO onboarding_steps (project_id, step_number, step_id, title, time_estimate, required_fields_total)
  VALUES
    (p_project_id, 1, 'STEP_1', 'Snapshot and main offer', 'About 8 minutes', 12),
    (p_project_id, 2, 'STEP_2', 'Clients, proof and content fuel', 'About 10 minutes', 9),
    (p_project_id, 3, 'STEP_3', 'Systems and launch', 'About 7 minutes', 10);
  
  -- Insert phases and get their IDs
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 1, 'PHASE_1', 'Strategy locked in', 'Offer, goal and funnel map agreed.', 'Days 0-2')
  RETURNING id INTO v_phase_1_id;
  
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 2, 'PHASE_2', 'Copy & email engine', 'We write your site copy and 5 emails.', 'Days 3-5')
  RETURNING id INTO v_phase_2_id;
  
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 3, 'PHASE_3', 'Build the funnel', 'Pages, lead magnet and blog hub built.', 'Days 6-10')
  RETURNING id INTO v_phase_3_id;
  
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 4, 'PHASE_4', 'Test & handover', 'We test the full journey and go live.', 'Days 11-14')
  RETURNING id INTO v_phase_4_id;
  
  -- Insert checklist items for Phase 1
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_1_id, 'Onboarding complete', 1),
    (v_phase_1_id, 'Strategy / funnel call done', 2),
    (v_phase_1_id, 'Main offer + 90 day goal confirmed', 3),
    (v_phase_1_id, 'Simple funnel map agreed', 4);
  
  -- Insert checklist items for Phase 2
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_2_id, 'Draft website copy ready', 1),
    (v_phase_2_id, 'Draft 5-email nurture sequence ready', 2),
    (v_phase_2_id, 'You reviewed and approved copy', 3),
    (v_phase_2_id, 'Any changes locked in', 4);
  
  -- Insert checklist items for Phase 3
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_3_id, '4-6 page site built on staging', 1),
    (v_phase_3_id, 'Lead magnet page + thank you page built', 2),
    (v_phase_3_id, 'Opt-in forms wired to email platform', 3),
    (v_phase_3_id, 'Blog hub and 1-2 starter posts set up', 4),
    (v_phase_3_id, 'Staging link shared', 5);
  
  -- Insert checklist items for Phase 4
  INSERT INTO checklist_items (phase_id, label, sort_order)
  VALUES
    (v_phase_4_id, 'Funnel tested from first visit to booked call', 1),
    (v_phase_4_id, 'Domain connected', 2),
    (v_phase_4_id, 'Tracking checked (Analytics / pixels)', 3),
    (v_phase_4_id, '5-email sequence switched on', 4),
    (v_phase_4_id, 'Loom walkthrough recorded and shared', 5);
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE phases;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;

