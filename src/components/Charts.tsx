interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  unit?: string;
}

export function LineChart({ data, color = "var(--accent)", height = 160, unit = "" }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg-tertiary)",
          fontSize: "0.875rem",
        }}
      >
        No data yet — complete workouts to see progress
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = range * 0.15;
  const chartMax = max + padding;
  const chartMin = Math.max(0, min - padding);
  const chartRange = chartMax - chartMin || 1;

  const width = 100;
  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - ((d.value - chartMin) / chartRange) * (height - 20) - 10;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(chartMin + (chartRange / yTicks) * i)
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, overflow: "visible" }}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {tickValues.map((tv, i) => {
          const y = height - (i / yTicks) * (height - 20) - 10;
          return (
            <g key={i}>
              <line
                x1="0" y1={y} x2={width} y2={y}
                stroke="var(--border)"
                strokeWidth="0.3"
                strokeDasharray="1 2"
              />
              <text
                x="0" y={y - 1}
                fill="var(--fg-tertiary)"
                fontSize="6"
                fontFamily="inherit"
              >
                {tv}{unit}
              </text>
            </g>
          );
        })}

        {data.length > 1 && (
          <path d={areaD} fill="url(#chart-fill)" />
        )}
        {data.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="1.5" fill={color} />
            <text
              x={p.x}
              y={height - 2}
              fill="var(--fg-tertiary)"
              fontSize="5"
              textAnchor="middle"
              fontFamily="inherit"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface BarPair {
  label: string;
  left: number;
  right: number;
}

export function ImbalanceChart({ data, height = 120 }: { data: BarPair[]; height?: number }) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg-tertiary)",
          fontSize: "0.875rem",
        }}
      >
        No imbalance data — log unilateral exercises with left/right sides
      </div>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.left, d.right])) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {data.map((d) => {
        const leftPct = (d.left / max) * 100;
        const rightPct = (d.right / max) * 100;
        const imbalance = Math.abs(d.left - d.right) / Math.max(d.left, d.right) * 100;
        const side = d.left >= d.right ? "Left stronger" : "Right stronger";

        return (
          <div key={d.label} style={{ animation: "fadeInUp 0.3s var(--ease-out)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{d.label}</span>
              <span style={{
                fontSize: "0.75rem",
                color: imbalance > 10 ? "var(--warning)" : "var(--fg-tertiary)",
                fontWeight: 600,
              }}>
                {imbalance.toFixed(0)}% imbalance — {side}
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)", height: 28 }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    width: `${leftPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, var(--accent-deep))",
                    borderRadius: "6px 0 0 6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#fff",
                    transition: "width 0.5s var(--ease-out)",
                  }}
                >
                  {d.left}
                </div>
              </div>
              <div style={{ width: 2, background: "var(--border-strong)" }} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: `${rightPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--accent), var(--accent-bright))",
                    borderRadius: "0 6px 6px 0",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#fff",
                    transition: "width 0.5s var(--ease-out)",
                  }}
                >
                  {d.right}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
