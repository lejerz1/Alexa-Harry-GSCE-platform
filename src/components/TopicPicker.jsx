import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import posthog from "posthog-js";
import { getSubjectSections } from "../userConfig";
import { readExamTopics, writeExamTopics } from "./topicInclusion";

// Inline panel (no modal). Height animates over --dur-slow and pushes the list below it down.
export default function TopicPicker({ userName, subjectKey, subject, open, onDone }) {
  const allTopics = subject.topics || [];
  const [draft, setDraft] = useState(() => new Set(readExamTopics(userName, subjectKey) || allTopics));
  const innerRef = useRef(null);
  const [height, setHeight] = useState(0);

  // Re-read storage each time the panel opens
  useEffect(() => {
    if (open) setDraft(new Set(readExamTopics(userName, subjectKey) || allTopics));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userName, subjectKey]);

  useLayoutEffect(() => {
    if (!innerRef.current) return;
    setHeight(open ? innerRef.current.scrollHeight : 0);
  }, [open, draft]);

  const toggle = (topic) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });

  const done = () => {
    const included = allTopics.filter((t) => draft.has(t));
    writeExamTopics(userName, subjectKey, included, allTopics);
    posthog.capture("exam_topics_updated", { user: userName, subject: subjectKey, included: included.length, total: allTopics.length });
    onDone?.(included);
  };

  const resetToFullSpec = () => {
    writeExamTopics(userName, subjectKey, null);
    setDraft(new Set(allTopics));
  };

  return (
    <div
      id={`topic-picker-${subjectKey}`}
      aria-hidden={!open}
      style={{ height, overflow: "hidden", transition: "height var(--dur-slow) var(--ease)" }}
    >
      <div ref={innerRef} style={{ paddingBottom: 20 }} inert={!open}>
        <div className="card-raised" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <h3 className="h3">Set up my exam</h3>
            <span className="small" style={{ color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
              {draft.size} of {allTopics.length} topics included
            </span>
          </div>
          <p className="small" style={{ color: "var(--text-2)", margin: "0 0 14px" }}>
            Untick anything your school isn't entering you for. Progress and predictions will only count what's left.
          </p>
          <div style={{ display: "flex", gap: 18, marginBottom: 8, flexWrap: "wrap" }}>
            <button type="button" className="link-btn" onClick={() => setDraft(new Set(allTopics))}>Select all</button>
            <button type="button" className="link-btn" onClick={resetToFullSpec}>Reset to full spec</button>
          </div>

          {getSubjectSections(subject).map((section, si) => (
            <fieldset key={si} style={{ border: "none", padding: 0, margin: "14px 0 0" }}>
              {section.title && (
                <legend className="label" style={{ padding: 0, marginBottom: 6 }}>
                  {section.title}
                </legend>
              )}
              {section.topics.map((topic) => {
                const checked = draft.has(topic);
                return (
                  <label
                    key={topic}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 4px",
                      cursor: "pointer",
                      borderRadius: "var(--r-sm)",
                      color: checked ? "var(--text)" : "var(--text-3)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(topic)}
                      style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
                      className="picker-check"
                    />
                    <span
                      aria-hidden="true"
                      className="picker-box"
                      style={{
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        borderRadius: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1.5px solid ${checked ? "var(--accent)" : "var(--line-strong)"}`,
                        background: checked ? "var(--accent)" : "transparent",
                        transition: "background-color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)",
                      }}
                    >
                      {checked && <Check size={14} color="#0B0B10" strokeWidth={3} />}
                    </span>
                    <span style={{ fontSize: 14 }}>{topic}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={done} disabled={draft.size === 0}>
              Done
            </button>
            {draft.size === 0 && <span className="small" style={{ color: "var(--warn)" }}>Pick at least one topic.</span>}
          </div>
        </div>
      </div>
      <style>{`.picker-check:focus-visible + .picker-box { box-shadow: var(--ring); }`}</style>
    </div>
  );
}
