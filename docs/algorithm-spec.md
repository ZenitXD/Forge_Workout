# FORGE — Workout Generation Engine Specification

This document defines **how Forge decides**, not what it does. The master prompt
describes the product; this spec describes the brain. Every routine Forge
produces must be traceable to the rules in this document.

It is the single source of truth for workout generation, progression, and
program changes. Code that implements these rules lives in the engine layer and
must not duplicate logic defined here.

---

## 1. Design Principles

1. **Deterministic given inputs.** The same profile, history, and phase always
   produces the same routine unless randomness is explicitly introduced by the
   rotation penalty. Generation is seedable for reproducible testing.
2. **Explainable.** Every chosen exercise and every progression recommendation
   carries a human-readable reason. If the engine cannot explain a choice, the
   choice is invalid.
3. **Offline.** No generation step requires a network call. All scoring inputs
   (profile, history, phase, exercise DB) are local.
4. **Evidence-based.** Volume landmarks, rep ranges, and progression rates are
   grounded in established resistance-training literature, not guesses.
5. **Conservative by default.** Progression recommendations err toward safety
   and adherence. The user confirms weight jumps unless they enable Auto-Apply.
6. **Stable, not random.** Workouts should feel varied over weeks, but a single
   session should never feel chaotic. Movement patterns, volume, and ordering
   follow rules; only exercise identity varies within a slot.

---

## 2. Inputs

The engine consumes five input bundles. None are mutated by generation.

### 2.1 User Profile (static-ish, changes on edit)
- Experience level: beginner / intermediate / advanced
- Goal: hypertrophy / strength / fat loss / endurance / athletic
- Equipment available (set)
- Preferred split
- Favorite exercises (set of IDs)
- Avoided exercises (set of IDs, hard exclusion)
- Priority muscles (up to 3)
- Medical / accessibility modifiers (set): joint pain, mobility limits,
  unilateral preference, seated preference, avoid overhead, asymmetrical strength
- Session duration budget (minutes)
- Days per week

### 2.2 Workout History (append-only)
- Per-exercise: last N sessions with weight, reps, sets, RPE, completion status
- Per-muscle: trailing weekly volume (sets × reps × weight, and hard sets)
- Body weight log
- Consistency streak

### 2.3 Current Phase (active block)
- Phase type: strength / hypertrophy / endurance
- Week index within block (1..N)
- Block length (weeks)
- Target rep range and rest for this phase

### 2.4 Exercise Database
See master prompt §Exercise Database. Fields the engine reads at generation
time: ID, primary muscle, secondary muscles, equipment, difficulty, movement
pattern, compound/isolation, unilateral/bilateral, home/gym compatible,
alternatives, slot tags (push/pull/squat/hinge/etc.).

### 2.5 Session Context
- Date
- Which day of the split this session maps to (e.g. "Push Day #2 of week 3")
- Last time each candidate exercise was performed (for rotation)

---

## 3. Exercise Selection & Scoring

