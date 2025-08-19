-- Engineering Project Management System
-- Database Setup Script for Supabase
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members Table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  po_number TEXT,
  client_name TEXT,
  location TEXT,
  industry TEXT,
  sales_order_date DATE,
  project_value DECIMAL(15,2),
  payment_terms TEXT,
  payment_schedule TEXT,
  kickoff_notes TEXT,
  production_notes TEXT,
  scope JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  specifications JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'ready', 'shipped', 'installed')),
  manufacturing_serial TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Progress Table
CREATE TABLE IF NOT EXISTS project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase_name)
);

-- Project Documents Table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT DEFAULT 'general',
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Documents Table
CREATE TABLE IF NOT EXISTS equipment_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT DEFAULT 'specification',
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_name ON projects(client_name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_equipment_project_id ON equipment(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_progress_project_id ON project_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_docs_equipment_id ON equipment_documents(equipment_id);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_documents ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their organizations" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Organization members policies
CREATE POLICY "Users can view organization members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization members" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Projects policies
CREATE POLICY "Users can view projects in their organizations" ON projects
  FOR SELECT USING (
    org_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their organizations" ON projects
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their organizations" ON projects
  FOR UPDATE USING (
    org_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their organizations" ON projects
  FOR DELETE USING (
    org_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Equipment policies
CREATE POLICY "Users can view equipment for their organization's projects" ON equipment
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage equipment for their organization's projects" ON equipment
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Project progress policies
CREATE POLICY "Users can view progress for their organization's projects" ON project_progress
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage progress for their organization's projects" ON project_progress
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Project documents policies
CREATE POLICY "Users can view documents for their organization's projects" ON project_documents
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage documents for their organization's projects" ON project_documents
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Equipment documents policies
CREATE POLICY "Users can view equipment documents for their organization's projects" ON equipment_documents
  FOR SELECT USING (
    equipment_id IN (
      SELECT e.id FROM equipment e
      INNER JOIN projects p ON e.project_id = p.id
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage equipment documents for their organization's projects" ON equipment_documents
  FOR ALL USING (
    equipment_id IN (
      SELECT e.id FROM equipment e
      INNER JOIN projects p ON e.project_id = p.id
      INNER JOIN organization_members om ON p.org_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket setup (run this in the Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Storage policies for project-files bucket
-- CREATE POLICY "Users can upload files for their organization's projects" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'project-files' AND
--     auth.uid() IN (
--       SELECT om.user_id FROM organization_members om
--       INNER JOIN projects p ON p.org_id = om.organization_id
--       WHERE p.id::text = (storage.foldername(name))[1]
--     )
--   );

-- CREATE POLICY "Users can view files for their organization's projects" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'project-files' AND
--     auth.uid() IN (
--       SELECT om.user_id FROM organization_members om
--       INNER JOIN projects p ON p.org_id = om.organization_id
--       WHERE p.id::text = (storage.foldername(name))[1]
--     )
--   );

-- CREATE POLICY "Users can delete files for their organization's projects" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'project-files' AND
--     auth.uid() IN (
--       SELECT om.user_id FROM organization_members om
--       INNER JOIN projects p ON p.org_id = om.organization_id
--       WHERE p.id::text = (storage.foldername(name))[1]
--     )
--   );

-- Completed database setup
SELECT 'Database setup completed successfully!' as status;