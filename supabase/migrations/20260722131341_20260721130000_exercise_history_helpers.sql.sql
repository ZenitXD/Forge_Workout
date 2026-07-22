/*
# Exercise History Helper + Workout Completion Tracking

## What This Does
1. Adds an `exercise_last_performed` SQL function that returns the most recent
   performance date for each exercise. Used by the generation engine's rotation
   freshness scoring to avoid repeating the same exercise session after session.
2. Adds a `weekly_muscle_volume` SQL function that returns trailing 7-day
   hard-set counts per primary muscle. Used for volume tracking and balanced
   muscle development.
3. Adds a `completed_workout_count` function to count completed workouts in
   the current training block — used for phase advancement decisions.

## New Database Objects
- `exercise_last_performed()` — returns table of (exercise_id text, last_performed timestamptz, days_ago int)
- `weekly_muscle_volume()` — returns table of (muscle text, weekly_sets int)
- `completed_workout_count(block_id uuid)` — returns int

## Security
- All functions run with SECURITY DEFINER so they can join across tables
  even if RLS policies evolve. They only read data, never write.
- No new tables — these are views/functions over existing tables.

## Important Notes
1. The functions are read-only and safe to call from the anon client.
2. `days_ago` is computed at query time, so it's always current.
3. `weekly_muscle_volume` counts only completed sets (completed = true).
4. `completed_workout_count` counts workouts where completed = true within
   a given training block.
*/

-- ============================================================
-- exercise_last_performed: returns last performance date per exercise
-- ============================================================
CREATE OR REPLACE FUNCTION exercise_last_performed()
RETURNS TABLE (exercise_id text, last_performed timestamptz, days_ago int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    we.exercise_id,
    MAX(ls.performed_at) AS last_performed,
    CASE
      WHEN MAX(ls.performed_at) IS NULL THEN 999
      ELSE EXTRACT(DAY FROM now() - MAX(ls.performed_at))::int
    END AS days_ago
  FROM workout_exercises we
  INNER JOIN logged_sets ls ON ls.workout_exercise_id = we.id
  WHERE ls.completed = true
  GROUP BY we.exercise_id;
$$;

-- ============================================================
-- weekly_muscle_volume: trailing 7-day set count per primary muscle
-- ============================================================
CREATE OR REPLACE FUNCTION weekly_muscle_volume()
RETURNS TABLE (muscle text, weekly_sets int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    e.primary_muscle AS muscle,
    COUNT(ls.id)::int AS weekly_sets
  FROM logged_sets ls
  INNER JOIN workout_exercises we ON we.id = ls.workout_exercise_id
  INNER JOIN exercises e ON e.id = we.exercise_id
  INNER JOIN workouts w ON w.id = we.workout_id
  WHERE ls.completed = true
    AND ls.performed_at >= now() - interval '7 days'
    AND w.completed = true
  GROUP BY e.primary_muscle;
$$;

-- ============================================================
-- completed_workout_count: count completed workouts in a block
-- ============================================================
CREATE OR REPLACE FUNCTION completed_workout_count(p_block_id uuid)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::int
  FROM workouts
  WHERE training_block_id = p_block_id
    AND completed = true;
$$;

-- ============================================================
-- Index for faster history queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_logged_sets_performed ON logged_sets(performed_at);
CREATE INDEX IF NOT EXISTS idx_workouts_completed ON workouts(completed, training_block_id);
