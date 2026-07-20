import { useState } from "react";
import { Icon } from "./Icon";

interface ExerciseImageProps {
  url: string;
  name: string;
  size?: number;
  radius?: number;
}

export function ExerciseImage({ url, name, size = 52, radius = 12 }: ExerciseImageProps) {
  const [errored, setErrored] = useState(false);

  if (!url || errored) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface-2))",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--accent-bright)",
        }}
      >
        <Icon name="dumbbell" size={size * 0.46} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        flexShrink: 0,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setErrored(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
