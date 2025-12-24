-- Inclufy Database Setup Script
-- Run this in Supabase SQL editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (Multi-tenancy foundation)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{
    "features": {
      "campaigns": true,
      "journeys": true,
      "ai": false,
      "whiteLabel": false
    },
    "limits": {
      "contacts": 1000,
      "emailsPerMonth": 10000,
      "users": 5
    }
  }'::jsonb,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'multi-channel')),
  
  -- Scheduling
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  
  -- Budget
  budget_amount DECIMAL(10, 2),
  budget_currency TEXT DEFAULT 'USD',
  spent_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Audience
  audience_filters JSONB DEFAULT '{"segments": [], "tags": [], "lists": []}'::jsonb,
  estimated_audience_size INTEGER DEFAULT 0,
  
  -- Content
  content JSONB DEFAULT '{}'::jsonb,
  
  -- Settings
  settings JSONB DEFAULT '{
    "ai_optimization": false,
    "send_time_optimization": false,
    "frequency_cap": null,
    "ab_test": null
  }'::jsonb,
  
  -- Tracking
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journeys
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  
  -- Journey Definition (React Flow)
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Entry Rules
  entry_rules JSONB DEFAULT '{
    "triggers": [],
    "segments": [],
    "allow_re_entry": false,
    "re_entry_delay_days": null
  }'::jsonb,
  
  -- Exit Rules
  exit_rules JSONB DEFAULT '{
    "goals": [],
    "timeout_days": null
  }'::jsonb,
  
  -- Settings
  settings JSONB DEFAULT '{
    "timezone": "UTC",
    "quiet_hours": null,
    "ai_optimization": false
  }'::jsonb,
  
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identity
  email TEXT,
  phone TEXT,
  external_id TEXT,
  
  -- Profile
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE NULL
    END
  ) STORED,
  
  -- Demographics
  birthday DATE,
  gender TEXT,
  timezone TEXT,
  language TEXT DEFAULT 'en',
  country TEXT,
  city TEXT,
  
  -- Attributes (custom fields)
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Segmentation
  tags TEXT[] DEFAULT '{}',
  lists UUID[] DEFAULT '{}',
  segments JSONB DEFAULT '[]'::jsonb,
  
  -- Engagement
  last_seen_at TIMESTAMPTZ,
  engagement_score INTEGER DEFAULT 0,
  
  -- Consent
  email_consent BOOLEAN DEFAULT true,
  sms_consent BOOLEAN DEFAULT false,
  push_consent BOOLEAN DEFAULT false,
  
  -- Meta
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, email),
  UNIQUE(organization_id, external_id)
);

-- Journey Enrollments
CREATE TABLE journey_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited', 'goal_reached')),
  
  -- Progress tracking
  current_node_id TEXT,
  current_node_entered_at TIMESTAMPTZ,
  path JSONB DEFAULT '[]'::jsonb, -- Array of {node_id, entered_at, exited_at}
  
  -- Journey data context
  context_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,
  
  UNIQUE(journey_id, contact_id)
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Event Info
  event_type TEXT NOT NULL,
  event_name TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  
  -- Attribution
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  journey_enrollment_id UUID REFERENCES journey_enrollments(id) ON DELETE SET NULL,
  
  -- Context
  channel TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Email Events (specific email tracking)
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE,
  
  -- Email specific
  subject TEXT,
  from_email TEXT,
  to_email TEXT,
  
  -- Status
  status TEXT CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  
  -- Additional data
  esp_event_id TEXT,
  esp_data JSONB DEFAULT '{}'::jsonb,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue Events
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Revenue data
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  order_id TEXT,
  products JSONB DEFAULT '[]'::jsonb,
  
  -- Attribution
  attribution_data JSONB DEFAULT '{
    "first_touch": null,
    "last_touch": null,
    "multi_touch": []
  }'::jsonb,
  
  -- Source
  source_type TEXT,
  source_id TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'landing_page', 'journey')),
  category TEXT,
  
  -- Content
  content JSONB NOT NULL,
  thumbnail_url TEXT,
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats
  uses_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1),
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'static' CHECK (type IN ('static', 'dynamic')),
  
  -- For dynamic lists
  filters JSONB DEFAULT '{}'::jsonb,
  
  -- Stats
  contact_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

-- Segments
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Segment definition
  conditions JSONB NOT NULL DEFAULT '{"operator": "AND", "conditions": []}'::jsonb,
  
  -- Cached stats
  contact_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars of key for identification
  key_hash TEXT NOT NULL, -- Hashed full key
  
  permissions TEXT[] DEFAULT '{}'::text[],
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  provider TEXT NOT NULL, -- salesforce, hubspot, stripe, etc.
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  
  -- Credentials (encrypted)
  credentials JSONB DEFAULT '{}'::jsonb,
  
  -- Config
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Sync status
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, provider)
);

-- Create indexes for performance
CREATE INDEX idx_campaigns_org_status ON campaigns(organization_id, status);
CREATE INDEX idx_campaigns_dates ON campaigns(starts_at, ends_at);
CREATE INDEX idx_journeys_org_status ON journeys(organization_id, status);
CREATE INDEX idx_contacts_org_email ON contacts(organization_id, email);
CREATE INDEX idx_contacts_tags ON contacts USING GIN (tags);
CREATE INDEX idx_events_org_contact ON events(organization_id, contact_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_revenue_events_org ON revenue_events(organization_id, timestamp);
CREATE INDEX idx_journey_enrollments_journey ON journey_enrollments(journey_id, status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON journeys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizations: Users can only see organizations they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Campaigns: Users can view/edit campaigns in their organizations
CREATE POLICY "Users can manage organization campaigns" ON campaigns
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Add more specific policies based on roles)

-- Create initial views for analytics
CREATE VIEW campaign_analytics AS
SELECT 
  c.id,
  c.organization_id,
  c.name,
  c.status,
  c.type,
  COUNT(DISTINCT e.contact_id) as unique_recipients,
  COUNT(CASE WHEN e.event_type = 'email_sent' THEN 1 END) as sent_count,
  COUNT(CASE WHEN e.event_type = 'email_opened' THEN 1 END) as opened_count,
  COUNT(CASE WHEN e.event_type = 'email_clicked' THEN 1 END) as clicked_count,
  COUNT(CASE WHEN e.event_type = 'converted' THEN 1 END) as converted_count,
  COALESCE(SUM(r.amount), 0) as revenue_generated
FROM campaigns c
LEFT JOIN events e ON c.id = e.campaign_id
LEFT JOIN revenue_events r ON c.id = r.campaign_id
GROUP BY c.id;

-- Create view for contact engagement scores
CREATE VIEW contact_engagement_scores AS
SELECT 
  c.id,
  c.organization_id,
  COUNT(CASE WHEN e.event_type = 'email_opened' THEN 1 END) * 1 +
  COUNT(CASE WHEN e.event_type = 'email_clicked' THEN 1 END) * 3 +
  COUNT(CASE WHEN e.event_type = 'converted' THEN 1 END) * 10 as engagement_score,
  MAX(e.timestamp) as last_activity
FROM contacts c
LEFT JOIN events e ON c.id = e.contact_id 
  AND e.timestamp > NOW() - INTERVAL '90 days'
GROUP BY c.id, c.organization_id;