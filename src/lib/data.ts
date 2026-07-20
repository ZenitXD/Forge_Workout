import { supabase } from "./supabase";
import type {
  ExerciseDB,
  UserProfile,
  Workout,
  WorkoutExercise,
  ExerciseSet,
  TrainingBlock,
  PhaseType,
  ProgressPoint,
  ImbalanceData,
  LoggedSet,
  SplitId,
} from "../types";

const PHASE_ORDER: PhaseType[] = ["hypertrophy", "endurance", "strength"];
const REPROGRAM_AFTER_CYCLES = 3;

export const PHASE_CONFIG: Record<
  PhaseType,
  { reps: string; repTarget: number; sets: number; rest: number; weeks: number; label: string }
> = {
  strength: { reps: "4-6", repTarget: 5, sets: 4, rest: 180, weeks: 6, label: "Strength" },
  hypertrophy: { reps: "8-12", repTarget: 10, sets: 3, rest: 90, weeks: 6, label: "Hypertrophy" },
  endurance: { reps: "15-20", repTarget: 17, sets: 2, rest: 45, weeks: 4, label: "Endurance" },
};

// Volume landmarks reserved for future per-muscle weekly volume tracking.

// ============================================================
// Exercise fetching
// ============================================================

export async function fetchExercises(): Promise<ExerciseDB[]> {
  const { data, error } = await supabase.from("exercises").select("*");
  if (error) throw error;
  return (data ?? []).map(mapExerciseRow);
}

function mapExerciseRow(row: Record<string, unknown>): ExerciseDB {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    instructions: (row.instructions as string) ?? "",
    commonMistakes: (row.common_mistakes as string) ?? "",
    imageUrl: (row.image_url as string) ?? "",
    primaryMuscle: row.primary_muscle as string,
    secondaryMuscles: (row.secondary_muscles as string[]) ?? [],
    equipment: row.equipment as string,
    difficulty: row.difficulty as string,
    movementPattern: row.movement_pattern as string,
    compound: row.compound as boolean,
    unilateral: row.unilateral as boolean,
    homeCompatible: row.home_compatible as boolean,
    gymCompatible: row.gym_compatible as boolean,
    slotTag: row.slot_tag as string,
    alternatives: (row.alternatives as string[]) ?? [],
  };
}

// ============================================================
// Profile persistence
// ============================================================

export async function saveProfile(profile: UserProfile): Promise<void> {
  const row = {
    id: 1,
    name: profile.name,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
    sex: profile.sex,
    experience: profile.experience,
    goal: profile.goal,
    activity_level: profile.activityLevel,
    days_per_week: profile.daysPerWeek,
    session_duration: profile.sessionDuration,
    equipment: profile.equipment,
    split: profile.split,
    favorite_exercises: profile.favoriteExercises,
    avoided_exercises: profile.avoidedExercises,
    priority_muscles: profile.priorityMuscles,
    medical: profile.medical,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profile").upsert(row);
  if (error) throw error;
}

export async function getProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    name: data.name ?? "",
    age: data.age ?? 0,
    height: data.height ?? 0,
    weight: data.weight ?? 0,
    sex: data.sex ?? "male",
    experience: data.experience,
    goal: data.goal,
    activityLevel: data.activity_level ?? 3,
    daysPerWeek: data.days_per_week ?? 4,
    sessionDuration: data.session_duration ?? 60,
    equipment: data.equipment ?? [],
    split: data.split ?? "ppl",
    favoriteExercises: data.favorite_exercises ?? [],
    avoidedExercises: data.avoided_exercises ?? [],
    priorityMuscles: data.priority_muscles ?? [],
    medical: data.medical ?? [],
  };
}

// ============================================================
// Training blocks & phase cycling
// ============================================================

