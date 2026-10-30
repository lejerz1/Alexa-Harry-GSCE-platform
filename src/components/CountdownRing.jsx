// SVG progress ring. Pass `days` for an exam countdown (progress = 1 - days / 21),
// or `value` (0 to 1) for a plain progress ring. `children` overrides the centre.
export default function CountdownRing({ days, value, size = 56, stroke = 5, color = "var(--accent-ink)", children, label }) {
  const isCountdown = typeof days === "number";
  const raw = isCountdown ? 1 - days / 21 : value ?? 0;
  const progress = Math.max(0, Math.min(1, raw));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div
      role="img"
      aria-label={label || (isCountdown ? `${days} ${days === 1 ? "day" : "days"} to go` : `${Math.round(progress * 100)}% complete`)}
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c}px`}
          strokeDashoffset={`${offset}px`}
          style={{ "--ring-c": `${c}px`, animation: "ringFill 900ms var(--ease) both", transition: "stroke-dashoffset var(--dur-slow) var(--ease)" }}
        />
      </svg>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        {children ??
          (isCountdown ? (
            <>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.34, fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>
                {days}
              </span>
              <span className="label" style={{ fontSize: 9, marginTop: 2, letterSpacing: "0.08em" }}>
                {days === 1 ? "day" : "days"}
              </span>
            </>
          ) : null)}
      </div>
    </div>
  );
}
