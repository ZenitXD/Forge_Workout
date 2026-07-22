import { useState, useEffect, useRef } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { ExerciseImage } from "../components/ExerciseImage";
import { ProgressBar } from "../components/ProgressBar";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Workout, WorkoutExercise, ExerciseSet } from "../types";

interface WorkoutActiveProps {
  workout: Workout;
  onComplete: (exercises: WorkoutExercise[]) => void;
  onBack: () => void;
}

export function WorkoutActive({ workout, onComplete, onBack }: WorkoutActiveProps) {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(workout.exercises);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const timerRef = useRef<number | null>(null);

  const current = exercises[currentExerciseIdx];
  const completedSets = exercises.reduce(
    (s, e) => s + e.sets.filter((set) => set.completed).length,
    0
  );
  const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function updateSet(exIdx: number, setIdx: number, patch: Partial<ExerciseSet>) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((set, j) =>
                j !== setIdx ? set : { ...set, ...patch }
              ),
            }
      )
    );
  }

  function toggleSet(exIdx: number, setIdx: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((set, j) =>
                j !== setIdx ? set : { ...set, completed: !set.completed }
              ),
            }
      )
    );
  }

  function startRest(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTotal(seconds);
    setRestTimer(seconds);
    timerRef.current = window.setInterval(() => {
      setRestTimer((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer(null);
  }

  function nextExercise() {
    if (currentExerciseIdx < exercises.length - 1) {
      setCurrentExerciseIdx((i) => i + 1);
      skipRest();
    } else {
      onComplete(exercises);
    }
  }

  function prevExercise() {
    if (currentExerciseIdx > 0) {
      setCurrentExerciseIdx((i) => i - 1);
      skipRest();
    }
  }

  const isLastExercise = currentExerciseIdx === exercises.length - 1;
  const allCurrentSetsDone = current.sets.every((s) => s.completed);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenHeader
        title={workout.name}
        subtitle={workout.dayLabel}
        onBack={onBack}
        right={
          <span style={{ fontSize: "0.875rem", color: "var(--fg-secondary)", fontWeight: 600 }}>
            {completedSets}/{totalSets}
          </span>
        }
      />

      <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
        <ProgressBar value={completedSets} max={totalSets || 2} showGlow />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-2)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)" }}>
            Exercise {currentExerciseIdx + 1} of {exercises.length}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)" }}>
            {Math.round((completedSets / Math.max(1, totalSets)) * 100)}% complete
          </span>
        </div>
      </div>

      <main
        style={{
          flex: 1,
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-2) var(--space-5) var(--space-6)",
        }}
      >
        <div key={current.id} style={{ animation: "slideInRight 0.4s var(--ease-out)" }}>
          <ExerciseHeader exercise={current} index={currentExerciseIdx} />

          {current.lastWeight != null && current.lastWeight > 0 && (
            <div
              style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: "rgba(249, 115, 22, 0.08)",
                border: "1px solid rgba(249, 115, 22, 0.2)",
                fontSize: "0.8125rem",
                color: "var(--accent-bright)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="trending" size={16} />
              Last time you used {current.lastWeight} kg on this exercise
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-5)" }}>
            <SetRowHeader />
            {current.sets.map((set, i) => (
              <SetRow
                key={i}
                set={set}
                setIndex={i}
                completed={set.completed}
                onToggle={() => toggleSet(currentExerciseIdx, i)}
                onUpdate={(patch) => updateSet(currentExerciseIdx, i, patch)}
              />
            ))}
          </div>

          {restTimer !== null && (
            <RestTimer remaining={restTimer} total={restTotal} onSkip={skipRest} />
          )}
        </div>
      </main>

      <footer
        style={{
          padding: "var(--space-4) var(--space-5) var(--space-6)",
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          gap: "var(--space-3)",
        }}
      >
        <Button variant="secondary" onClick={prevExercise} disabled={currentExerciseIdx === 0}>
          <Icon name="chevron-right" size={18} style={{ transform: "rotate(180deg)" }} />
          Prev
        </Button>
        {restTimer === null && !allCurrentSetsDone && (
          <Button variant="secondary" fullWidth onClick={() => startRest(current.restSeconds)}>
            <Icon name="clock" size={18} />
            Rest {current.restSeconds}s
          </Button>
        )}
        {allCurrentSetsDone && (
          <Button fullWidth onClick={nextExercise}>
            {isLastExercise ? (
              <>
                <Icon name="check-circle" size={20} />
                Finish Workout
              </>
            ) : (
              <>
                Next Exercise
                <Icon name="chevron-right" size={18} />
              </>
            )}
          </Button>
        )}
      </footer>
    </div>
  );
}

