import { useEffect } from "react";
import { Trophy } from "lucide-react";
import { playLevelUp } from "../soundEffects";

export default function LevelUpCard({ level, accent = "var(--accent)", onDismiss }) {
  useEffect(() => {
    playLevelUp();
    const id = setTimeout(() => onDismiss?.(), 3500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-live="polite"
      style={{
        ...(accent.startsWith("var(") ? {} : { "--accent": accent }),
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translate(-50%, 0)",
        width: "min(560px, calc(100vw - 32px))",
        zIndex: 10002,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        background: "var(--bg-2)",
        border: "1px solid var(--line-strong)",
        borderLeft: "3px solid var(--accent-ink)",
        borderRadius: "var(--r-md)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        color: "var(--text)",
        textAlign: "left",
        cursor: "pointer",
        animation: "levelSlideIn var(--dur-slow) var(--ease) both",
      }}
    >
      <span style={{ display: "inline-flex", padding: 10, borderRadius: "var(--r-sm)", background: "color-mix(in srgb, var(--accent) 16%, transparent)" }}>
        <Trophy size={22} color="currentColor" strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--accent-ink)" }} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span className="label">Level up</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Level {level.index + 1}: {level.name}
        </span>
      </span>
    </button>
  );
}
