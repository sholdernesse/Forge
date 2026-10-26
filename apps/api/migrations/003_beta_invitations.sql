CREATE TABLE IF NOT EXISTS beta_invitations (
  user_id text PRIMARY KEY,
  country text NOT NULL CHECK (country ~ '^[A-Z]{2}$'),
  invited_at timestamptz NOT NULL DEFAULT NOW(),
  adult_confirmed_at timestamptz,
  revoked boolean NOT NULL DEFAULT false
);
