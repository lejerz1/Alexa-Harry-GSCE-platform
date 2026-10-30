import { useImperativeHandle, useState, useCallback } from "react";
import { prefersReducedMotion } from "./motion";

// A single host for "+N XP" pills. Call ref.current.show(amount, originEl).
export default function RewardToastHost({ ref, accent = "var(--accent)" }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((amount, originEl) => {
    let x = window.innerWidth / 2;
    let y = 96;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top;
    }
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      // Stack toasts that start from the same spot so they don't overlap
      const stacked = prev.filter((t) => Math.abs(t.x - x) < 40 && Math.abs(t.baseY - y) < 40).length;
      return [...prev, { id, amount, x, y: y - stacked * 30, baseY: y }];
    });
  }, []);

  useImperativeHandle(ref, () => ({ show }), [show]);

  const reduced = prefersReducedMotion();
  return (
    <div aria-live="polite" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10001 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onAnimationEnd={() => setToasts((prev) => prev.filter((p) => p.id !== t.id))}
          style={{
            // Raw colours are set as --accent so the text can use --accent-ink (darker in light mode).
            ...(accent.startsWith("var(") ? {} : { "--accent": accent }),
            position: "fixed",
            left: Math.max(48, Math.min(window.innerWidth - 48, t.x)),
            top: Math.max(8, t.y - 36),
            transform: "translate(-50%, 0)",
            padding: "5px 12px",
            borderRadius: "var(--r-pill)",
            background: `color-mix(in srgb, ${accent} 18%, var(--bg-2))`,
            border: `1px solid color-mix(in srgb, ${accent} 50%, transparent)`,
            color: "var(--accent-ink)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            // Held for legibility: 3x --dur-slow; reduced motion fades in place over a fixed 1.2s.
            animation: reduced ? "toastRise 1200ms linear both" : "toastRise calc(var(--dur-slow) * 3) var(--ease) both",
          }}
        >
          +{t.amount} XP
        </div>
      ))}
    </div>
  );
}
