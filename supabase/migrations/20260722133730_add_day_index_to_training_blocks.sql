ALTER TABLE training_blocks ADD COLUMN IF NOT EXISTS day_index integer NOT NULL DEFAULT 0;
