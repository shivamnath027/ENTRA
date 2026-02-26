-- migrations/002_access_control.sql

-- Gate controller device (hardware-agnostic)
CREATE TABLE IF NOT EXISTS gate_controllers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  gate_id UUID NOT NULL REFERENCES gates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- endpoint to send open/close commands (can be local LAN url)
  endpoint_url TEXT NOT NULL,
  -- simple shared secret (store hash; send plaintext only from secure admin UI)
  api_key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gate_id)
);

-- Access decision log (vehicle scans + decisions)
CREATE TABLE IF NOT EXISTS access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  gate_id UUID NOT NULL REFERENCES gates(id) ON DELETE RESTRICT,
  controller_id UUID REFERENCES gate_controllers(id) ON DELETE SET NULL,

  scanned_by_guard_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- scan inputs
  tag_uid TEXT,
  vehicle_number TEXT,

  -- resolved entity
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  flat_id UUID REFERENCES flats(id) ON DELETE SET NULL,

  decision TEXT NOT NULL CHECK (decision IN ('ALLOW','DENY','MANUAL_REVIEW')),
  reason TEXT,
  opened_gate BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_events_society_gate_created
  ON access_events (society_id, gate_id, created_at DESC);

-- updated_at trigger for gate_controllers
DROP TRIGGER IF EXISTS trg_gate_controllers_updated_at ON gate_controllers;
CREATE TRIGGER trg_gate_controllers_updated_at
BEFORE UPDATE ON gate_controllers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
