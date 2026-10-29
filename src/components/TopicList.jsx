import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { getSubjectSections } from "../userConfig";

function TopicRow({ topic, complete, score, excluded, onSelect, delay }) {
  return (
    <button
      type="button"
      className="topic-row"
      onClick={() => onSelect(topic)}
      style={{
        opacity: excluded ? 0.55 : 1,
        color: excluded ? "var(--text-3)" : "var(--text)",
        animation: "fadeSlideUp var(--dur-slow) var(--ease) both",
        animationDelay: `${delay}ms`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          flexShrink: 0,
          borderRadius: "50%",
          background: complete && !excluded ? "var(--ok)" : "transparent",
          border: `1.5px solid ${complete && !excluded ? "var(--ok)" : "var(--line-strong)"}`,
        }}
      />
      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500 }}>
        {topic}
        {complete && <span className="visually-hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}> (mastered)</span>}
      </span>
      {score && (
        <span
          className="chip"
          style={{
            color: excluded ? "var(--text-3)" : score.bestPct >= 70 ? "var(--ok)" : score.bestPct >= 40 ? "var(--warn)" : "var(--bad)",
            flexShrink: 0,
          }}
        >
          Best {score.bestPct}%
        </span>
      )}
      <ChevronRight size={18} color="var(--text-3)" aria-hidden="true" style={{ flexShrink: 0 }} />
    </button>
  );
}

// Renders topics through getSubjectSections, with excluded topics collapsed into a dimmed group.
export default function TopicList({ source, isExcluded, isComplete, getScore, onSelect }) {
  const [showExcluded, setShowExcluded] = useState(false);
  const sections = getSubjectSections(source);
  const excluded = sections.flatMap((s) => s.topics.filter((t) => isExcluded(t)));
  let rowIndex = 0;

  return (
    <div>
      {sections.map((section, si) => {
        const topics = section.topics.filter((t) => !isExcluded(t));
        if (topics.length === 0) return null;
        return (
          <section key={si} style={{ marginBottom: 22 }}>
            {section.title && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", margin: "0 0 10px" }}>
                <h3 className="label" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.06em" }}>
                  {section.title.replace(/\s*\(your school chooses [^)]*\)/i, "")}
                </h3>
                {section.choice && (
                  <span className="small" style={{ color: "var(--text-3)" }}>Your school picks {section.choice.replace(" of ", " of these ")}</span>
                )}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topics.map((topic) => (
                <TopicRow
                  key={topic}
                  topic={topic}
                  complete={isComplete(topic)}
                  score={getScore(topic)}
                  onSelect={onSelect}
                  delay={Math.min(rowIndex++, 12) * 40}
                />
              ))}
            </div>
          </section>
        );
      })}

      {excluded.length > 0 && (
        <section style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <h3 className="label" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.06em" }}>
              Not in my exam ({excluded.length})
            </h3>
            <button type="button" className="link-btn" aria-expanded={showExcluded} onClick={() => setShowExcluded((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {showExcluded ? "Hide" : "Show"}
              <ChevronDown size={14} aria-hidden="true" style={{ transform: showExcluded ? "rotate(180deg)" : "none", transition: "transform var(--dur) var(--ease)" }} />
            </button>
          </div>
          {showExcluded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {excluded.map((topic) => (
                <TopicRow key={topic} topic={topic} complete={isComplete(topic)} score={getScore(topic)} excluded onSelect={onSelect} delay={0} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
