import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { ExerciseImage } from "../components/ExerciseImage";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Workout, WorkoutExercise, UserProfile, PhaseType } from "../types";

interface WorkoutPreviewProps {
  workout: Workout;
  profile: UserProfile;
  onStart: () => void;
  onBack: () => void;
  onProgress: () => void;
  onSettings: () => void;
}

const PHASE_LABELS: Record<PhaseType, { label: string; color: string }> = {
  strength: { label: "Strength", color: "var(--accent-bright)" },
  hypertrophy: { label: "Hypertrophy", color: "var(--accent-bright)" },
  endurance: { label: "Endurance", color: "var(--accent-bright)" },
};

export function WorkoutPreview({ workout, profile, onStart, onBack, onProgress, onSettings }: WorkoutPreviewProps) {
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
  const phase = PHASE_LABELS[workout.phase];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenHeader
        title="Today's Workout"
        subtitle={workout.dayLabel}
        onBack={onBack}
        right={
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <button
              onClick={onProgress}
              aria-label="View progress"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--fg-secondary)",
                transition: "all 0.2s var(--ease-out)",
              }}
            >
              <Icon name="activity" size={20} />
            </button>
            <button
              onClick={onSettings}
              aria-label="Settings"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--fg-secondary)",
                transition: "all 0.2s var(--ease-out)",
              }}
            >
              <Icon name="settings" size={20} />
            </button>
            <div
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(249, 115, 22, 0.12)",
                border: "1px solid rgba(249, 115, 22, 0.3)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: phase.color,
                letterSpacing: "0.05em",
              }}
            >
              {phase.label.toUpperCase()}
            </div>
          </div>
        }
      />

      <main
        style={{
          flex: 1,
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-3) var(--space-5) var(--space-6)",
        }}
      >
        <Card
          style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(194, 65, 12, 0.04))",
            border: "1px solid rgba(249, 115, 22, 0.2)",
            marginBottom: "var(--space-5)",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "var(--space-4)" }}>
            {workout.name}
          </h2>
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            <StatChip icon="clock" label="Duration" value={`${workout.estimatedDurationMin} min`} />
            <StatChip icon="dumbbell" label="Exercises" value={`${workout.exercises.length}`} />
            <StatChip icon="activity" label="Sets" value={`${totalSets}`} />
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {workout.exercises.map((ex, i) => (
            <ExerciseRow key={ex.id} exercise={ex} index={i} />
          ))}
        </div>

        <div
          style={{
            marginTop: "var(--space-6)",
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            display: "flex",
            gap: "var(--space-3)",
            alignItems: "flex-start",
          }}
        >
          <div style={{ color: "var(--accent-bright)", paddingTop: 2 }}>
            <Icon name="zap" size={18} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--fg-secondary)", lineHeight: 1.6 }}>
            Forge generated this workout from your profile: {profile.goal.replace("-", " ")}, {profile.experience} level, {profile.split.toUpperCase()} split. Exercises scored against equipment, priority muscles, and rotation freshness.
          </p>
        </div>
      </main>

      <footer
        style={{
          padding: "var(--space-4) var(--space-5) var(--space-6)",
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Button size="lg" fullWidth onClick={onStart}>
          <Icon name="play" size={20} />
          Start Workout
        </Button>
      </footer>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-tertiary)", fontSize: "0.75rem" }}>
        <Icon name={icon} size={14} />
        {label}
      </div>
      <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function ExerciseRow({ exercise, index }: { exercise: WorkoutExercise; index: number }) {
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <Card padding="var(--space-4)">
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
        <ExerciseImage url={exercise.imageUrl} name={exercise.name} size={56} radius={12} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)", fontWeight: 600 }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
              {exercise.name}
            </h3>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", fontSize: "0.8125rem", color: "var(--fg-secondary)", flexWrap: "wrap" }}>
            <span>{exercise.sets.length} × {exercise.sets[0]?.reps} reps</span>
            <span>·</span>
            <span>{exercise.sets[0]?.weight} kg</span>
            <span>·</span>
            <span>{exercise.restSeconds}s rest</span>
            <span>·</span>
            <span style={{ textTransform: "capitalize" }}>{exercise.primaryMuscle}</span>
          </div>
          {exercise.instructions && (
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                marginTop: "var(--space-2)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8125rem",
                color: "var(--accent-bright)",
                fontWeight: 500,
                transition: "all 0.2s var(--ease-out)",
              }}
            >
              <Icon name={showInstructions ? "chevron-down" : "chevron-right"} size={14} />
              {showInstructions ? "Hide" : "Instructions"}
            </button>
          )}
          {showInstructions && exercise.instructions && (
            <div
              style={{
                marginTop: "var(--space-2)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border)",
                fontSize: "0.8125rem",
                color: "var(--fg-secondary)",
                lineHeight: 1.5,
                animation: "fadeInUp 0.3s var(--ease-out)",
              }}
            >
              {exercise.instructions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
