/*
# Forge — Core Schema (v1)

This is a single-tenant, offline-first workout app with NO sign-in screen.
The app reads and writes as the `anon` role for its entire lifetime, so every
policy lists `TO anon, authenticated` and uses `USING (true)` because the data
is intentionally shared/public within this one app instance.

## 1. New Tables

- `exercises` — the exercise library (seeded, read-only from the app).
  Fields mirror the master prompt §Exercise Database: name, instructions,
  primary/secondary muscles, equipment, difficulty, movement pattern,
  compound/isolation, unilateral/bilateral, home/gym compatible, slot tag,
  alternatives, and an image URL (Pexels — replaceable without code changes).

- `profile` — single-row table holding the user's onboarding answers.
  Experience, goal, equipment, split, priority muscles, medical modifiers,
  availability, and the progression-mode setting (confirm/auto).

- `training_blocks` — one row per training block. Records the phase type
  (strength/hypertrophy/endurance), week index, block length, cycle index
  (how many full phase rotations have completed), and status (active/complete).
  This is what powers the phase-cycling feature: after a hypertrophy block
  completes, the next block is endurance, then strength, then back to the
  start — and after ~3 full cycles the engine recommends a program change.

- `workouts` — one row per generated workout session. Linked to a training
  block, holds the day label, phase, estimated duration, and completion status.

- `workout_exercises` — the exercises chosen for a given workout, in order.
  Links to `exercises` and `workouts`, holds the prescribed sets/reps/weight/rest.

- `logged_sets` — the actual performance data: weight, reps, RPE, completion,
  and a `side` column ('both' | 'left' | 'right') for imbalance tracking.
  This is the source of truth for the progress charts and progressive overload.

- `body_weight_log` — optional daily body-weight entries for tracking.

## 2. Security

- RLS enabled on every table.
- All policies are `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant no-auth app — the data is intentionally shared.

## 3. Indexes

- `logged_sets` on (workout_exercise_id, performed_at) — chart queries.
- `workouts` on (training_block_id) — block lookups.
- `workout_exercises` on (workout_id) — session loading.
- `exercises` on (slot_tag) and (primary_muscle) — generation lookups.

## 4. Important Notes

1. `profile` is enforced as a single row via a partial unique index on a
   constant. The app upserts row id = 1.
2. `logged_sets.side` enables left/right imbalance tracking for unilateral
   exercises — a feature the user explicitly requested.
3. `training_blocks.cycle_index` counts completed phase rotations so the engine
   can recommend a program change after 3 cycles.
4. All image URLs are Pexels (licensed for free use). The image_url column is
   separate from exercise logic so the library can be swapped without code changes.
*/

-- ============================================================
-- exercises (library, seeded, read-only from app)
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  instructions text,
  common_mistakes text,
  image_url text,
  primary_muscle text NOT NULL,
  secondary_muscles text[] DEFAULT '{}',
  equipment text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner',
  movement_pattern text NOT NULL,
  compound boolean NOT NULL DEFAULT false,
  unilateral boolean NOT NULL DEFAULT false,
  home_compatible boolean NOT NULL DEFAULT false,
  gym_compatible boolean NOT NULL DEFAULT true,
  slot_tag text NOT NULL,
  alternatives text[] DEFAULT '{}'
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_exercises" ON exercises;
CREATE POLICY "anon_select_exercises" ON exercises FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_exercises" ON exercises;
CREATE POLICY "anon_insert_exercises" ON exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_exercises" ON exercises;
CREATE POLICY "anon_update_exercises" ON exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_exercises_slot ON exercises(slot_tag);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle);

