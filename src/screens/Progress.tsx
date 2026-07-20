import { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import { LineChart, ImbalanceChart } from "../components/Charts";
import { supabase } from "../lib/supabase";
import { fetchProgressData, fetchImbalanceData } from "../lib/data";
import type { ExerciseDB, ProgressPoint, ImbalanceData } from "../types";

interface ProgressScreenProps {
  onBack: () => void;
}

export function ProgressScreen({ onBack }: ProgressScreenProps) {
  const [exercises, setExercises] = useState<ExerciseDB[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressPoint[]>([]);
  const [imbalanceData, setImbalanceData] = useState<ImbalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"progress" | "imbalance">("progress");

  useEffect(() => {
    async function load() {
      try {
        const { data: exData } = await supabase.from("exercises").select("*");
        const mapped = (exData ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          imageUrl: r.image_url,
          primaryMuscle: r.primary_muscle,
          equipment: r.equipment,
          compound: r.compound,
          unilateral: r.unilateral,
          slotTag: r.slot_tag,
        })) as ExerciseDB[];
        setExercises(mapped);
        if (mapped.length > 0 && !selectedExercise) {
          setSelectedExercise(mapped[0].id);
        }
        const imbalance = await fetchImbalanceData();
        setImbalanceData(imbalance);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;
    fetchProgressData(selectedExercise).then(setProgressData).catch(() => setProgressData([]));
  }, [selectedExercise]);

  const chartData = progressData.map((p) => ({
    label: p.date.slice(5),
    value: p.weight,
  }));
  const repsData = progressData.map((p) => ({
    label: p.date.slice(5),
    value: p.reps,
  }));

  const latest = progressData[progressData.length - 1];
  const first = progressData[0];
  const weightChange = latest && first ? latest.weight - first.weight : 0;
  const e1rmChange = latest && first ? latest.estimated1RM - first.estimated1RM : 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenHeader
        title="Progress"
        subtitle="Track your strength over time"
        onBack={onBack}
      />

      <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", background: "var(--bg-surface)", padding: 4, borderRadius: 12, border: "1px solid var(--border)" }}>
          {(["progress", "imbalance"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 9,
                background: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "#fff" : "var(--fg-secondary)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "capitalize",
                transition: "all 0.2s var(--ease-out)",
              }}
            >
              {t === "imbalance" ? "L / R Balance" : "Strength"}
            </button>
          ))}
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
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-7)", color: "var(--fg-tertiary)" }}>
            Loading...
          </div>
        ) : tab === "progress" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <ExerciseSelector
              exercises={exercises}
              selected={selectedExercise}
              onSelect={setSelectedExercise}
            />

            {progressData.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
                <StatCard label="Current" value={latest ? `${latest.weight}kg` : "—"} icon="dumbbell" />
                <StatCard
                  label="Weight Change"
                  value={weightChange !== 0 ? `${weightChange > 0 ? "+" : ""}${weightChange}kg` : "—"}
                  icon="trending"
                  positive={weightChange > 0}
                />
                <StatCard
                  label="Est. 1RM Change"
                  value={e1rmChange !== 0 ? `${e1rmChange > 0 ? "+" : ""}${e1rmChange}kg` : "—"}
                  icon="zap"
                  positive={e1rmChange > 0}
                />
              </div>
            )}

            <Card>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                Weight Lifted Over Time
              </h3>
              <LineChart data={chartData} unit="kg" height={180} />
            </Card>

            <Card>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                Reps Over Time
              </h3>
              <LineChart data={repsData} color="var(--success)" height={140} />
            </Card>

            {progressData.length > 0 && (
              <div
                style={{
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
                  {weightChange > 0
                    ? `You've increased your weight by ${weightChange}kg since you started tracking this exercise. Keep it up!`
                    : progressData.length < 2
                    ? "Complete more sessions to see your progression trend."
                    : "Your weight is holding steady — try adding reps before increasing load."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Card>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                Left vs Right Strength
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--fg-tertiary)", marginBottom: "var(--space-5)" }}>
                Based on estimated 1RM from unilateral exercises logged with left/right sides.
              </p>
              <ImbalanceChart
                data={imbalanceData.map((d) => ({
                  label: d.exerciseName,
                  left: d.leftMax,
                  right: d.rightMax,
                }))}
              />
            </Card>

            <div
              style={{
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "flex-start",
              }}
            >
              <div style={{ color: "var(--warning)", paddingTop: 2 }}>
                <Icon name="activity" size={18} />
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--fg-secondary)", lineHeight: 1.6 }}>
                {imbalanceData.length === 0
                  ? "Log unilateral exercises (like split squats or curls) with separate left/right sides during your workout to track imbalances."
                  : "A imbalance of 10% or more is highlighted. Consider adding an extra set on your weaker side."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ExerciseSelector({
  exercises,
  selected,
  onSelect,
}: {
  exercises: ExerciseDB[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const filtered = exercises.filter((e) => e.compound || e.unilateral);
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-2)",
        overflowX: "auto",
        paddingBottom: "var(--space-2)",
        scrollbarWidth: "thin",
      }}
    >
      {filtered.map((ex) => (
        <button
          key={ex.id}
          onClick={() => onSelect(ex.id)}
          style={{
            flexShrink: 0,
            padding: "10px 16px",
            borderRadius: 10,
            background: selected === ex.id ? "rgba(249, 115, 22, 0.12)" : "var(--bg-surface)",
            border: selected === ex.id ? "1px solid var(--accent)" : "1px solid var(--border)",
            color: selected === ex.id ? "var(--accent-bright)" : "var(--fg-secondary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            transition: "all 0.2s var(--ease-out)",
          }}
        >
          {ex.name}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  positive,
}: {
  label: string;
  value: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "var(--fg-tertiary)", fontSize: "0.75rem" }}>
        <Icon name={icon} size={14} />
        {label}
      </div>
      <div
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: positive === true ? "var(--success)" : positive === false ? "var(--error)" : "var(--fg-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
