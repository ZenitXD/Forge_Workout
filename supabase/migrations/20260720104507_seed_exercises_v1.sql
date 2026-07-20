/*
# Seed Exercise Database (v1)

Populates the `exercises` table with a starter library covering Push, Pull,
and Legs day slots. Each exercise has a Pexels image URL (free to use), full
metadata for the generation engine, and instructions.

## Exercises Added (12 total)

Push day:
- barbell-bench-press (horizontal press, compound)
- dumbbell-bench-press (horizontal press, compound)
- incline-dumbbell-press (incline press, compound)
- overhead-press (vertical press, compound)
- dumbbell-lateral-raise (lateral shoulder, isolation)
- cable-triceps-pushdown (triceps, isolation)
- overhead-triceps-extension (triceps, isolation)

Pull day:
- lat-pulldown (vertical pull, compound)
- barbell-row (horizontal pull, compound)
- seated-cable-row (horizontal pull, compound)
- dumbbell-biceps-curl (biceps, isolation)

Legs day:
- barbell-squat (squat, compound)
- dumbbell-split-squat (squat, unilateral — supports imbalance tracking)
- romanian-deadlift (hip hinge, compound)
- leg-extension (quad isolation)

## Images

All image URLs are from Pexels (free license). The image_url column is
separate from exercise logic, so the library can be swapped without code changes.
*/

