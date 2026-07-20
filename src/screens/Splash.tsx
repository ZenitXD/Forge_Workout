import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

interface SplashProps {
  onStart: () => void;
}

export function Splash({ onStart }: SplashProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
          animation: "emberPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-40%",
          right: "-20%",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(194, 65, 12, 0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-3)",
          animation: "scaleIn 1s var(--ease-spring)",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 22,
            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px var(--accent-glow)",
            marginBottom: "var(--space-4)",
          }}
        >
          <Icon name="flame" size={44} color="#fff" strokeWidth={2} />
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "0.2em",
            lineHeight: 1,
            background: "linear-gradient(180deg, #fff, var(--fg-secondary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          FORGE
        </h1>
      </div>

      <p
        style={{
          marginTop: "var(--space-5)",
          fontSize: "1.0625rem",
          color: "var(--fg-secondary)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 320,
          animation: "fadeIn 1s var(--ease-out) 0.4s backwards",
          zIndex: 1,
        }}
      >
        Build your body.
        <br />
        One workout at a time.
      </p>

      <div
        style={{
          marginTop: "var(--space-7)",
          animation: "fadeInUp 0.8s var(--ease-out) 0.8s backwards",
          zIndex: 1,
        }}
      >
        <Button size="lg" onClick={onStart} style={{ letterSpacing: "0.1em", padding: "18px 56px" }}>
          START
        </Button>
      </div>

      <p
        style={{
          position: "absolute",
          bottom: "var(--space-6)",
          fontSize: "0.75rem",
          color: "var(--fg-tertiary)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          animation: "fadeIn 1s var(--ease-out) 1.2s backwards",
        }}
      >
        Offline · No ads · No subscription
      </p>
    </div>
  );
}
