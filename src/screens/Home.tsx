import { useState, useMemo } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Workout, TrainingBlock } from "../types";

interface HomeProps {
  workout: Workout | null;
  block: TrainingBlock | null;
  onStartWorkout: () => void;
  onSettings: () => void;
}

const MOODS = [
  { id: "motivated", label: "Motivated", icon: "flame" },
  { id: "happy", label: "Happy", icon: "thumbs-up" },
  { id: "neutral", label: "Okay", icon: "meh" },
  { id: "tired", label: "Tired", icon: "clock" },
  { id: "lazy", label: "Lazy", icon: "pause" },
] as const;

const PHRASES = [
  "Strength does not come from winning. It comes from struggle.",
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't have to be extreme, just consistent.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Success isn't always about greatness. It's about consistency.",
  "Stop wishing. Start doing.",
  "Your only limit is you.",
  "Great things never come from comfort zones.",
  "The hard days are what make you stronger.",
  "Sweat is just fat crying.",
];

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    hypertrophy: "Hypertrophy",
    strength: "Strength",
    power: "Power",
    deload: "Deload",
  };
  return labels[phase] ?? phase;
}

export function Home({ workout, block, onStartWorkout, onSettings }: HomeProps) {
  const [mood, setMood] = useState<string | null>(null);

  const phrase = useMemo(() => {
    const idx = Math.floor(Date.now() / 86400000) % PHRASES.length;
    return PHRASES[idx];
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const phaseLabel = block ? getPhaseLabel(block.phase) : "";
  const weekLabel = block ? `Week ${block.weekIndex + 1} of ${block.blockLengthWeeks}` : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenHeader
        title="Forge"
        subtitle={greeting}
        onBack={undefined}
        right={
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
        <div
          style={{
            padding: "var(--space-5)",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(194, 65, 12, 0.03))",
            border: "1px solid rgba(249, 115, 22, 0.15)",
            marginBottom: "var(--space-4)",
          }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--fg-secondary)", marginBottom: "var(--space-3)" }}>
            How are you feeling today?
          </p>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: 999,
                  background: mood === m.id ? "rgba(249, 115, 22, 0.12)" : "var(--bg-surface)",
                  border: mood === m.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                  color: mood === m.id ? "var(--accent-bright)" : "var(--fg-secondary)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  transition: "all 0.2s var(--ease-out)",
                }}
              >
                <Icon name={m.icon} size={16} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <Card padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
          <p
            style={{
              fontSize: "0.95rem",
              fontStyle: "italic",
              color: "var(--fg-secondary)",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            "{phrase}"
          </p>
        </Card>

        {block && (
          <Card padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Current Phase
                </span>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: 2 }}>{phaseLabel}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Progress
                </span>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: 2 }}>{weekLabel}</p>
              </div>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--bg-surface-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${((block.weekIndex + 1) / block.blockLengthWeeks) * 100}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: "linear-gradient(90deg, var(--accent), var(--accent-bright))",
                  transition: "width 0.5s var(--ease-out)",
                }}
              />
            </div>
          </Card>
        )}

        {workout && (
          <Card padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Today's Workout
                </span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 2 }}>
                  Workout {workout.workoutLetter} — Day {workout.dayNumber}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--fg-secondary)", marginTop: 4 }}>
                  {workout.exercises.length} exercises · ~{workout.estimatedDurationMin} min
                </p>
              </div>
              <div
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  background: "rgba(249, 115, 22, 0.12)",
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--accent-bright)",
                }}
              >
                {workout.dayLabel}
              </div>
            </div>
            <Button fullWidth onClick={onStartWorkout}>
              <Icon name="play" size={20} />
              Start Workout
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
