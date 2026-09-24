CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  user_id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  revision UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dashboard_snapshots_state_object CHECK (jsonb_typeof(state) = 'object')
);

CREATE INDEX IF NOT EXISTS dashboard_snapshots_updated_at_idx
  ON dashboard_snapshots (updated_at DESC);
