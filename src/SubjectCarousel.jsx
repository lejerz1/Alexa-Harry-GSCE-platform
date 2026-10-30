import { LUCIDE_ICONS } from "./components/SubjectIcon";

export default function SubjectCarousel({ subjects, speed = 30 }) {
  // Build flat list of { name, icon } from subjects config
  const items = Object.values(subjects).map((s) => ({ name: s.name, icon: s.icon, color: s.color }));

  // Duplicate enough times so the track is wide enough to loop smoothly (min 12 items)
  let track = [...items];
  while (track.length < 12) track = [...track, ...items];
  // Double for seamless infinite loop
  const doubled = [...track, ...track];

  const animName = `carouselScroll${items.length}`;
  const keyframes = `@keyframes ${animName} { from { transform: translateX(0); } to { transform: translateX(-50%); } }`;

  return (
    <div
      className="subject-carousel-wrap"
      style={{
        width: "100%",
        maxWidth: 700,
        margin: "0 auto",
        overflow: "hidden",
        position: "relative",
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <style>{keyframes}{`
        .subject-carousel-wrap:hover .subject-carousel-track {
          animation-duration: ${speed * 1.6}s !important;
        }
      `}</style>
      <div
        className="subject-carousel-track"
        style={{
          display: "flex",
          gap: 12,
          width: "max-content",
          willChange: "transform",
          animation: `${animName} ${speed}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => {
          const LucideIcon = LUCIDE_ICONS[item.icon];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-pill)",
                padding: "8px 16px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {LucideIcon ? (
                <LucideIcon size={14} color="currentColor" strokeWidth={1.75} aria-hidden="true" style={item.color ? { "--accent": item.color, color: "var(--accent-ink)" } : { color: "var(--accent-ink)" }} />
              ) : (
                <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
              )}
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                }}
              >
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
