import SubjectIcon from "./SubjectIcon";
import CountdownRing from "./CountdownRing";

export default function SubjectCard({ subject, onClick, delay, done, total }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card interactive-card"
      style={{
        "--accent": subject.color,
        width: "100%",
        height: "100%",
        textAlign: "left",
        padding: "22px 20px",
        cursor: "pointer",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "fadeSlideUp var(--dur-slow) var(--ease) both",
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
        <span
          style={{
            display: "inline-flex",
            padding: 10,
            borderRadius: "var(--r-sm)",
            background: "color-mix(in srgb, var(--accent) 14%, transparent)",
          }}
        >
          <SubjectIcon icon={subject.icon} size={26} color={subject.color} />
        </span>
        <CountdownRing value={total > 0 ? done / total : 0} size={36} stroke={4} label={`${done} of ${total} topics mastered`} />
      </div>
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {subject.name}
          </span>
          {subject.spec?.code && (
            <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)", padding: "2px 8px" }}>
              {subject.spec.code}
            </span>
          )}
        </div>
        <div className="small" style={{ color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          {done}/{total} mastered · {subject.board}
        </div>
      </div>
    </button>
  );
}