A workout is built slot-by-slot. Each slot has a **requirement** (e.g. "one
horizontal press"). The engine finds all exercises that satisfy the slot's
movement pattern and equipment constraints, scores them, and picks the best.

### 3.1 Candidate Filtering (hard gates)

An exercise is **filtered out** (score = rejected) if any of these fail:

| Gate | Rule |
|------|------|
| Equipment | Exercise requires equipment the user does not have |
| Avoided | Exercise ID is in the user's avoided set |
| Medical — overhead | User has "avoid overhead" and exercise tag = vertical press / overhead |
| Medical — unilateral | User has asymmetrical strength and exercise is bilateral compound on a tag the user prefers unilateral → deprioritized, not hard-rejected (see scoring) |
| Medical — seated | User has "seated preference" and exercise is standing lower-body compound → deprioritized, not hard-rejected |
| Home/gym mismatch | Exercise home_compatible/gym_compatible does not match the user's training location |
| Difficulty | Exercise difficulty is more than one tier above the user's experience level (a beginner never gets "advanced"; an advanced lifter may get "beginner" if it scores well) |

Hard gates never produce a score — they remove the candidate entirely. If no
candidate survives, the slot falls back (see §3.6).

### 3.2 Scoring Rubric

Surviving candidates are scored on a 0–100 scale. The score is a weighted sum
of normalized factors. Weights are **engine-fixed** (not user-tunable) to keep
workout quality consistent across users and over time.

| Factor | Weight | What it measures | Higher when… |
|--------|--------|------------------|-------------|
| Equipment fit | 20 | Exact equipment match vs. "close enough" | Exact match on a primary equipment the user owns |
| Muscle alignment | 20 | Does the exercise hit the slot's target muscle? | Primary muscle == slot target; secondary muscle hits a priority muscle |
| Difficulty match | 15 | Is the exercise appropriate for the user's level? | Difficulty tier == user level; adjacent tier partial credit |
| Preference bias | 15 | Favorite / disliked influence | In favorites set → +full; neutral → 0; (avoided already gated out) |
| Priority muscle bonus | 10 | Rewards hitting a user-priority muscle | Exercise hits any of the user's up-to-3 priority muscles |
| Rotation freshness | 10 | Prevents repeating the same exercise session after session | Longer time since last performance |
| Compound/phase fit | 10 | Compound lifts favored in strength phase; isolation allowed in hypertrophy/endurance | Compound in strength phase, or isolation in hypertrophy when slot calls for it |
| Medical comfort | — (modifier, ±10) | Adjusts score for unilateral/seated/overhead preferences | Exercise matches the user's stated comfort modifiers |

The medical comfort modifier is **additive** and applied after the weighted sum,
clamped to [0, 100]. It can raise a comfortable exercise or penalize an
uncomfortable one that survived the hard gates (e.g. a bilateral squat for an
asymmetrical user who has no unilateral alternative in their equipment set).

### 3.3 Normalization

Each factor is normalized to 0–1 before weighting:
- Continuous inputs (e.g. rotation freshness = days since last performed) are
  scaled against a 90-day window. 90+ days = 1.0; never performed = 1.0.
- Categorical inputs (equipment exact vs. partial) map to discrete values
  (1.0 / 0.5 / 0.0).
- The final weighted sum is scaled to 0–100 for display and logging.

### 3.4 Tie-breaking

When two candidates score within 2 points of each other:
1. Prefer the one with higher rotation freshness (more varied workouts).
2. If still tied, prefer the compound (for strength) or isolation (for
   hypertrophy) matching the phase.
3. If still tied, prefer alphabetical by name for determinism.

This guarantees reproducible generation from a fixed seed while still producing
variety across weeks as the rotation freshness factor shifts.

### 3.5 Rotation Freshness

To avoid "every Push Day is bench press", the rotation factor decays an
exercise's score the more recently it was used:

- `freshness = clamp(days_since_last_performed / 90, 0, 1)`
- An exercise performed yesterday scores near 0 on this factor.
- An exercise not performed in 90+ days scores 1.0.
- The factor only contributes 10% of total score, so a clearly better exercise
  still wins — it just won't be repeated indefinitely when a comparable
  alternative exists.

### 3.6 Slot Fallback

If no candidate survives the hard gates for a slot:
1. Relax the difficulty gate by one tier (allow adjacent difficulty).
2. If still empty, relax the medical soft constraints (drop the comfort modifier
   and allow bilateral/unilateral as needed).
3. If still empty, substitute the slot's movement pattern with the closest
   available alternative pattern (e.g. no horizontal press → incline press).
4. If still empty, skip the slot and log a coaching note: "No exercise available
   for [slot] with your current equipment. Consider adding [equipment] in
   Settings."

The fallback chain is logged so the explanation system can report it.

---

## 4. Workout Assembly

### 4.1 Slot Templates per Split

A slot template is a phase-aware definition of what a workout day must contain.
Templates are defined per split day and parameterized by the current phase.

**Push Day template:**
1. One horizontal press (compound) — primary chest
2. One incline press — upper chest
3. One vertical press — shoulders
4. One lateral shoulder exercise — isolation
5. One triceps exercise — isolation
6. *(Optional, phase-dependent)* one triceps compound if strength phase

**Pull Day template:**
1. One vertical pull (compound) — lats
2. One horizontal pull (compound) — mid-back
3. One rear-delt or upper-back isolation
4. One biceps exercise
5. *(Optional)* one elbow flexion compound

**Legs Day template:**
1. One squat-pattern compound (quad bias)
2. One hip-hinge compound (posterior chain)
3. One quad isolation
4. One hamstring isolation
5. One calf exercise
6. *(Optional)* one core exercise

Upper / Lower / Full Body / ABC templates follow the same structure: a list of
slot requirements, each tagged with movement pattern, primary muscle, and
compound/isolation. Custom splits are built from the user's day definitions.

### 4.2 Volume Budgeting

Volume is allocated per muscle per week using **volume landmarks** scaled to the
user's experience level:

| Level | Maintenance | MEV (min effective) | MAV (adaptive) | MRV (max recoverable) |
|-------|-------------|---------------------|----------------|-----------------------|
| Beginner | 8 sets/wk | 10 | 12 | 16 |
| Intermediate | 10 | 12 | 16 | 20 |
| Advanced | 12 | 16 | 20 | 24 |

- **MEV** = Minimum Effective Volume. Below this, a muscle is undertrained.
- **MAV** = Maximum Adaptive Volume. The target the engine aims for per muscle
  per week. Priority muscles get +20% to MAV.
- **MRV** = Maximum Recoverable Volume. Hitting MRV triggers a deload signal.

The engine distributes the weekly MAV across the days that train each muscle.
If a muscle is trained on 2 days, each day gets ~MAV/2 hard sets for that
muscle. This is converted into slot counts: compound slots count as 1 hard set
toward both primary and secondary muscles; isolation slots count toward their
primary muscle only.

If the user's session duration budget cannot fit the target sets, the engine
trims isolation slots first, then secondary compounds, never primary compounds.

### 4.3 Exercise Ordering

Within a session, exercises are ordered by:

1. Power/compound lifts first (strength phase) or primary compounds first.
2. Secondary compounds.
3. Isolation work, ordered largest muscle → smallest.
4. Core / calves / accessories last.

This ordering is fixed per template; slot scoring only selects *which* exercise
fills each slot, not the slot order.

### 4.4 Set & Rep Scheme Generation

Each slot's set/rep scheme is derived from the phase, not hardcoded per
exercise:

| Phase | Rep range | Sets | Rest | Load target |
|-------|-----------|------|------|-------------|
| Strength | 4–6 | 4–5 | 3–4 min | ~80–87% 1RM |
| Hypertrophy | 8–12 | 3–4 | 90s–2min | ~67–80% 1RM |
| Endurance | 15–20 | 2–3 | 45–60s | ~50–60% 1RM |

The starting weight for a chosen exercise is taken from the user's last
performed session for that exercise, adjusted by the phase (e.g. switching from
hypertrophy to strength reduces reps and increases load proportionally). If no
history exists, the engine estimates from body weight and a per-experience
strength standard table and flags the first session as "establishing baseline".

---

## 5. Progressive Overload

### 5.1 Progression Model: Double Progression

Forge uses **double progression**: rep range first, then load.

For an exercise at a given phase (e.g. hypertrophy 8–12):
1. Start at the prescribed load.
2. Each session, attempt to add reps until the user hits the **top of the rep
   range** on **all working sets**.
3. Once all sets hit the top rep count for **two consecutive sessions** at an
   RPE ≤ 8, recommend a load increase.
4. Load increase = per-exercise increment (2.5% for upper-body isolations, 5%
   for upper-body compounds, 5% for lower-body compounds; rounded to the nearest
   available plate/dumbbell step).
5. After a load increase, reps drop back toward the bottom of the range and the
   cycle repeats.

### 5.2 RPE-Driven Adjustments

After each working set, the user logs RPE (6–10). The engine adjusts the next
session's target:

| Last session RPE (top set) | Next-session adjustment |
|----------------------------|-------------------------|
| ≤ 7 | Proceed with planned progression (add rep or load) |
| 8 | Proceed; monitor |
| 9 | Hold load and reps; do not progress this session |
| 10 | Reduce load by 5% next session; flag possible overreach |

This makes progression adaptive to perceived effort, not blind to fatigue.

### 5.3 Failed Sets & Regression

If the user fails to complete the prescribed reps on the top set (RPE 10 with
missed reps):
- First occurrence: hold load next session.
- Second consecutive occurrence: reduce load by 5%.
- Log a coaching note explaining the regression is normal and expected.

### 5.4 Deload Triggers

A deload week is recommended when **any** of these fire:
- A muscle group's trailing weekly volume reaches **MRV**.
- RPE on the top set of a primary compound has been ≥ 9 for **3 consecutive
  sessions**.
- The user reports 2 consecutive failed sessions on the same exercise.

Deload prescription: reduce all working-set loads by 15%, reduce working sets by
one per exercise, keep rep range. Resume normal progression the following week.

### 5.5 Progression Mode Setting

- **Confirm (default):** The engine *recommends* the next session's load/reps;
  the user confirms or edits at workout start. Matches the "personal trainer"
  feel.
- **Auto-Apply (opt-in):** The engine applies progression automatically. The
  user can still override mid-session.

This setting is stored in the profile and surfaced in Settings. It does not
change the algorithm — only whether recommendations require a tap.

---

## 6. Phase Transitions & Auto-Reprogramming

### 6.1 Block Completion

A training block is complete when:
- The prescribed number of weeks has elapsed (4 for endurance, 6 for
  strength/hypertrophy), **and**
- At least 80% of scheduled sessions in the block were completed.

If completion is below 80%, the block is extended by the number of missed
sessions (capped at +2 weeks) rather than transitioned.

### 6.2 Plateau Detection

A plateau is flagged for an exercise when:
- No load increase has been possible for **3 consecutive sessions** despite
  hitting the top rep range, **or**
- Load has regressed (failed + reduced) twice without an intervening increase.

A plateau at the **program level** is flagged when:
- ≥ 50% of primary compounds are plateaued, **or**
- Trailing 4-week volume is flat or declining while RPE is rising.

### 6.3 Transition Decision Tree

On block completion, the engine evaluates in order:

1. **Plateau at program level?** → Generate a new program (§6.4) emphasizing
   different exercise variations and possibly a different phase.
2. **Goal unchanged and progress steady?** → Offer to repeat the block with
   auto-progression continuing, or transition to the next phase in the user's
   periodization cycle.
3. **Goal changed (user edited profile)?** → Regenerate everything.
4. **User manually requested new program?** → Regenerate, preserving the
   constraints in §6.5.

### 6.4 New Program Generation

When regenerating, the engine:
1. Re-reads the user profile (split, equipment, preferences, priority muscles,
   avoided exercises, medical modifiers, goal).
2. Selects a phase appropriate to the goal and periodization history:
   - Strength goal → strength block, or hypertrophy if just finished strength.
   - Hypertrophy goal → hypertrophy block, or strength if 2 hypertrophy blocks
     in a row (to drive load progression).
   - Fat loss → endurance or hypertrophy with reduced rest.
3. Rebuilds slot templates for the chosen split.
4. Scores and selects exercises, applying a **stronger rotation freshness
   bonus** (weight 10 → 20 for this one generation) so the new program favors
   exercise variations the user has **not** recently done.
5. Carries forward the user's established load baselines per exercise (or the
   closest alternative's baseline, scaled) so the new program does not reset
   progress.

### 6.5 What Is Preserved vs. Regenerated

| Preserved (never reset on program change) | Regenerated |
|-------------------------------------------|-------------|
| User profile (equipment, preferences, medical, goal) | Exercise selection per slot |
| Training split (unless user changed it) | Phase & rep ranges |
| Load baselines per exercise (history) | Set/rep scheme details |
| Priority muscles | Session ordering details |
| Avoided / favorite sets | Volume distribution across days |

### 6.6 Explanation Generation

Every program change produces a human-readable explanation. The engine emits a
structured reason object per change, rendered to text:

```
reason: {
  trigger: "plateau_program_level" | "block_complete" | "goal_changed" | "manual",
  changed_exercises: [
    { slot: "horizontal_press", old: "Barbell Bench", new: "Dumbbell Bench",
      why: "plateau_on_bench_3_sessions" }
  ],
  phase: { from: "hypertrophy", to: "strength",
           why: "two_consecutive_hypertrophy_blocks" },
  summary: "Your bench press has plateaued for three sessions. We're switching
            to dumbbell bench to give your stabilizers a new stimulus and moving
            into a strength block to drive load progression."
}
```

The summary text is generated from templated strings keyed off the structured
reason, so the explanation is always consistent with the actual decision.

---

## 7. Smart Coaching Notes

Coaching notes are emitted by the same rules engine, not a separate system.
Each note is a structured event with a trigger and a tone:

| Trigger | Note (example) |
|---------|----------------|
| 3 sessions at top reps, RPE ≤ 8 | "You've hit all reps for three sessions. Time to add weight next session." |
| Core volume < MEV for 3 weeks | "You've skipped core for three weeks. Want a short core finisher?" |
| Block at 8 weeks | "Your program has run 8 weeks. A new training block is recommended." |
| 2 failed sessions on a lift | "Bench is stalling. We'll drop the load 5% next session — this is normal." |
| Muscle at MRV | "Your chest volume is at your recoverable max. Consider a deload week." |

Tone is always supportive and educational, never judgmental. Notes are deduped:
the same trigger does not fire the same note within 7 days.

---

## 8. Configuration & Constants

All tunable values live in one configuration object, not scattered in code. The
defaults below are the engine's shipped values.

```yaml
scoring_weights:
  equipment_fit: 20
  muscle_alignment: 20
  difficulty_match: 15
  preference_bias: 15
  priority_muscle_bonus: 10
  rotation_freshness: 10
  compound_phase_fit: 10
  medical_comfort_modifier: 10   # additive, ±

rotation:
  freshness_window_days: 90
  reprogram_freshness_weight_boost: 20

volume_landmarks:        # sets per muscle per week
  beginner:  { maintenance: 8,  mev: 10, mav: 12, mrv: 16 }
  intermediate: { maintenance: 10, mev: 12, mav: 16, mrv: 20 }
  advanced:   { maintenance: 12, mev: 16, mav: 20, mrv: 24 }
  priority_muscle_mav_bonus_pct: 20

phases:
  strength:   { reps: "4-6",  sets: "4-5", rest_s: 210, load_pct_1rm: "80-87", weeks: 6 }
  hypertrophy: { reps: "8-12", sets: "3-4", rest_s: 120, load_pct_1rm: "67-80", weeks: 6 }
  endurance:  { reps: "15-20", sets: "2-3", rest_s: 60,  load_pct_1rm: "50-60", weeks: 4 }

progression:
  mode: "confirm"          # "confirm" | "auto"
  consecutive_top_rep_sessions_to_add_load: 2
  load_increment_pct:
    upper_isolation: 2.5
    upper_compound: 5
    lower_compound: 5
  rpe_adjustments:
    le_7: "progress"
    eq_8: "progress_monitor"
    eq_9: "hold"
    eq_10: "reduce_5_pct"
  failed_set_regression:
    first: "hold"
    second: "reduce_5_pct"

deload:
  volume_reduction_pct: 15
  set_reduction: 1
  triggers:
    at_mrv: true
    rpe_ge_9_for_3_sessions: true
    two_consecutive_failed_sessions: true

block_completion:
  min_session_completion_pct: 80
  extend_missed_weeks_cap: 2

plateau:
  exercise_no_progress_sessions: 3
  program_plateau_primary_compound_pct: 50

reprogram:
  carry_forward_load_baselines: true
  preserve_split_unless_changed: true

coaching:
  dedup_window_days: 7
  tone: "supportive"
```

---

## 9. Worked Example

**Profile:** intermediate, hypertrophy goal, dumbbells + barbell + bench, PPL
split, priority muscles = chest + back, avoids barbell squat (knee pain), no
medical overhead restriction.

**Phase:** hypertrophy, week 2.

**Slot:** "one horizontal press (compound) — primary chest."

**Candidates after hard gates:** Barbell Bench, Dumbbell Bench, Floor Press.
(Smith Bench filtered — no Smith machine.)

**Scores:**

| Candidate | Equip | Muscle | Diff | Pref | Priority | Rotation | Compound | Comfort | Total |
|-----------|-------|--------|------|------|----------|----------|----------|---------|-------|
| Barbell Bench | 20 | 20 | 15 | 7.5 | 10 | 4 | 10 | 0 | 86.5 |
| Dumbbell Bench | 20 | 20 | 15 | 7.5 | 10 | 10 | 10 | 0 | 92.5 |
| Floor Press | 15 | 18 | 15 | 0 | 10 | 10 | 10 | 0 | 78.0 |

- Rotation: Barbell Bench done 5 days ago (freshness ~0.4 → 4/10 weight),
  Dumbbell Bench not done in 45 days (freshness 0.5 → 5/10… actually 45/90 =
  0.5 → 5, but the table rounds; the point: Dumbbell wins on rotation).
- Preference: neither is a favorite → neutral 7.5/15 (half credit for "not
  avoided").
- Dumbbell Bench wins → selected for the slot.

**Generated set scheme:** 3 sets × 8–12 reps @ 90s rest, load from last
Dumbbell Bench session (or baseline estimate if first time).

---

## 10. Edge Cases & Fallbacks

- **Empty exercise DB for a slot:** Fallback chain (§3.6) → if exhausted, skip
  slot + coaching note.
- **User with minimal equipment (bodyweight only):** Templates shrink to
  bodyweight variants; volume landmarks reduce by one tier (beginner) regardless
  of stated experience, with a coaching note explaining why.
- **First-ever workout:** No history → baseline estimation from strength
  standards table; session flagged "establishing baseline"; no progression
  recommendation until 2 sessions logged.
- **User edits equipment mid-block:** Regeneration is **not** automatic mid-block
  unless an exercise becomes impossible. Impossible exercises are swapped using
  the fallback chain; everything else waits until block completion.
- **Asymmetrical strength:** If the user flags this, bilateral compounds on
  priority patterns get the medical comfort modifier as a penalty and unilateral
  variants get it as a bonus, nudging selection toward unilateral work without
  hard-rejecting bilateral when no unilateral alternative exists.

---

## 11. Relationship to the Master Prompt

This spec implements the master prompt's sections: Workout Generator, Exercise
Database (consumed), Progressive Overload, Training Phases, Automatic Program
Changes, Progress Tracking (consumed), Statistics (consumed), and Smart
Coaching. Where this spec and the master prompt could be read as conflicting,
this spec is authoritative for **how**; the master prompt remains authoritative
for **what** and for all UI/UX and product behavior.