function ExerciseHeader({ exercise, index }: { exercise: WorkoutExercise; index: number }) {
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--bg-surface), var(--bg-surface-2))",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
      }}
    >
      <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
        <ExerciseImage url={exercise.imageUrl} name={exercise.name} size={72} radius={16} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)", fontWeight: 600 }}>
            EXERCISE {String(index + 1).padStart(2, "0")}
          </span>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, marginTop: 2, marginBottom: 6 }}>
            {exercise.name}
          </h2>
          <div style={{ display: "flex", gap: "var(--space-3)", fontSize: "0.8125rem", color: "var(--fg-secondary)" }}>
            <span style={{ textTransform: "capitalize" }}>{exercise.primaryMuscle}</span>
            <span>·</span>
            <span>{exercise.restSeconds}s rest</span>
            {exercise.isCompound && (
              <>
                <span>·</span>
                <span>Compound</span>
              </>
            )}
          </div>
          {exercise.instructions && (
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                marginTop: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.8125rem",
                color: "var(--accent-bright)",
                fontWeight: 500,
                transition: "all 0.2s var(--ease-out)",
              }}
            >
              <Icon name={showInstructions ? "chevron-down" : "chevron-right"} size={16} />
              {showInstructions ? "Hide instructions" : "How to perform"}
            </button>
          )}
          {showInstructions && exercise.instructions && (
            <div
              style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border)",
                fontSize: "0.875rem",
                color: "var(--fg-secondary)",
                lineHeight: 1.6,
                animation: "fadeInUp 0.3s var(--ease-out)",
              }}
            >
              {exercise.instructions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SetRowHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 1fr 40px",
        gap: "var(--space-2)",
        padding: "0 var(--space-3)",
        fontSize: "0.75rem",
        color: "var(--fg-tertiary)",
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <span>Set</span>
      <span style={{ textAlign: "center" }}>kg</span>
      <span style={{ textAlign: "center" }}>Reps</span>
      <span />
    </div>
  );
}

function SetRow({
  set,
  setIndex,
  completed,
  onToggle,
  onUpdate,
}: {
  set: ExerciseSet;
  setIndex: number;
  completed: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<ExerciseSet>) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 1fr 40px",
        gap: "var(--space-2)",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        background: completed ? "rgba(34, 197, 94, 0.08)" : "var(--bg-surface)",
        border: completed ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid var(--border)",
        alignItems: "center",
        animation: "scaleIn 0.3s var(--ease-out)",
      }}
    >
      <span style={{ fontWeight: 600, color: completed ? "var(--success)" : "var(--fg-secondary)" }}>
        {setIndex + 1}
      </span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="0"
        value={set.weight || ""}
        onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
        style={inputStyle(completed)}
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder={String(set.reps)}
        value={set.reps || ""}
        onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
        style={inputStyle(completed)}
      />
      <button
        onClick={onToggle}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: completed ? "none" : "1.5px solid var(--border-strong)",
          background: completed ? "var(--success)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s var(--ease-spring)",
          cursor: "pointer",
        }}
      >
        {completed && <Icon name="check" size={16} color="#fff" strokeWidth={3} />}
      </button>
    </div>
  );
}

function inputStyle(completed: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "var(--space-2) var(--space-3)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg-surface-2)",
    color: "var(--fg-primary)",
    fontSize: "0.875rem",
    fontWeight: 600,
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.2s var(--ease-out)",
    ...(completed ? { opacity: 0.7, textDecoration: "line-through" } : {}),
  };
}

function RestTimer({ remaining, total, onSkip }: { remaining: number; total: number; onSkip: () => void }) {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`;

  return (
    <div
      style={{
        marginTop: "var(--space-5)",
        padding: "var(--space-5)",
        borderRadius: "var(--radius-lg)",
        background: "linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(194, 65, 12, 0.04))",
        border: "1px solid rgba(249, 115, 22, 0.25)",
        textAlign: "center",
        animation: "scaleIn 0.3s var(--ease-spring)",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--accent-bright)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "var(--space-2)" }}>
        Rest
      </div>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", marginBottom: "var(--space-3)" }}>
        {display}
      </div>
      <ProgressBar value={total - remaining} max={total || 2} height={4} showGlow />
      <Button variant="ghost" size="sm" onClick={onSkip} style={{ marginTop: "var(--space-3)" }}>
        Skip Rest
      </Button>
    </div>
  );
}
