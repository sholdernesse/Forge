-- Durable rolling-hour quota shared by API replicas. No photos or nutrition data.
CREATE TABLE IF NOT EXISTS meal_photo_limits (
  user_id text PRIMARY KEY,
  attempts timestamptz[] NOT NULL DEFAULT '{}'
);