export async function getActiveBlock(): Promise<TrainingBlock | null> {
  const { data, error } = await supabase
    .from("training_blocks")
    .select("*")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    phase: data.phase as PhaseType,
    cycleIndex: data.cycle_index,
    weekIndex: data.week_index,
    blockLengthWeeks: data.block_length_weeks,
    status: data.status,
  };
}

export async function createInitialBlock(goal: UserProfile["goal"]): Promise<TrainingBlock> {
  const firstPhase: PhaseType =
    goal === "strength" ? "strength" : goal === "endurance" ? "endurance" : "hypertrophy";
  const { data, error } = await supabase
    .from("training_blocks")
    .insert({
      phase: firstPhase,
      cycle_index: 0,
      week_index: 1,
      block_length_weeks: PHASE_CONFIG[firstPhase].weeks,
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    phase: data.phase,
    cycleIndex: data.cycle_index,
    weekIndex: data.week_index,
    blockLengthWeeks: data.block_length_weeks,
    status: data.status,
  };
}

export function getNextPhase(current: PhaseType): PhaseType {
  const idx = PHASE_ORDER.indexOf(current);
  return PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
}

export function shouldRecommendReprogram(block: TrainingBlock): boolean {
  return block.cycleIndex >= REPROGRAM_AFTER_CYCLES;
}

export async function advancePhase(block: TrainingBlock): Promise<TrainingBlock> {
  const nextPhase = getNextPhase(block.phase);
  const nextCycle = nextPhase === PHASE_ORDER[0] ? block.cycleIndex + 1 : block.cycleIndex;

  await supabase
    .from("training_blocks")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("id", block.id);

  const { data, error } = await supabase
    .from("training_blocks")
    .insert({
      phase: nextPhase,
      cycle_index: nextCycle,
      week_index: 1,
      block_length_weeks: PHASE_CONFIG[nextPhase].weeks,
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    phase: data.phase,
    cycleIndex: data.cycle_index,
    weekIndex: data.week_index,
    blockLengthWeeks: data.block_length_weeks,
    status: data.status,
  };
}

// ============================================================
// Workout generation engine
// Implements: equipment filtering, split templates, difficulty
// gating, accessibility scoring (unilateral/seated/overhead),
// priority muscle bonus, rotation freshness, volume budgeting
// based on days/week & session duration.
// ============================================================

interface SlotRequirement {
  slotTag: string;
  primaryMuscle: string;
  compound?: boolean;
  optional?: boolean;
}

const SPLIT_TEMPLATES: Record<SplitId, { name: string; days: SlotRequirement[][] }> = {
  ppl: {
    name: "Push / Pull / Legs",
    days: [
      [
        { slotTag: "horizontal-press", primaryMuscle: "chest", compound: true },
        { slotTag: "incline-press", primaryMuscle: "chest", compound: true },
        { slotTag: "vertical-press", primaryMuscle: "shoulders", compound: true },
        { slotTag: "lateral-shoulder", primaryMuscle: "shoulders" },
        { slotTag: "triceps", primaryMuscle: "arms" },
      ],
      [
        { slotTag: "vertical-pull", primaryMuscle: "back", compound: true },
        { slotTag: "horizontal-pull", primaryMuscle: "back", compound: true },
        { slotTag: "rear-delt", primaryMuscle: "shoulders" },
        { slotTag: "biceps", primaryMuscle: "arms" },
      ],
      [
        { slotTag: "squat", primaryMuscle: "legs", compound: true },
        { slotTag: "hip-hinge", primaryMuscle: "legs", compound: true },
        { slotTag: "quad-isolation", primaryMuscle: "legs" },
        { slotTag: "hamstring-isolation", primaryMuscle: "legs" },
        { slotTag: "calf", primaryMuscle: "calves", optional: true },
      ],
    ],
  },
  "upper-lower": {
    name: "Upper / Lower",
    days: [
      [
        { slotTag: "horizontal-press", primaryMuscle: "chest", compound: true },
        { slotTag: "vertical-pull", primaryMuscle: "back", compound: true },
        { slotTag: "vertical-press", primaryMuscle: "shoulders", compound: true },
        { slotTag: "horizontal-pull", primaryMuscle: "back", compound: true },
        { slotTag: "biceps", primaryMuscle: "arms" },
        { slotTag: "triceps", primaryMuscle: "arms" },
      ],
      [
        { slotTag: "squat", primaryMuscle: "legs", compound: true },
        { slotTag: "hip-hinge", primaryMuscle: "legs", compound: true },
        { slotTag: "quad-isolation", primaryMuscle: "legs" },
        { slotTag: "hamstring-isolation", primaryMuscle: "legs" },
        { slotTag: "calf", primaryMuscle: "calves" },
      ],
    ],
  },
  "full-body": {
    name: "Full Body",
    days: [
      [
        { slotTag: "horizontal-press", primaryMuscle: "chest", compound: true },
        { slotTag: "vertical-pull", primaryMuscle: "back", compound: true },
        { slotTag: "squat", primaryMuscle: "legs", compound: true },
        { slotTag: "lateral-shoulder", primaryMuscle: "shoulders" },
      ],
      [
        { slotTag: "hip-hinge", primaryMuscle: "legs", compound: true },
        { slotTag: "horizontal-pull", primaryMuscle: "back", compound: true },
        { slotTag: "vertical-press", primaryMuscle: "shoulders", compound: true },
        { slotTag: "biceps", primaryMuscle: "arms" },
        { slotTag: "triceps", primaryMuscle: "arms" },
      ],
      [
        { slotTag: "incline-press", primaryMuscle: "chest", compound: true },
        { slotTag: "squat", primaryMuscle: "legs", compound: true },
        { slotTag: "rear-delt", primaryMuscle: "shoulders" },
        { slotTag: "hamstring-isolation", primaryMuscle: "legs" },
        { slotTag: "calf", primaryMuscle: "calves" },
      ],
    ],
  },
  abc: {
    name: "ABC Rotation",
    days: [
      [
        { slotTag: "horizontal-press", primaryMuscle: "chest", compound: true },
        { slotTag: "vertical-pull", primaryMuscle: "back", compound: true },
        { slotTag: "squat", primaryMuscle: "legs", compound: true },
        { slotTag: "lateral-shoulder", primaryMuscle: "shoulders" },
      ],
      [
        { slotTag: "hip-hinge", primaryMuscle: "legs", compound: true },
        { slotTag: "horizontal-pull", primaryMuscle: "back", compound: true },
        { slotTag: "vertical-press", primaryMuscle: "shoulders", compound: true },
        { slotTag: "biceps", primaryMuscle: "arms" },
        { slotTag: "triceps", primaryMuscle: "arms" },
      ],
      [
        { slotTag: "incline-press", primaryMuscle: "chest", compound: true },
        { slotTag: "vertical-pull", primaryMuscle: "back", compound: true },
        { slotTag: "quad-isolation", primaryMuscle: "legs" },
        { slotTag: "rear-delt", primaryMuscle: "shoulders" },
        { slotTag: "calf", primaryMuscle: "calves" },
      ],
    ],
  },
  custom: {
    name: "Custom",
    days: [[
      { slotTag: "horizontal-press", primaryMuscle: "chest", compound: true },
      { slotTag: "vertical-pull", primaryMuscle: "back", compound: true },
      { slotTag: "squat", primaryMuscle: "legs", compound: true },
    ]],
  },
};

const DIFFICULTY_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export async function generateWorkout(block: TrainingBlock): Promise<Workout> {
  const profile = await getProfile();
  if (!profile) {
    return generateFallbackWorkout(block);
  }
  return generateProfiledWorkout(profile, block);
}

async function generateProfiledWorkout(profile: UserProfile, block: TrainingBlock): Promise<Workout> {
  const exercises = await fetchExercises();
  const config = PHASE_CONFIG[block.phase];
  const template = SPLIT_TEMPLATES[profile.split] ?? SPLIT_TEMPLATES.ppl;

  const dayIndex = block.weekIndex % template.days.length;
  const slots = template.days[dayIndex];
  const dayName = `${template.name} — Day ${dayIndex + 1}`;

  const maxExercises = Math.min(
    slots.length,
    Math.floor(profile.sessionDuration / 10),
  );

  const chosen: ExerciseDB[] = [];
  for (const slot of slots) {
    if (chosen.length >= maxExercises) break;
    const best = selectExerciseForSlot(slot, exercises, profile, block.phase, chosen);
    if (best) chosen.push(best);
  }

  const workoutExercises: WorkoutExercise[] = chosen.map((ex, i) => ({
    id: `we-${i}`,
    exerciseId: ex.id,
    name: ex.name,
    imageUrl: ex.imageUrl,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    sets: buildSets(config.sets, config.repTarget, estimateWeight(ex, block.phase, profile)),
    restSeconds: config.rest,
    notes: ex.unilateral && profile.medical.includes("Asymmetrical strength")
      ? "Perform each side separately. Start with your weaker side."
      : "",
    slotTag: ex.slotTag,
    isCompound: ex.compound,
    unilateral: ex.unilateral,
  }));

  const totalSets = workoutExercises.reduce((s, e) => s + e.sets.length, 0);
  const estimatedDuration = Math.round((totalSets * (config.rest + 60)) / 60 + 5);

  return {
    id: `workout-${Date.now()}`,
    name: dayName,
    dayLabel: `Week ${block.weekIndex} — ${config.label} Phase`,
    phase: block.phase,
    weekIndex: block.weekIndex,
    estimatedDurationMin: estimatedDuration,
    exercises: workoutExercises,
  };
}

function selectExerciseForSlot(
  slot: SlotRequirement,
  pool: ExerciseDB[],
  profile: UserProfile,
  phase: PhaseType,
  alreadyChosen: ExerciseDB[]
): ExerciseDB | null {
  const candidates = pool.filter((ex) => passesHardGates(ex, slot, profile));
  if (candidates.length === 0) return fallbackSlot(slot, pool, profile, alreadyChosen);
  const scored = candidates
    .map((ex) => ({ ex, score: scoreExercise(ex, slot, profile, phase, alreadyChosen) }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.ex ?? null;
}

function passesHardGates(
  ex: ExerciseDB,
  slot: SlotRequirement,
  profile: UserProfile
): boolean {
  if (ex.slotTag !== slot.slotTag) return false;
  if (slot.compound && !ex.compound) return false;

  // Equipment gate
  const hasEquip = profile.equipment.includes(ex.equipment as UserProfile["equipment"][number])
    || profile.equipment.includes("full-gym");
  if (!hasEquip) return false;

  // Avoided exercises
  if (profile.avoidedExercises.includes(ex.id)) return false;

  // Medical: avoid overhead
  if (profile.medical.includes("Avoid overhead movements") && ex.slotTag === "vertical-press") {
    return false;
  }

  // Difficulty gate: no more than one tier above experience
  const exRank = DIFFICULTY_RANK[ex.difficulty] ?? 0;
  const userRank = DIFFICULTY_RANK[profile.experience] ?? 0;
  if (exRank > userRank + 1) return false;

  return true;
}

function scoreExercise(
  ex: ExerciseDB,
  slot: SlotRequirement,
  profile: UserProfile,
  phase: PhaseType,
  alreadyChosen: ExerciseDB[]
): number {
  let score = 0;

  // Equipment fit (20): exact match full, close partial
  const exactEquip = profile.equipment.includes(ex.equipment as UserProfile["equipment"][number]);
  score += exactEquip ? 20 : profile.equipment.includes("full-gym") ? 15 : 10;

  // Muscle alignment (20)
  score += ex.primaryMuscle === slot.primaryMuscle ? 20 : 10;

  // Difficulty match (15)
  const exRank = DIFFICULTY_RANK[ex.difficulty] ?? 0;
  const userRank = DIFFICULTY_RANK[profile.experience] ?? 0;
  score += exRank === userRank ? 15 : Math.abs(exRank - userRank) === 1 ? 10 : 5;

  // Preference bias (15): favorite full, neutral 7.5
  score += profile.favoriteExercises.includes(ex.id) ? 15 : 7.5;

  // Priority muscle bonus (10)
  const hitsPriority =
    profile.priorityMuscles.length > 0 &&
    (profile.priorityMuscles as string[]).includes(ex.primaryMuscle);
  score += hitsPriority ? 10 : 0;

  // Rotation freshness (10): penalize already chosen this session
  const usedThisSession = alreadyChosen.some((c) => c.id === ex.id);
  score += usedThisSession ? 0 : 10;

  // Compound/phase fit (10)
  if (phase === "strength") {
    score += ex.compound ? 10 : 0;
  } else {
    score += ex.compound && slot.compound ? 10 : !slot.compound ? 5 : 3;
  }

  // Medical comfort modifier (additive, +/- 10)
  score += medicalComfortModifier(ex, profile);

  return Math.max(0, Math.min(100, score));
}

function medicalComfortModifier(ex: ExerciseDB, profile: UserProfile): number {
  let mod = 0;

  // Asymmetrical strength: strongly prefer unilateral
  if (profile.medical.includes("Asymmetrical strength")) {
    mod += ex.unilateral ? 10 : ex.compound ? -6 : 0;
  }

  // Needs unilateral exercises
  if (profile.medical.includes("Needs unilateral exercises")) {
    mod += ex.unilateral ? 8 : -2;
  }

  // Prefers seated exercises
  if (profile.medical.includes("Prefers seated exercises")) {
    if (ex.slotTag === "squat" || ex.slotTag === "vertical-press") {
      mod -= 4;
    }
  }

  // Joint pain: reduce load on compounds
  if (profile.medical.includes("Joint pain") && ex.compound) {
    mod -= 2;
  }

  return mod;
}

function fallbackSlot(
  slot: SlotRequirement,
  pool: ExerciseDB[],
  profile: UserProfile,
  alreadyChosen: ExerciseDB[]
): ExerciseDB | null {
  const byMuscle = pool.filter(
    (ex) => ex.primaryMuscle === slot.primaryMuscle && !alreadyChosen.some((c) => c.id === ex.id)
  );
  const hasEquip = byMuscle.filter((ex) =>
    profile.equipment.includes(ex.equipment as UserProfile["equipment"][number]) ||
    profile.equipment.includes("full-gym")
  );
  if (hasEquip.length > 0) return hasEquip[0];
  if (byMuscle.length > 0) return byMuscle[0];
  return pool.find((ex) => !alreadyChosen.some((c) => c.id === ex.id)) ?? null;
}

function generateFallbackWorkout(block: TrainingBlock): Promise<Workout> {
  const config = PHASE_CONFIG[block.phase];
  return Promise.resolve({
    id: `workout-${Date.now()}`,
    name: "Workout",
    dayLabel: `Week ${block.weekIndex} — ${config.label} Phase`,
    phase: block.phase,
    weekIndex: block.weekIndex,
    estimatedDurationMin: 45,
    exercises: [],
  });
}

function buildSets(count: number, repTarget: number, weight: number): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setIndex: i,
    reps: repTarget,
    weight,
    completed: false,
    side: "both" as const,
  }));
}

