import { useState, useEffect } from "react";
import { Icon } from "./components/Icon";
import { Splash } from "./screens/Splash";
import { Onboarding } from "./screens/Onboarding";
import { WorkoutPreview } from "./screens/WorkoutPreview";
import { WorkoutActive } from "./screens/WorkoutActive";
import { ProgressScreen } from "./screens/Progress";
import {
  generateWorkout,
  getActiveBlock,
  createInitialBlock,
  saveProfile,
  saveWorkoutToDB,
  completeWorkout,
  advanceWorkoutDay,
} from "./lib/data";
import type { Screen, UserProfile, Workout, TrainingBlock } from "./types";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [block, setBlock] = useState<TrainingBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [reprogramNotice, setReprogramNotice] = useState(false);

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
      setScreen("workout-preview");
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkoutComplete() {
    if (savedWorkoutId) {
      try {
        await completeWorkout(savedWorkoutId);
        if (block && profile) {
          const { block: newBlock, reprogramRecommended } = await advanceWorkoutDay(block, profile);
          setBlock(newBlock);
          if (reprogramRecommended) {
            setReprogramNotice(true);
          }
          const generated = await generateWorkout(newBlock);
          setWorkout(generated);
          const wId = await saveWorkoutToDB(generated, newBlock.id);
          setSavedWorkoutId(wId);
        }
      } catch (e) {
        console.error("Failed to complete workout:", e);
      }
    }
    setScreen("workout-preview");
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
            onBack={() => setScreen("onboarding")}
            onProgress={() => setScreen("progress")}
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

      {screen === "progress" && (
        <ProgressScreen onBack={() => setScreen("workout-preview")} />
      )}
    </>
  );
}
