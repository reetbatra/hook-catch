-- hookcatch database schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Endpoints table
CREATE TABLE IF NOT EXISTS endpoints (
  id TEXT PRIMARY KEY,
  readonly_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  method TEXT NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}',
  body TEXT,
  parsed_body JSONB,
  source_ip TEXT,
  query_params JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_endpoint_id ON events(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_endpoints_expires_at ON endpoints(expires_at);
CREATE INDEX IF NOT EXISTS idx_endpoints_readonly_id ON endpoints(readonly_id);

-- Enable RLS
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required)
CREATE POLICY "public_read_endpoints" ON endpoints FOR SELECT USING (true);
CREATE POLICY "public_insert_endpoints" ON endpoints FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_endpoints" ON endpoints FOR DELETE USING (true);

CREATE POLICY "public_read_events" ON events FOR SELECT USING (true);
CREATE POLICY "public_insert_events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_events" ON events FOR DELETE USING (true);

-- Enable Realtime on events table
ALTER PUBLICATION supabase_realtime ADD TABLE events;