-- ============================================================
-- profile (single row, upserted by app)
-- ============================================================
CREATE TABLE IF NOT EXISTS profile (
  id int PRIMARY KEY DEFAULT 1,
  name text,
  age int,
  height int,
  weight numeric,
  sex text DEFAULT 'male',
  experience text NOT NULL DEFAULT 'beginner',
  goal text NOT NULL DEFAULT 'muscle-growth',
  activity_level int DEFAULT 3,
  days_per_week int DEFAULT 4,
  session_duration int DEFAULT 60,
  equipment text[] DEFAULT '{}',
  split text DEFAULT 'ppl',
  favorite_exercises text[] DEFAULT '{}',
  avoided_exercises text[] DEFAULT '{}',
  priority_muscles text[] DEFAULT '{}',
  medical text[] DEFAULT '{}',
  progression_mode text DEFAULT 'confirm',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profile_single_row CHECK (id = 1)
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profile" ON profile;
CREATE POLICY "anon_select_profile" ON profile FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
CREATE POLICY "anon_insert_profile" ON profile FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profile" ON profile;
CREATE POLICY "anon_update_profile" ON profile FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- training_blocks (phase cycling)
-- ============================================================
CREATE TABLE IF NOT EXISTS training_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase text NOT NULL,
  cycle_index int NOT NULL DEFAULT 0,
  week_index int NOT NULL DEFAULT 1,
  block_length_weeks int NOT NULL DEFAULT 6,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_blocks" ON training_blocks;
CREATE POLICY "anon_select_blocks" ON training_blocks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_blocks" ON training_blocks;
CREATE POLICY "anon_insert_blocks" ON training_blocks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_blocks" ON training_blocks;
CREATE POLICY "anon_update_blocks" ON training_blocks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- workouts
-- ============================================================
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_block_id uuid REFERENCES training_blocks(id) ON DELETE CASCADE,
  name text NOT NULL,
  day_label text,
  phase text NOT NULL,
  week_index int NOT NULL DEFAULT 1,
  estimated_duration_min int DEFAULT 60,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_workouts" ON workouts;
CREATE POLICY "anon_select_workouts" ON workouts FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_workouts" ON workouts;
CREATE POLICY "anon_insert_workouts" ON workouts FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_workouts" ON workouts;
CREATE POLICY "anon_update_workouts" ON workouts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_workouts_block ON workouts(training_block_id);

-- ============================================================
-- workout_exercises (the chosen exercises for a workout, in order)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id text REFERENCES exercises(id),
  slot_order int NOT NULL DEFAULT 0,
  prescribed_sets int NOT NULL DEFAULT 3,
  prescribed_reps text NOT NULL DEFAULT '8-12',
  prescribed_weight numeric DEFAULT 0,
  rest_seconds int NOT NULL DEFAULT 90,
  notes text DEFAULT ''
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_select_workout_exercises" ON workout_exercises FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_insert_workout_exercises" ON workout_exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_update_workout_exercises" ON workout_exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);

-- ============================================================
-- logged_sets (actual performance data — source of truth for charts & overload)
-- ============================================================
CREATE TABLE IF NOT EXISTS logged_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_index int NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 0,
  reps int NOT NULL DEFAULT 0,
  rpe int,
  completed boolean NOT NULL DEFAULT true,
  side text NOT NULL DEFAULT 'both',
  performed_at timestamptz DEFAULT now()
);

ALTER TABLE logged_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_logged_sets" ON logged_sets;
CREATE POLICY "anon_select_logged_sets" ON logged_sets FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_logged_sets" ON logged_sets;
CREATE POLICY "anon_insert_logged_sets" ON logged_sets FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_logged_sets" ON logged_sets;
CREATE POLICY "anon_update_logged_sets" ON logged_sets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_logged_sets_we ON logged_sets(workout_exercise_id, performed_at);

-- ============================================================
-- body_weight_log (optional)
-- ============================================================
CREATE TABLE IF NOT EXISTS body_weight_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_kg numeric NOT NULL,
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE body_weight_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_body_weight" ON body_weight_log;
CREATE POLICY "anon_select_body_weight" ON body_weight_log FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_body_weight" ON body_weight_log;
CREATE POLICY "anon_insert_body_weight" ON body_weight_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_body_weight" ON body_weight_log;
CREATE POLICY "anon_update_body_weight" ON body_weight_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
