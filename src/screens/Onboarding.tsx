import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { ProgressBar } from "../components/ProgressBar";
import type {
  UserProfile,
  ExperienceLevel,
  Goal,
  EquipmentId,
  SplitId,
  MuscleId,
} from "../types";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
}

const STEPS = [
  { id: "personal", title: "Personal Info", subtitle: "Tell us about yourself" },
  { id: "experience", title: "Experience", subtitle: "How long have you trained?" },
  { id: "goals", title: "Your Goal", subtitle: "What are you chasing?" },
  { id: "availability", title: "Schedule", subtitle: "When can you train?" },
  { id: "equipment", title: "Equipment", subtitle: "What do you have access to?" },
  { id: "split", title: "Split", subtitle: "How do you want to divide training?" },
  { id: "muscles", title: "Priority Muscles", subtitle: "Pick up to 3 focus areas" },
  { id: "medical", title: "Accessibility", subtitle: "Optional — helps us adapt" },
];

const EQUIPMENT_OPTIONS: { id: EquipmentId; label: string }[] = [
  { id: "dumbbells", label: "Dumbbells" },
  { id: "barbell", label: "Barbell" },
  { id: "machines", label: "Machines" },
  { id: "cable", label: "Cable" },
  { id: "smith", label: "Smith Machine" },
  { id: "bands", label: "Resistance Bands" },
  { id: "bodyweight", label: "Bodyweight" },
  { id: "full-gym", label: "Full Gym" },
];

const SPLIT_OPTIONS: { id: SplitId; label: string; desc: string }[] = [
  { id: "ppl", label: "Push / Pull / Legs", desc: "6 days, muscle-group focused" },
  { id: "upper-lower", label: "Upper / Lower", desc: "4 days, balanced split" },
  { id: "full-body", label: "Full Body", desc: "3 days, full-body each session" },
  { id: "abc", label: "ABC", desc: "Custom 3-day rotation" },
  { id: "custom", label: "Custom", desc: "Define your own days" },
];

const MUSCLE_OPTIONS: { id: MuscleId; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "legs", label: "Legs" },
  { id: "glutes", label: "Glutes" },
  { id: "arms", label: "Arms" },
  { id: "abs", label: "Abs" },
  { id: "calves", label: "Calves" },
];

const GOAL_OPTIONS: { id: Goal; label: string; icon: string }[] = [
  { id: "muscle-growth", label: "Muscle Growth", icon: "trending" },
  { id: "strength", label: "Strength", icon: "zap" },
  { id: "fat-loss", label: "Fat Loss", icon: "flame" },
  { id: "endurance", label: "Endurance", icon: "activity" },
  { id: "athletic", label: "Athletic Performance", icon: "target" },
];

const MEDICAL_OPTIONS = [
  "Joint pain",
  "Mobility limitations",
  "Needs unilateral exercises",
  "Prefers seated exercises",
  "Avoid overhead movements",
  "Asymmetrical strength",
  "Other physical considerations",
];

