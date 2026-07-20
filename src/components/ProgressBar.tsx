interface ProgressBarProps {
  value: number;
  max: number;
  height?: number;
  showGlow?: boolean;
}

export function ProgressBar({ value, max, height = 6, showGlow }: ProgressBarProps) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);

  return (
    <div
      style={{
        width: "100%",
        height,
        background: "var(--bg-elevated)",
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, var(--accent), var(--accent-bright))",
          borderRadius: height / 2,
          transition: "width 0.5s var(--ease-out)",
          boxShadow: showGlow ? "0 0 12px var(--accent-glow)" : undefined,
        }}
      />
    </div>
  );
}
