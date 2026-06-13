-- ============================================================================
-- PHASE 1: Multi-Tenant PostgreSQL Schema
-- Agency Orchestration Platform — Paperclip-style
-- ============================================================================
-- Run this in Supabase SQL Editor (or via psql)
-- Every table enforces client_id isolation for multi-tenancy.

-- ============================================================================
-- 1. CLIENTS (Tenant roots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,                     -- e.g. 'ayan-realty'
  logo_url TEXT,
  color TEXT DEFAULT '#8b5cf6',                   -- accent color for sidebar
  settings JSONB DEFAULT '{}'::jsonb,             -- per-client config
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. USERS (can belong to multiple clients via membership)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'            -- owner | admin | member
    CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- ============================================================================
-- 3. ORG CHART (Agent hierarchy per client)
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Default',          -- e.g. "Real Estate Division"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. AGENTS (registered per client with role & budget)
-- ============================================================================
CREATE TYPE agent_role AS ENUM ('ceo', 'cto', 'worker');

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_chart_id UUID REFERENCES org_charts(id),
  slug TEXT NOT NULL,                             -- e.g. 'intake-researcher'
  name TEXT NOT NULL,                             -- e.g. 'Intake Researcher'
  role agent_role NOT NULL DEFAULT 'worker',
  emoji TEXT DEFAULT '🤖',
  color TEXT DEFAULT '#8b5cf6',
  status TEXT DEFAULT 'active'                    -- active | paused | error
    CHECK (status IN ('active', 'paused', 'error')),
  api_endpoint TEXT,                              -- backend URL if external
  config JSONB DEFAULT '{}'::jsonb,               -- model, temperature, etc.
  token_budget_per_month NUMERIC DEFAULT 1000000, -- hard-stop token limit
  tokens_used_this_month NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, slug)
);

-- ============================================================================
-- 5. GOALS (high-level objectives set by user → CEO agent)
-- ============================================================================
CREATE TYPE goal_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_chart_id UUID REFERENCES org_charts(id),
  title TEXT NOT NULL,
  description TEXT,
  status goal_status DEFAULT 'active',
  priority INT DEFAULT 1,                         -- 1 (urgent) to 5 (backlog)
  budget_tokens NUMERIC DEFAULT 500000,           -- max tokens for this goal
  created_by UUID REFERENCES users(id),
  assigned_to_ceo UUID REFERENCES agents(id),     -- CEO agent handling this
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. TICKETS (CEO breaks goals into tickets → CTO routes → Workers execute)
-- ============================================================================
CREATE TYPE ticket_status AS ENUM (
  'open', 'assigned', 'in_progress', 'review', 'completed', 'blocked', 'cancelled'
);
CREATE TYPE ticket_priority AS ENUM ('critical', 'high', 'medium', 'low', 'backlog');

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  parent_ticket_id UUID REFERENCES tickets(id),   -- sub-tickets for hierarchy
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  assigned_by UUID REFERENCES agents(id),         -- CTO agent who assigned
  assigned_to UUID REFERENCES agents(id),         -- Worker agent doing the work
  token_cost NUMERIC DEFAULT 0,                   -- accumulated token spend
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tickets_client_status ON tickets(client_id, status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);

-- ============================================================================
-- 7. TICKET MESSAGES (threaded conversations inside a ticket)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
  sender_id UUID,                                 -- user_id or agent_id
  sender_name TEXT,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,          -- file URLs, images
  token_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);

-- ============================================================================
-- 8. EXECUTION LOGS (agent tool-calls, heartbeats, streaming logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id),
  action TEXT NOT NULL,                           -- 'tool_call', 'heartbeat', 'thought', 'error'
  content TEXT,
  tokens_used INT DEFAULT 0,
  duration_ms INT DEFAULT 0,                      -- how long the action took
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_execution_logs_ticket ON execution_logs(ticket_id, created_at);
CREATE INDEX idx_execution_logs_agent ON execution_logs(agent_id, created_at);

-- ============================================================================
-- 9. AGENT BUDGET TRACKING (token/cost per agent per month)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_budget_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                           -- '2026-06' (YYYY-MM)
  tokens_used INT DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, period)
);

