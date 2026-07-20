import type { ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  style?: CSSProperties;
  padding?: CSSProperties["padding"];
}

export function Card({ children, onClick, selected, style, padding }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "rgba(249, 115, 22, 0.08)" : "var(--bg-surface)",
        border: selected
          ? "1.5px solid var(--accent)"
          : "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: padding ?? "var(--space-5)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s var(--ease-out)",
        ...(onClick && {
          animation: "scaleIn 0.4s var(--ease-out) backwards",
        }),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = selected
            ? "var(--accent)"
            : "var(--border-strong)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = selected
          ? "var(--accent)"
          : "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </div>
  );
}