function estimateWeight(ex: ExerciseDB, phase: PhaseType, profile: UserProfile): number {
  const bodyweightFactor = profile.weight ? profile.weight / 75 : 1;
  const base =
    ex.primaryMuscle === "chest" ? 22.5
    : ex.primaryMuscle === "shoulders" ? (ex.compound ? 35 : 10)
    : ex.primaryMuscle === "back" ? 40
    : ex.primaryMuscle === "legs" ? (ex.compound ? 60 : 30)
    : ex.primaryMuscle === "arms" ? 12
    : ex.primaryMuscle === "calves" ? 40
    : ex.primaryMuscle === "abs" ? 20
    : 20;
  const adjusted = base * bodyweightFactor;
  return phase === "strength"
    ? Math.round(adjusted * 1.15)
    : phase === "endurance"
    ? Math.round(adjusted * 0.65)
    : Math.round(adjusted);
}

// ============================================================
// Progress data
// ============================================================

export async function fetchProgressData(exerciseId: string): Promise<ProgressPoint[]> {
  const { data, error } = await supabase
    .from("logged_sets")
    .select(`
      weight,
      reps,
      rpe,
      performed_at,
      workout_exercises!inner(exercise_id)
    `)
    .eq("workout_exercises.exercise_id", exerciseId)
    .eq("completed", true)
    .order("performed_at", { ascending: true });
  if (error) throw error;
  if (!data) return [];

  const byDate = new Map<string, { weight: number; reps: number }>();
  for (const row of data as unknown as Array<Record<string, unknown>>) {
    const date = (row.performed_at as string).slice(0, 10);
    const weight = Number(row.weight);
    const reps = Number(row.reps);
    const existing = byDate.get(date);
    const e1rm = weight * (1 + reps / 30);
    if (!existing || e1rm > existing.weight * (1 + existing.reps / 30)) {
      byDate.set(date, { weight, reps });
    }
  }

  return Array.from(byDate.entries()).map(([date, { weight, reps }]) => ({
    date,
    weight,
    reps,
    estimated1RM: Math.round(weight * (1 + reps / 30)),
  }));
}

