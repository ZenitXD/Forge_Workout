export type Screen =
  | "splash"
  | "onboarding"
  | "workout-preview"
  | "workout-active"
  | "progress"
  | "settings"
  | "phase-transition";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type Goal = "muscle-growth" | "strength" | "fat-loss" | "endurance" | "athletic";

export type EquipmentId =
  | "dumbbells"
  | "barbell"
  | "machines"
  | "cable"
  | "smith"
  | "bands"
  | "bodyweight"
  | "full-gym";

export type SplitId = "abc" | "ppl" | "upper-lower" | "full-body" | "custom";

export type MuscleId =
  | "chest"
  | "back"
  | "shoulders"
  | "legs"
  | "glutes"
  | "arms"
  | "abs"
  | "calves";

export type PhaseType = "strength" | "hypertrophy" | "endurance";

export type Side = "both" | "left" | "right";

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  sex: "male" | "female";
  experience: ExperienceLevel;
  goal: Goal;
  activityLevel: number;
  daysPerWeek: number;
  sessionDuration: number;
  equipment: EquipmentId[];
  split: SplitId;
  favoriteExercises: string[];
  avoidedExercises: string[];
  priorityMuscles: MuscleId[];
  medical: string[];
}

export interface ExerciseSet {
  setIndex: number;
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number;
  side?: Side;
}

export interface ExerciseDB {
  id: string;
  name: string;
  description: string;
  instructions: string;
  commonMistakes: string;
  imageUrl: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  movementPattern: string;
  compound: boolean;
  unilateral: boolean;
  homeCompatible: boolean;
  gymCompatible: boolean;
  slotTag: string;
  alternatives: string[];
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  imageUrl: string;
  instructions: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  sets: ExerciseSet[];
  restSeconds: number;
  notes: string;
  slotTag: string;
  isCompound: boolean;
  unilateral: boolean;
}

export interface Workout {
  id: string;
  name: string;
  dayLabel: string;
  phase: PhaseType;
  weekIndex: number;
  estimatedDurationMin: number;
  exercises: WorkoutExercise[];
}

export interface TrainingBlock {
  id: string;
  phase: PhaseType;
  cycleIndex: number;
  weekIndex: number;
  blockLengthWeeks: number;
  status: "active" | "complete";
  startedAt: string | null;
  completedAt: string | null;
}

export interface LoggedSet {
  id: string;
  workoutExerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  side: Side;
  performedAt: string;
}

export interface ProgressPoint {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number;
}

export interface ImbalanceData {
  exerciseName: string;
  leftMax: number;
  rightMax: number;
  imbalancePct: number;
}

export interface ExerciseHistoryEntry {
  exerciseId: string;
  daysAgo: number;
}

export interface MuscleVolume {
  muscle: string;
  weeklySets: number;
}