-- ============================================================================
-- 10. HEARTBEAT LOG (agent ping tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS heartbeat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'alive',
  message TEXT,
  next_check_at TIMESTAMPTZ,                     -- when to check again
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_heartbeat_agent ON heartbeat_log(agent_id, checked_at DESC);

-- ============================================================================
-- INDEXES FOR MULTI-TENANT QUERIES
-- ============================================================================
CREATE INDEX idx_global_client_id ON ticket_messages(client_id);
CREATE INDEX idx_global_exec_logs_client ON execution_logs(client_id);
CREATE INDEX idx_goals_client ON goals(client_id);
CREATE INDEX idx_tickets_client ON tickets(client_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — per-client data isolation
-- ============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_budget_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_log ENABLE ROW LEVEL SECURITY;

-- In Supabase, RLS policies use the auth.uid() → client_users lookup
CREATE POLICY client_isolation ON tickets
  USING (client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  ));

-- Apply similar policy to other tables (one per table)
CREATE POLICY client_isolation_goals ON goals
  USING (client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  ));

CREATE POLICY client_isolation_agents ON agents
  USING (client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  ));

CREATE POLICY client_isolation_logs ON execution_logs
  USING (client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  ));

-- ============================================================================
-- SEED DATA: Default client + demo data
-- ============================================================================
INSERT INTO clients (id, name, slug, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ayan Agency', 'ayan-agency', '#f5b041')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO org_charts (client_id, label) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Default')
ON CONFLICT DO NOTHING;

-- Default CEO & CTO agent
INSERT INTO agents (client_id, slug, name, role, emoji, color, status, api_endpoint) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ceo', 'CEO Agent', 'ceo', '👑', '#8b5cf6', 'active', 'http://18.213.66.136:8000/api/ceo/chat'),
  ('00000000-0000-0000-0000-000000000001', 'cto', 'CTO Agent', 'cto', '🔧', '#3b82f6', 'active', 'http://18.213.66.136:8000/api/cto/chat')
ON CONFLICT (client_id, slug) DO NOTHING;

-- Worker agents
INSERT INTO agents (client_id, slug, name, role, emoji, color, status, api_endpoint) VALUES
  ('00000000-0000-0000-0000-000000000001', 'intake-researcher', 'Intake Researcher', 'worker', '🔍', '#45aaf2', 'active', 'http://18.213.66.136:8000/api/agents/intake-researcher/chat'),
  ('00000000-0000-0000-0000-000000000001', 'content-creator', 'Content Creator', 'worker', '✍️', '#2ed573', 'active', 'http://18.213.66.136:8000/api/agents/content-creator/chat'),
  ('00000000-0000-0000-0000-000000000001', 'seo-engine', 'SEO Engine', 'worker', '📈', '#ff9f43', 'active', 'http://18.213.66.136:8000/api/agents/seo-engine/chat'),
  ('00000000-0000-0000-0000-000000000001', 'ads-runner', 'Ads Runner', 'worker', '📢', '#ef4444', 'active', 'http://18.213.66.136:8000/api/agents/ads-runner/chat'),
  ('00000000-0000-0000-0000-000000000001', 'analytics-bot', 'Analytics Bot', 'worker', '📊', '#a55eea', 'active', 'http://18.213.66.136:8000/api/agents/analytics-bot/chat'),
  ('00000000-0000-0000-0000-000000000001', 'sales-closer', 'Sales Closer', 'worker', '💼', '#f368e0', 'active', 'http://18.213.66.136:8000/api/agents/sales-closer/chat'),
  ('00000000-0000-0000-0000-000000000001', 'client-success', 'Client Success', 'worker', '🤝', '#26de81', 'active', 'http://18.213.66.136:8000/api/agents/client-success/chat'),
  ('00000000-0000-0000-0000-000000000001', 'review-qc', 'Review & QC', 'worker', '✓', '#fd9644', 'active', 'http://18.213.66.136:8000/api/agents/review-qc/chat')
ON CONFLICT (client_id, slug) DO NOTHING;
