import { useState, useEffect } from "react";
import { Icon } from "./components/Icon";
import { Splash } from "./screens/Splash";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { WorkoutPreview } from "./screens/WorkoutPreview";
import { WorkoutActive } from "./screens/WorkoutActive";
import { Settings } from "./screens/Settings";
import { WeekSummary } from "./screens/WeekSummary";
import {
  generateWorkout,
  getActiveBlock,
  createInitialBlock,
  saveProfile,
  saveWorkoutToDB,
  completeWorkout,
  advanceWorkoutDay,
  resetAllData,
  getSplitInfo,
} from "./lib/data";
import type { Screen, UserProfile, Workout, WorkoutExercise, TrainingBlock } from "./types";

function phaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    hypertrophy: "Hypertrophy",
    strength: "Strength",
    endurance: "Endurance",
    power: "Power",
    deload: "Deload",
  };
  return labels[phase] ?? phase;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [block, setBlock] = useState<TrainingBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [reprogramNotice, setReprogramNotice] = useState(false);
  const [weekSummaryData, setWeekSummaryData] = useState<{
    weekCompleted: number;
    phaseLabel: string;
    phaseChanged: boolean;
    newPhaseLabel: string;
  } | null>(null);

  async function handleOnboardingComplete(p: UserProfile) {
    setLoading(true);
    try {
      setProfile(p);
      await saveProfile(p);
      let activeBlock = await getActiveBlock();
      if (!activeBlock) {
        activeBlock = await createInitialBlock(p.goal);
      }
      setBlock(activeBlock);
      const generated = await generateWorkout(activeBlock);
      setWorkout(generated);
      const wId = await saveWorkoutToDB(generated, activeBlock.id);
      setSavedWorkoutId(wId);
      setScreen("home");
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkoutComplete(exercises: WorkoutExercise[]) {
    if (savedWorkoutId) {
      try {
        await completeWorkout(savedWorkoutId, exercises);
        if (block && profile) {
          const oldPhase = block.phase;
          const oldDayIndex = block.dayIndex;
          const { block: newBlock, reprogramRecommended } = await advanceWorkoutDay(block, profile);
          setBlock(newBlock);
          if (reprogramRecommended) {
            setReprogramNotice(true);
          }
          const generated = await generateWorkout(newBlock);
          setWorkout(generated);
          const wId = await saveWorkoutToDB(generated, newBlock.id);
          setSavedWorkoutId(wId);

          const phaseChanged = newBlock.phase !== oldPhase;
          const dayCount = getSplitInfo(profile.split).dayCount;
          const weekJustCompleted = Math.floor((oldDayIndex + 1) / dayCount);
          const isWeekBoundary = (oldDayIndex + 1) % dayCount === 0;

          if (phaseChanged || isWeekBoundary) {
            setWeekSummaryData({
              weekCompleted: weekJustCompleted,
              phaseLabel: phaseLabel(oldPhase),
              phaseChanged,
              newPhaseLabel: phaseLabel(newBlock.phase),
            });
            setScreen("week-summary");
            return;
          }
        }
      } catch (e) {
        console.error("Failed to complete workout:", e);
      }
    }
    setScreen("home");
  }

  async function handleResetData() {
    setLoading(true);
    try {
      await resetAllData();
      setProfile(null);
      setWorkout(null);
      setBlock(null);
      setSavedWorkoutId(null);
      setReprogramNotice(false);
      setScreen("splash");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateWorkout() {
    if (!block) return;
    setLoading(true);
    try {
      const generated = await generateWorkout(block);
      setWorkout(generated);
      const wId = await saveWorkoutToDB(generated, block.id);
      setSavedWorkoutId(wId);
      setScreen("workout-preview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (screen === "workout-preview" && block && !workout) {
      generateWorkout(block).then(async (w) => {
        setWorkout(w);
        const wId = await saveWorkoutToDB(w, block.id);
        setSavedWorkoutId(wId);
      });
    }
  }, [screen, block, workout]);

  return (
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 10, 12, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{ color: "var(--accent-bright)", fontSize: "0.9375rem", fontWeight: 600 }}>
            Generating your workout...
          </div>
        </div>
      )}

      {screen === "splash" && <Splash onStart={() => setScreen("onboarding")} />}

      {screen === "onboarding" && (
        <Onboarding
          onComplete={handleOnboardingComplete}
          onBack={() => setScreen("splash")}
        />
      )}

      {screen === "home" && profile && (
        <Home
          workout={workout}
          block={block}
          onStartWorkout={() => setScreen("workout-preview")}
          onSettings={() => setScreen("settings")}
        />
      )}

      {screen === "workout-preview" && workout && profile && (
        <>
          {reprogramNotice && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                padding: "var(--space-4) var(--space-5)",
                background: "var(--bg-surface)",
                borderBottom: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                animation: "fadeInUp 0.3s var(--ease-out)",
              }}
            >
              <Icon name="zap" size={20} color="var(--accent-bright)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                  Program change recommended
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--fg-tertiary)" }}>
                  You've completed {block?.cycleIndex ?? 0} full cycles. A new program will keep your progress going.
                </p>
              </div>
              <button
                onClick={() => setReprogramNotice(false)}
                style={{
                  color: "var(--fg-tertiary)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Got it
              </button>
            </div>
          )}
          <WorkoutPreview
            workout={workout}
            profile={profile}
            onStart={() => setScreen("workout-active")}
            onBack={() => setScreen("home")}
            onSettings={() => setScreen("settings")}
          />
        </>
      )}

      {screen === "workout-active" && workout && (
        <WorkoutActive
          workout={workout}
          onComplete={handleWorkoutComplete}
          onBack={() => setScreen("workout-preview")}
        />
      )}

      {screen === "week-summary" && weekSummaryData && (
        <WeekSummary
          weekCompleted={weekSummaryData.weekCompleted}
          phaseLabel={weekSummaryData.phaseLabel}
          phaseChanged={weekSummaryData.phaseChanged}
          newPhaseLabel={weekSummaryData.newPhaseLabel}
          onContinue={() => setScreen("home")}
        />
      )}

      {screen === "settings" && (
        <Settings
          profile={profile}
          onBack={() => setScreen("home")}
          onResetData={handleResetData}
          onRegenerateWorkout={handleRegenerateWorkout}
        />
      )}
    </>
  );
}