export function Onboarding({ onComplete, onBack }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    sex: "male",
    experience: "beginner",
    goal: "muscle-growth",
    activityLevel: 3,
    daysPerWeek: 4,
    sessionDuration: 60,
    equipment: ["dumbbells", "barbell"],
    split: "ppl",
    priorityMuscles: [],
    medical: [],
    favoriteExercises: [],
    avoidedExercises: [],
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canAdvance = validateStep(current.id, profile);

  function update(patch: Partial<UserProfile>) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  function next() {
    if (isLast) {
      onComplete(profile as UserProfile);
    } else {
      setStep((s) => s + 1);
    }
  }
  function prev() {
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "var(--space-5) var(--space-5) var(--space-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-tertiary)", letterSpacing: "0.15em" }}>
            STEP {step + 1} / {STEPS.length}
          </span>
          <button onClick={onBack} style={{ color: "var(--fg-tertiary)", fontSize: "0.875rem" }}>
            Skip
          </button>
        </div>
        <ProgressBar value={step + 1} max={STEPS.length || 2} height={4} showGlow />
      </header>

      <main
        style={{
          flex: 1,
          padding: "var(--space-4) var(--space-5) var(--space-6)",
          maxWidth: 640,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div key={current.id} style={{ animation: "fadeInUp 0.4s var(--ease-out)" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
            {current.title}
          </h2>
          <p style={{ color: "var(--fg-tertiary)", marginBottom: "var(--space-6)", fontSize: "0.9375rem" }}>
            {current.subtitle}
          </p>

          {renderStep(current.id, profile, update)}
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
        <Button variant="ghost" onClick={prev}>
          Back
        </Button>
        <Button
          onClick={next}
          disabled={!canAdvance}
          fullWidth
          style={{ flex: 1 }}
        >
          {isLast ? "Generate My Workout" : "Continue"}
          <Icon name="chevron-right" size={18} />
        </Button>
      </footer>
    </div>
  );
}

function validateStep(stepId: string, profile: Partial<UserProfile>): boolean {
  switch (stepId) {
    case "personal":
      return !!profile.name && !!profile.age && !!profile.weight && !!profile.height;
    case "experience":
      return !!profile.experience;
    case "goals":
      return !!profile.goal;
    case "availability":
      return !!profile.daysPerWeek && !!profile.sessionDuration;
    case "equipment":
      return (profile.equipment?.length ?? 0) > 0;
    case "split":
      return !!profile.split;
    case "muscles":
      return (profile.priorityMuscles?.length ?? 0) <= 3;
    case "medical":
      return true;
    default:
      return true;
  }
}

function toggleArray<T>(arr: T[] | undefined, value: T): T[] {
  const current = arr ?? [];
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

function renderStep(
  stepId: string,
  profile: Partial<UserProfile>,
  update: (patch: Partial<UserProfile>) => void
) {
  switch (stepId) {
    case "personal":
      return <PersonalStep profile={profile} update={update} />;
    case "experience":
      return <ExperienceStep profile={profile} update={update} />;
    case "goals":
      return <GoalStep profile={profile} update={update} />;
    case "availability":
      return <AvailabilityStep profile={profile} update={update} />;
    case "equipment":
      return <EquipmentStep profile={profile} update={update} />;
    case "split":
      return <SplitStep profile={profile} update={update} />;
    case "muscles":
      return <MusclesStep profile={profile} update={update} />;
    case "medical":
      return <MedicalStep profile={profile} update={update} />;
    default:
      return null;
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--fg-secondary)", marginBottom: "var(--space-2)", fontWeight: 500 }}>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "14px 16px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        color: "var(--fg-primary)",
        fontSize: "1rem",
        transition: "border 0.2s var(--ease-out)",
        ...props.style,
      }}
    />
  );
}

function PersonalStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <FieldLabel>Name</FieldLabel>
        <TextInput
          placeholder="Your name"
          value={profile.name ?? ""}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        <div>
          <FieldLabel>Age</FieldLabel>
          <TextInput
            type="number"
            inputMode="numeric"
            placeholder="28"
            value={profile.age ?? ""}
            onChange={(e) => update({ age: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel>Sex</FieldLabel>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ sex: s })}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  background: profile.sex === s ? "rgba(249, 115, 22, 0.12)" : "var(--bg-surface)",
                  border: profile.sex === s ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  color: profile.sex === s ? "var(--accent-bright)" : "var(--fg-secondary)",
                  textTransform: "capitalize",
                  transition: "all 0.2s var(--ease-out)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        <div>
          <FieldLabel>Height (cm)</FieldLabel>
          <TextInput
            type="number"
            inputMode="numeric"
            placeholder="178"
            value={profile.height ?? ""}
            onChange={(e) => update({ height: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel>Weight (kg)</FieldLabel>
          <TextInput
            type="number"
            inputMode="numeric"
            placeholder="75"
            value={profile.weight ?? ""}
            onChange={(e) => update({ weight: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function ExperienceStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  const levels: { id: ExperienceLevel; label: string; desc: string }[] = [
    { id: "beginner", label: "Beginner", desc: "Less than 1 year training" },
    { id: "intermediate", label: "Intermediate", desc: "1–3 years consistent training" },
    { id: "advanced", label: "Advanced", desc: "3+ years of structured training" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {levels.map((lvl) => (
        <Card
          key={lvl.id}
          selected={profile.experience === lvl.id}
          onClick={() => update({ experience: lvl.id })}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: 2 }}>
                {lvl.label}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--fg-tertiary)" }}>
                {lvl.desc}
              </div>
            </div>
            {profile.experience === lvl.id && (
              <Icon name="check" size={20} color="var(--accent-bright)" strokeWidth={2.5} />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function GoalStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
      {GOAL_OPTIONS.map((goal) => (
        <Card
          key={goal.id}
          selected={profile.goal === goal.id}
          onClick={() => update({ goal: goal.id })}
          style={{ textAlign: "center" }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: profile.goal === goal.id ? "rgba(249, 115, 22, 0.15)" : "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s var(--ease-out)",
              }}
            >
              <Icon
                name={goal.icon}
                size={24}
                color={profile.goal === goal.id ? "var(--accent-bright)" : "var(--fg-secondary)"}
              />
            </div>
            <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{goal.label}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AvailabilityStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <SliderField
        label="Days per week"
        value={profile.daysPerWeek ?? 4}
        min={2}
        max={7}
        suffix=" days"
        onChange={(v) => update({ daysPerWeek: v })}
      />
      <SliderField
        label="Workout duration"
        value={profile.sessionDuration ?? 60}
        min={30}
        max={120}
        step={15}
        suffix=" min"
        onChange={(v) => update({ sessionDuration: v })}
      />
      <SliderField
        label="Daily activity level"
        value={profile.activityLevel ?? 3}
        min={1}
        max={5}
        suffix=""
        labels={["Sedentary", "Light", "Moderate", "Active", "Very Active"]}
        onChange={(v) => update({ activityLevel: v })}
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  labels,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  labels?: string[];
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-3)" }}>
        <FieldLabel>{label}</FieldLabel>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-bright)" }}>
          {labels ? labels[value - min] : `${value}${suffix}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 6,
          appearance: "none",
          background: "var(--bg-elevated)",
          borderRadius: 3,
          outline: "none",
        }}
        className="forge-slider"
      />
    </div>
  );
}

function EquipmentStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
      {EQUIPMENT_OPTIONS.map((eq) => {
        const selected = profile.equipment?.includes(eq.id);
        return (
          <Card
            key={eq.id}
            selected={selected}
            onClick={() => update({ equipment: toggleArray(profile.equipment, eq.id) })}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{eq.label}</span>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  border: selected ? "none" : "1.5px solid var(--border-strong)",
                  background: selected ? "var(--accent)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s var(--ease-out)",
                }}
              >
                {selected && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SplitStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {SPLIT_OPTIONS.map((split) => (
        <Card
          key={split.id}
          selected={profile.split === split.id}
          onClick={() => update({ split: split.id })}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: 2 }}>{split.label}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--fg-tertiary)" }}>{split.desc}</div>
            </div>
            {profile.split === split.id && (
              <Icon name="check" size={20} color="var(--accent-bright)" strokeWidth={2.5} />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function MusclesStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  const selected = profile.priorityMuscles ?? [];
  const maxReached = selected.length >= 3;

  return (
    <>
      <p style={{ fontSize: "0.8125rem", color: "var(--fg-tertiary)", marginBottom: "var(--space-4)" }}>
        Optional — pick up to 3 focus areas, or skip to work the whole body equally.
      </p>
      <Card
        selected={selected.length === 0}
        onClick={() => update({ priorityMuscles: [] })}
        style={{ marginBottom: "var(--space-3)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 500 }}>Work whole body equally</span>
            <div style={{ fontSize: "0.8125rem", color: "var(--fg-tertiary)", marginTop: 2 }}>
              No priority — balanced development
            </div>
          </div>
          {selected.length === 0 && <Icon name="check" size={20} color="var(--accent-bright)" strokeWidth={2.5} />}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        {MUSCLE_OPTIONS.map((m) => {
          const isSelected = selected.includes(m.id);
          const disabled = !isSelected && maxReached;
          return (
            <Card
              key={m.id}
              selected={isSelected}
              onClick={() => !disabled && update({ priorityMuscles: toggleArray(selected, m.id) })}
              style={{ opacity: disabled ? 0.4 : 1 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{m.label}</span>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    border: isSelected ? "none" : "1.5px solid var(--border-strong)",
                    background: isSelected ? "var(--accent)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s var(--ease-out)",
                  }}
                >
                  {isSelected && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function MedicalStep({
  profile,
  update,
}: {
  profile: Partial<UserProfile>;
  update: (patch: Partial<UserProfile>) => void;
}) {
  const selected = profile.medical ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <Card selected={selected.length === 0} onClick={() => update({ medical: [] })}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 500 }}>None — I have no special considerations</span>
          {selected.length === 0 && <Icon name="check" size={20} color="var(--accent-bright)" strokeWidth={2.5} />}
        </div>
      </Card>

      {MEDICAL_OPTIONS.map((m) => {
        const isSelected = selected.includes(m);
        return (
          <Card
            key={m}
            selected={isSelected}
            onClick={() => update({ medical: toggleArray(selected, m) })}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{m}</span>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  border: isSelected ? "none" : "1.5px solid var(--border-strong)",
                  background: isSelected ? "var(--accent)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s var(--ease-out)",
                }}
              >
                {isSelected && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