export async function fetchImbalanceData(): Promise<ImbalanceData[]> {
  const { data, error } = await supabase
    .from("logged_sets")
    .select(`
      weight,
      reps,
      side,
      workout_exercises!inner(exercise_id, exercise:exercises(name))
    `)
    .in("side", ["left", "right"])
    .eq("completed", true);
  if (error) throw error;
  if (!data) return [];

  const byExercise = new Map<string, { left: number; right: number; name: string }>();
  for (const row of data as unknown as Array<Record<string, unknown>>) {
    const we = row.workout_exercises as Record<string, unknown>;
    const exercise = we.exercise as Record<string, unknown>;
    const name = exercise.name as string;
    const side = row.side as string;
    const e1rm = Number(row.weight) * (1 + Number(row.reps) / 30);

    const existing = byExercise.get(name) ?? { left: 0, right: 0, name };
    if (side === "left" && e1rm > existing.left) existing.left = e1rm;
    if (side === "right" && e1rm > existing.right) existing.right = e1rm;
    byExercise.set(name, existing);
  }

  return Array.from(byExercise.values())
    .filter((d) => d.left > 0 && d.right > 0)
    .map((d) => ({
      exerciseName: d.name,
      leftMax: Math.round(d.left),
      rightMax: Math.round(d.right),
      imbalancePct: Math.round(Math.abs(d.left - d.right) / Math.max(d.left, d.right) * 100),
    }));
}

export async function saveLoggedSets(
  workoutExerciseId: string,
  sets: LoggedSet[]
): Promise<void> {
  const rows = sets.map((s) => ({
    workout_exercise_id: workoutExerciseId,
    set_index: s.setIndex,
    weight: s.weight,
    reps: s.reps,
    rpe: s.rpe ?? null,
    completed: s.completed,
    side: s.side,
    performed_at: s.performedAt,
  }));
  const { error } = await supabase.from("logged_sets").insert(rows);
  if (error) throw error;
}

// Exported for testing/UI display
export function getSplitInfo(split: SplitId): { name: string; dayCount: number } {
  const template = SPLIT_TEMPLATES[split] ?? SPLIT_TEMPLATES.ppl;
  return { name: template.name, dayCount: template.days.length };
}
