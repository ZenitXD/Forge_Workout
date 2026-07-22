import { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import { LineChart } from "../components/Charts";
import { fetchProgressData, fetchLastWeights } from "../lib/data";
import { supabase } from "../lib/supabase";
import type { ProgressPoint } from "../types";

interface WeekSummaryProps {
  weekCompleted: number;
  phaseLabel: string;
  phaseChanged: boolean;
  newPhaseLabel: string;
  onContinue: () => void;
}

export function WeekSummary({
  weekCompleted,
  phaseLabel,
  phaseChanged,
  newPhaseLabel,
  onContinue,
}: WeekSummaryProps) {
  const [topExercises, setTopExercises] = useState<{ name: string; data: ProgressPoint[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const lastWeights = await fetchLastWeights();
        const exerciseIds = Array.from(lastWeights.keys()).slice(0, 3);
        const names = new Map<string, string>();
        if (exerciseIds.length > 0) {
          const { data: exRows } = await supabase
            .from("exercises")
            .select("id, name")
            .in("id", exerciseIds);
          if (exRows) {
            for (const row of exRows as Array<{ id: string; name: string }>) {
              names.set(row.id, row.name);
            }
          }
        }
        const results: { name: string; data: ProgressPoint[] }[] = [];
        for (const exId of exerciseIds) {
          const data = await fetchProgressData(exId);
          if (data.length > 0) {
            results.push({ name: names.get(exId) ?? "Exercise", data });
          }
        }
        setTopExercises(results);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ScreenHeader title="Week Complete" subtitle={`${phaseLabel} — Week ${weekCompleted}`} />

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
            textAlign: "center",
            padding: "var(--space-6) var(--space-4)",
            marginBottom: "var(--space-4)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.12)",
              border: "2px solid rgba(34, 197, 94, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--space-3)",
            }}
          >
            <Icon name="check-circle" size={32} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>
            Week {weekCompleted} Done!
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--fg-secondary)" }}>
            {phaseChanged
              ? `Moving to ${newPhaseLabel} phase`
              : `Keep pushing — ${phaseLabel} continues`}
          </p>
        </div>

        {loading ? (
          <Card padding="var(--space-5)" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--fg-tertiary)" }}>Loading progress...</p>
          </Card>
        ) : topExercises.length > 0 ? (
          <>
            {topExercises.map((ex, i) => {
              const chartData = ex.data.map((p, idx) => ({
                label: `S${idx + 1}`,
                value: p.weight,
              }));
              return (
                <Card key={i} padding="var(--space-5)" style={{ marginBottom: "var(--space-4)" }}>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                    {ex.name}
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--fg-tertiary)", marginBottom: "var(--space-4)" }}>
                    Top weight per session (kg)
                  </p>
                  <LineChart data={chartData} unit="kg" height={140} />
                </Card>
              );
            })}
          </>
        ) : (
          <Card padding="var(--space-5)" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--fg-tertiary)" }}>
              Complete more workouts to see your progress charts here.
            </p>
          </Card>
        )}

        <Button fullWidth onClick={onContinue} style={{ marginTop: "var(--space-3)" }}>
          <Icon name="chevron-right" size={20} />
          Continue to Next Workout
        </Button>
      </main>
    </div>
  );
}
