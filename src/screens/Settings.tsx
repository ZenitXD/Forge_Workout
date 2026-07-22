import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { UserProfile } from "../types";

interface SettingsProps {
  profile: UserProfile | null;
  onBack: () => void;
  onResetData: () => void;
  onRegenerateWorkout: () => void;
}

export function Settings({ profile, onBack, onResetData, onRegenerateWorkout }: SettingsProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<"good" | "okay" | "bad" | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Settings" subtitle="Profile & preferences" onBack={onBack} />

      <main
        style={{
          flex: 1,
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-3) var(--space-5) var(--space-6)",
        }}
      >
        {profile && (
          <Card padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--fg-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
              Your Profile
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <ProfileRow label="Goal" value={profile.goal.replace("-", " ")} />
              <ProfileRow label="Experience" value={profile.experience} />
              <ProfileRow label="Split" value={profile.split.toUpperCase()} />
              <ProfileRow label="Session Duration" value={`${profile.sessionDuration} min`} />
              <ProfileRow label="Equipment" value={profile.equipment.join(", ")} />
              {profile.priorityMuscles.length > 0 && (
                <ProfileRow label="Priority Muscles" value={profile.priorityMuscles.join(", ")} />
              )}
              {profile.medical.length > 0 && (
                <ProfileRow label="Considerations" value={profile.medical.join(", ")} />
              )}
            </div>
          </Card>
        )}

        <Card padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--fg-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
            Workout Feedback
          </h3>
          {feedbackSubmitted ? (
            <p style={{ fontSize: "0.875rem", color: "var(--fg-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="check-circle" size={18} color="var(--success)" />
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.875rem", color: "var(--fg-secondary)", marginBottom: "var(--space-3)" }}>
                How did your last workout feel?
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <FeedbackButton
                  selected={feedback === "good"}
                  icon="thumbs-up"
                  label="Great"
                  onClick={() => { setFeedback("good"); setFeedbackSubmitted(true); }}
                />
                <FeedbackButton
                  selected={feedback === "okay"}
                  icon="meh"
                  label="Okay"
                  onClick={() => { setFeedback("okay"); setFeedbackSubmitted(true); }}
                />
                <FeedbackButton
                  selected={feedback === "bad"}
                  icon="thumbs-down"
                  label="Too hard"
                  onClick={() => { setFeedback("bad"); setFeedbackSubmitted(true); }}
                />
              </div>
            </>
          )}
        </Card>

        <Card padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--fg-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
            Workout Actions
          </h3>
          <Button variant="secondary" fullWidth onClick={onRegenerateWorkout} style={{ marginBottom: "var(--space-3)" }}>
            <Icon name="refresh-cw" size={18} />
            Regenerate Today's Workout
          </Button>
        </Card>

        <Card padding="var(--space-5)" style={{ border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--error)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)" }}>
            Danger Zone
          </h3>
          {!confirmReset ? (
            <Button variant="ghost" fullWidth onClick={() => setConfirmReset(true)} style={{ color: "var(--error)" }}>
              <Icon name="trash-2" size={18} />
              Reset All Data
            </Button>
          ) : (
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--fg-secondary)", marginBottom: "var(--space-3)" }}>
                This will erase your profile, workout history, and training blocks. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
                <Button variant="primary" fullWidth onClick={onResetData} style={{ background: "var(--error)" }}>
                  Yes, Delete Everything
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--fg-tertiary)" }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "capitalize" }}>{value}</span>
    </div>
  );
}

function FeedbackButton({ selected, icon, label, onClick }: { selected: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "var(--space-4) var(--space-3)",
        borderRadius: "var(--radius-md)",
        background: selected ? "rgba(249, 115, 22, 0.1)" : "var(--bg-surface-2)",
        border: selected ? "1px solid var(--accent)" : "1px solid var(--border)",
        color: selected ? "var(--accent-bright)" : "var(--fg-secondary)",
        fontSize: "0.8125rem",
        fontWeight: 500,
        transition: "all 0.2s var(--ease-out)",
      }}
    >
      <Icon name={icon} size={22} />
      {label}
    </button>
  );
}
