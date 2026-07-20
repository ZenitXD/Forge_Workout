import type { ReactNode, CSSProperties } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const dimensions = {
    sm: { padding: "10px 16px", fontSize: "0.875rem", borderRadius: "10px" },
    md: { padding: "14px 24px", fontSize: "1rem", borderRadius: "12px" },
    lg: { padding: "18px 32px", fontSize: "1.125rem", borderRadius: "14px" },
  }[size];

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, var(--accent), var(--accent-deep))`,
      color: "#fff",
      fontWeight: 600,
      boxShadow: "0 4px 20px var(--accent-glow)",
    },
    secondary: {
      background: "var(--bg-elevated)",
      color: "var(--fg-primary)",
      border: "1px solid var(--border-strong)",
      fontWeight: 500,
    },
    ghost: {
      background: "transparent",
      color: "var(--fg-secondary)",
      fontWeight: 500,
    },
    danger: {
      background: "rgba(239, 68, 68, 0.12)",
      color: "var(--error)",
      fontWeight: 500,
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...dimensions,
        ...variants[variant],
        width: fullWidth ? "100%" : "auto",
        transition: "all 0.2s var(--ease-out)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant === "primary")
          e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}
