import { useState, useEffect } from "react";
import { Splash } from "./screens/Splash";
import { Onboarding } from "./screens/Onboarding";
import { WorkoutPreview } from "./screens/WorkoutPreview";
import { WorkoutActive } from "./screens/WorkoutActive";
import { ProgressScreen } from "./screens/Progress";
import { generateWorkout, getActiveBlock, createInitialBlock, saveProfile } from "./lib/data";
import type { Screen, UserProfile, Workout, TrainingBlock } from "./types";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [block, setBlock] = useState<TrainingBlock | null>(null);
  const [loading, setLoading] = useState(false);

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
      setScreen("workout-preview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (screen === "workout-preview" && block && !workout) {
      generateWorkout(block).then(setWorkout);
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
        <WorkoutPreview
          workout={workout}
          profile={profile}
          onStart={() => setScreen("workout-active")}
          onBack={() => setScreen("onboarding")}
          onProgress={() => setScreen("progress")}
        />
      )}

      {screen === "workout-active" && workout && (
        <WorkoutActive
          workout={workout}
          onComplete={() => setScreen("workout-preview")}
          onBack={() => setScreen("workout-preview")}
        />
      )}

      {screen === "progress" && (
        <ProgressScreen onBack={() => setScreen("workout-preview")} />
      )}
    </>
  );
}
