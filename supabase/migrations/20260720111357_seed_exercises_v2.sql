/*
# Seed Additional Exercises (v2)

Adds exercises for pull day, legs day, and accessory slots that were missing
from the v1 seed. This completes the exercise library so the generation engine
can build Push, Pull, Legs, Upper, Lower, and Full Body workouts.

## Exercises Added (10)

Pull accessories:
- face-pull (rear-delt isolation, cable)
- hammer-curl (biceps, dumbbells, unilateral)

Legs:
- dumbbell-rdl (hip hinge, dumbbells, unilateral option)
- lying-leg-curl (hamstring isolation, machine)
- standing-calf-raise (calves, bodyweight/dumbbells)
- leg-press (squat pattern, machine)

Upper/bodyweight:
- push-up (horizontal press, bodyweight, home-compatible)
- pull-up (vertical pull, bodyweight, home-compatible)

Core:
- plank (core, bodyweight, home-compatible)
- cable-crunch (core, cable)

All images from Pexels (free license).
*/

INSERT INTO exercises (id, name, description, instructions, common_mistakes, image_url, primary_muscle, secondary_muscles, equipment, difficulty, movement_pattern, compound, unilateral, home_compatible, gym_compatible, slot_tag, alternatives)
VALUES
(
  'face-pull',
  'Cable Face Pull',
  'Rear-delt and upper-back isolation using a cable rope. Key for shoulder health and posture.',
  'Set cable at face height, grip rope, pull toward face elbows high, squeeze rear delts.',
  'Using too much weight, shrugging, pulling low.',
  'https://images.pexels.com/photos/4047102/pexels-photo-4047102.jpeg',
  'shoulders', ARRAY['back'], 'cable', 'beginner', 'horizontal-pull',
  false, false, false, true, 'rear-delt',
  ARRAY['reverse-pec-deck','band-face-pull']
),
(
  'hammer-curl',
  'Dumbbell Hammer Curl',
  'Biceps and brachialis curl with neutral grip. Builds arm thickness.',
  'Stand with dumbbells at sides, palms facing each other, curl up keeping neutral grip, lower slowly.',
  'Swinging, letting elbows travel forward, going too fast.',
  'https://images.pexels.com/photos/4162537/pexels-photo-4162537.jpeg',
  'arms', ARRAY[]::text[], 'dumbbells', 'beginner', 'elbow-flexion',
  false, true, true, true, 'biceps',
  ARRAY['dumbbell-biceps-curl','cable-curl']
),
(
  'dumbbell-rdl',
  'Dumbbell Romanian Deadlift',
  'Hip hinge with dumbbells. Targets hamstrings and glutes. Unilateral option for asymmetry.',
  'Hold dumbbells at thighs, hinge at hips keeping legs nearly straight, lower to mid-shin, extend hips.',
  'Rounding back, bending knees too much, rushing.',
  'https://images.pexels.com/photos/14061687/pexels-photo-14061687.jpeg',
  'legs', ARRAY['glutes'], 'dumbbells', 'beginner', 'hip-hinge',
  true, false, true, true, 'hip-hinge',
  ARRAY['romanian-deadlift','lying-leg-curl']
),
(
  'lying-leg-curl',
  'Lying Leg Curl',
  'Hamstring isolation using a machine. Lying face down on a leg curl bench.',
  'Lie on machine, place heels under pad, curl up by flexing knees, lower with control.',
  'Using momentum, lifting hips off pad, partial range.',
  'https://images.pexels.com/photos/9602276/pexels-photo-9602276.jpeg',
  'legs', ARRAY[]::text[], 'machines', 'beginner', 'knee-flexion',
  false, false, false, true, 'hamstring-isolation',
  ARRAY['dumbbell-rdl','seated-leg-curl']
),
(
  'standing-calf-raise',
  'Standing Calf Raise',
  'Calf isolation. Can be done with bodyweight, dumbbells, or on a machine.',
  'Stand on edge of step, lower heels for stretch, press up onto toes, squeeze at top.',
  'Bouncing, not getting full stretch, rushing reps.',
  'https://images.pexels.com/photos/13106588/pexels-photo-13106588.jpeg',
  'calves', ARRAY[]::text[], 'bodyweight', 'beginner', 'ankle-extension',
  false, false, true, true, 'calf',
  ARRAY['seated-calf-raise']
),
(
  'leg-press',
  'Leg Press',
  'Machine-based compound leg exercise. Good for volume without spinal loading.',
  'Sit in machine, feet shoulder-width on platform, lower to 90 degrees, press back up.',
  'Locking knees, lowering too far (lower back lifts), knees caving in.',
  'https://images.pexels.com/photos/9602276/pexels-photo-9602276.jpeg',
  'legs', ARRAY['glutes'], 'machines', 'beginner', 'squat',
  true, false, false, true, 'squat',
  ARRAY['barbell-squat','dumbbell-split-squat']
),
(
  'push-up',
  'Push-Up',
  'Bodyweight horizontal press. Home-compatible and scalable with hand positioning.',
  'Hands shoulder-width, body straight, lower chest to floor, push back up.',
  'Sagging hips, flaring elbows too wide, partial range.',
  'https://images.pexels.com/photos/3766211/pexels-photo-3766211.jpeg',
  'chest', ARRAY['shoulders','arms'], 'bodyweight', 'beginner', 'horizontal-press',
  true, false, true, true, 'horizontal-press',
  ARRAY['dumbbell-bench-press','barbell-bench-press']
),
(
  'pull-up',
  'Pull-Up',
  'Bodyweight vertical pull. Builds lat width and upper-body pulling strength.',
  'Hang from bar, hands wider than shoulders, pull chest to bar, lower with control.',
  'Kipping, not going to full hang, partial range.',
  'https://images.pexels.com/photos/29084397/pexels-photo-29084397.jpeg',
  'back', ARRAY['arms'], 'bodyweight', 'intermediate', 'vertical-pull',
  true, false, true, true, 'vertical-pull',
  ARRAY['lat-pulldown']
),
(
  'plank',
  'Plank',
  'Core stability exercise. Bodyweight, home-compatible, scalable with duration.',
  'Forearms on ground, body straight from head to heels, hold position, brace core.',
  'Sagging hips, piking hips too high, holding breath.',
  'https://images.pexels.com/photos/3766211/pexels-photo-3766211.jpeg',
  'abs', ARRAY[]::text[], 'bodyweight', 'beginner', 'core',
  false, false, true, true, 'core',
  ARRAY['cable-crunch','hanging-leg-raise']
),
(
  'cable-crunch',
  'Cable Crunch',
  'Core isolation using a cable machine. Adds resistance to the crunch pattern.',
  'Kneel below cable, hold rope behind head, crunch down by flexing spine, return slowly.',
  'Using hip flexors, rounding back too much, rushing.',
  'https://images.pexels.com/photos/6243176/pexels-photo-6243176.jpeg',
  'abs', ARRAY[]::text[], 'cable', 'beginner', 'core',
  false, false, false, true, 'core',
  ARRAY['plank','hanging-leg-raise']
)
ON CONFLICT (id) DO NOTHING;
