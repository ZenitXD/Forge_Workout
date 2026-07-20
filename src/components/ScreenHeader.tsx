import type { ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ title, subtitle, right, onBack }: ScreenHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-5) var(--space-5) var(--space-3)",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "var(--fg-secondary)",
              transition: "all 0.2s var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--fg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-surface)";
              e.currentTarget.style.color = "var(--fg-secondary)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: "var(--fg-tertiary)", fontSize: "0.875rem", marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </header>
  );
}