INSERT INTO exercises (id, name, description, instructions, common_mistakes, image_url, primary_muscle, secondary_muscles, equipment, difficulty, movement_pattern, compound, unilateral, home_compatible, gym_compatible, slot_tag, alternatives)
VALUES
(
  'barbell-bench-press',
  'Barbell Bench Press',
  'The king of pressing movements. Builds raw upper-body pushing strength and chest mass.',
  'Lie flat on a bench, grip the bar slightly wider than shoulder-width, lower to mid-chest, press up explosively.',
  'Bouncing the bar off chest, flaring elbows too wide, lifting hips off bench.',
  'https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg',
  'chest', ARRAY['shoulders','arms'], 'barbell', 'intermediate', 'horizontal-press',
  true, false, false, true, 'horizontal-press',
  ARRAY['dumbbell-bench-press','incline-dumbbell-press']
),
(
  'dumbbell-bench-press',
  'Dumbbell Bench Press',
  'Freewight chest press that allows deeper stretch and greater range of motion than barbell.',
  'Lie on a flat bench, press dumbbells from chest level to lockout, control the descent.',
  'Dropping the dumbbells too fast, not touching chest at bottom, unstable wrist position.',
  'https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg',
  'chest', ARRAY['shoulders','arms'], 'dumbbells', 'beginner', 'horizontal-press',
  true, false, true, true, 'horizontal-press',
  ARRAY['barbell-bench-press','incline-dumbbell-press']
),
(
  'incline-dumbbell-press',
  'Incline Dumbbell Press',
  'Targets the upper chest fibers and front delts. Set bench to 30-45 degrees.',
  'Set bench to 30-45 degree incline, press dumbbells from upper chest to lockout.',
  'Setting incline too steep (targets shoulders), not controlling descent.',
  'https://images.pexels.com/photos/4853666/pexels-photo-4853666.jpeg',
  'chest', ARRAY['shoulders'], 'dumbbells', 'beginner', 'incline-press',
  true, false, true, true, 'incline-press',
  ARRAY['barbell-bench-press','dumbbell-bench-press']
),
(
  'overhead-press',
  'Overhead Press',
  'Standing barbell press. Builds shoulder strength and pressing power.',
  'Grip bar at shoulder width, brace core, press bar overhead to lockout, lower to clavicle.',
  'Excessive lower-back arch, pressing in front of face, not bracing core.',
  'https://images.pexels.com/photos/4047158/pexels-photo-4047158.jpeg',
  'shoulders', ARRAY['arms'], 'barbell', 'intermediate', 'vertical-press',
  true, false, false, true, 'vertical-press',
  ARRAY['seated-dumbbell-shoulder-press']
),
(
  'dumbbell-lateral-raise',
  'Dumbbell Lateral Raise',
  'Isolation exercise for the lateral deltoid head. Key for shoulder width.',
  'Stand with dumbbells at sides, raise arms out to shoulder height with slight bend, lower slowly.',
  'Using momentum/swinging, raising above shoulder height, shrugging traps.',
  'https://images.pexels.com/photos/4162537/pexels-photo-4162537.jpeg',
  'shoulders', ARRAY[]::text[], 'dumbbells', 'beginner', 'lateral-raise',
  false, false, true, true, 'lateral-shoulder',
  ARRAY['cable-lateral-raise']
),
(
  'cable-triceps-pushdown',
  'Cable Triceps Pushdown',
  'Isolation exercise for the triceps using a cable machine.',
  'Stand at cable machine, grip bar, push down to full extension, keep elbows pinned to sides.',
  'Flaring elbows, leaning over the bar, not fully extending.',
  'https://images.pexels.com/photos/6243176/pexels-photo-6243176.jpeg',
  'arms', ARRAY[]::text[], 'cable', 'beginner', 'triceps-extension',
  false, false, false, true, 'triceps',
  ARRAY['overhead-triceps-extension']
),
(
  'overhead-triceps-extension',
  'Overhead Triceps Extension',
  'Dumbbell-based triceps isolation that stretches the long head of the tricep.',
  'Hold one dumbbell overhead with both hands, lower behind head, extend back up.',
  'Flaring elbows outward, not going deep enough, moving elbows forward.',
  'https://images.pexels.com/photos/6243176/pexels-photo-6243176.jpeg',
  'arms', ARRAY[]::text[], 'dumbbells', 'beginner', 'triceps-extension',
  false, false, true, true, 'triceps',
  ARRAY['cable-triceps-pushdown']
),
(
  'lat-pulldown',
  'Lat Pulldown',
  'Cable-based vertical pull. Builds lat width and upper-back strength.',
  'Grip bar wider than shoulders, pull to upper chest, squeeze lats, control the ascent.',
  'Leaning back too far, pulling behind the neck, using momentum.',
  'https://images.pexels.com/photos/4047102/pexels-photo-4047102.jpeg',
  'back', ARRAY['arms'], 'cable', 'beginner', 'vertical-pull',
  true, false, false, true, 'vertical-pull',
  ARRAY['pull-up','barbell-row']
),
(
  'barbell-row',
  'Barbell Row',
  'Compound horizontal pull. Builds back thickness and density.',
  'Hinge forward at hips with flat back, pull bar to lower ribcage, lower with control.',
  'Rounding lower back, using too much leg drive, not pulling to abdomen.',
  'https://images.pexels.com/photos/4162537/pexels-photo-4162537.jpeg',
  'back', ARRAY['arms'], 'barbell', 'intermediate', 'horizontal-pull',
  true, false, false, true, 'horizontal-pull',
  ARRAY['seated-cable-row','dumbbell-row']
),
(
  'seated-cable-row',
  'Seated Cable Row',
  'Cable horizontal pull with stable seated position. Good for mid-back isolation.',
  'Sit at cable row, brace feet, pull handle to stomach, squeeze shoulder blades, return slowly.',
  'Rocking back and forth, shrugging shoulders, rounding upper back.',
  'https://images.pexels.com/photos/4047102/pexels-photo-4047102.jpeg',
  'back', ARRAY['arms'], 'cable', 'beginner', 'horizontal-pull',
  true, false, false, true, 'horizontal-pull',
  ARRAY['barbell-row','dumbbell-row']
),
(
  'dumbbell-biceps-curl',
  'Dumbbell Biceps Curl',
  'Classic arm isolation. Can be performed alternating or simultaneously.',
  'Stand with dumbbells at sides, curl up with palms facing up, lower slowly.',
  'Swinging hips, not fully extending, lifting elbows.',
  'https://images.pexels.com/photos/4162537/pexels-photo-4162537.jpeg',
  'arms', ARRAY[]::text[], 'dumbbells', 'beginner', 'elbow-flexion',
  false, true, true, true, 'biceps',
  ARRAY['cable-biceps-curl','hammer-curl']
),
(
  'barbell-squat',
  'Barbell Back Squat',
  'The fundamental lower-body compound. Builds quad, glute, and core strength.',
  'Bar on upper back, feet shoulder-width, descend until thighs parallel, drive through heels.',
  'Knees caving inward, heels lifting, rounding upper back.',
  'https://images.pexels.com/photos/32521594/pexels-photo-32521594.jpeg',
  'legs', ARRAY['glutes'], 'barbell', 'intermediate', 'squat',
  true, false, false, true, 'squat',
  ARRAY['dumbbell-split-squat','leg-press']
),
(
  'dumbbell-split-squat',
  'Dumbbell Split Squat',
  'Unilateral leg exercise. Corrects strength imbalances between sides.',
  'Hold dumbbells, step into split stance, lower back knee toward floor, drive through front heel.',
  'Front knee caving inward, leaning torso too far forward, short range of motion.',
  'https://images.pexels.com/photos/13106588/pexels-photo-13106588.jpeg',
  'legs', ARRAY['glutes'], 'dumbbells', 'beginner', 'squat',
  true, true, true, true, 'squat',
  ARRAY['barbell-squat','bulgarian-split-squat']
),
(
  'romanian-deadlift',
  'Romanian Deadlift',
  'Hip-hinge movement targeting hamstrings and glutes. Less knee flexion than conventional deadlift.',
  'Hold barbell at thighs, hinge at hips keeping legs nearly straight, lower bar to mid-shin, extend hips.',
  'Rounding lower back, bending knees too much, not engaging lats.',
  'https://images.pexels.com/photos/14061687/pexels-photo-14061687.jpeg',
  'legs', ARRAY['glutes','back'], 'barbell', 'intermediate', 'hip-hinge',
  true, false, false, true, 'hip-hinge',
  ARRAY['dumbbell-rdl','leg-curl']
),
(
  'leg-extension',
  'Leg Extension',
  'Isolation exercise for the quadriceps using a machine.',
  'Sit on machine, extend knees to lift weight, squeeze quads at top, lower with control.',
  'Using momentum, not squeezing at top, going too fast.',
  'https://images.pexels.com/photos/9602276/pexels-photo-9602276.jpeg',
  'legs', ARRAY[]::text[], 'machines', 'beginner', 'knee-extension',
  false, false, false, true, 'quad-isolation',
  ARRAY['dumbbell-split-squat']
)
ON CONFLICT (id) DO NOTHING;
