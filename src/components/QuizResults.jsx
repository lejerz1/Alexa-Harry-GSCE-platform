import { useEffect, useRef } from "react";
import { Check, Minus, X, RotateCcw, ArrowLeft } from "lucide-react";
import useCountUp from "./useCountUp";

export const ASSESSMENT = {
  full: { label: "Got it", Icon: Check, color: "var(--ok)" },
  partial: { label: "Partially", Icon: Minus, color: "var(--warn)" },
  missed: { label: "Missed it", Icon: X, color: "var(--bad)" },
};

const scoreColor = (pct) => (pct >= 70 ? "var(--ok)" : pct >= 40 ? "var(--warn)" : "var(--bad)");

export default function QuizResults({ questions, assessments, answers, earned, totalMarks, pct, grade, onRetake, onBack, onGradeMounted }) {
  const gradeRef = useRef(null);
  const shownPct = useCountUp(pct, 600);
  const passed = pct >= 60;

  useEffect(() => {
    onGradeMounted?.(gradeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ animation: "fadeSlideUp var(--dur-slow) var(--ease) both" }}>
      <div
        className="card"
        style={{ textAlign: "center", padding: "36px 24px", marginBottom: 24, borderColor: `color-mix(in srgb, ${scoreColor(pct)} 30%, transparent)` }}
      >
        <div className="label" style={{ marginBottom: 10 }}>Grade</div>
        <div
          ref={gradeRef}
          className="a-pop"
          style={{ fontFamily: "var(--font-display)", fontSize: 72, lineHeight: 1, fontWeight: 800, color: scoreColor(pct), letterSpacing: "-0.04em", marginBottom: 14 }}
        >
          {grade}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
          {shownPct}%
        </div>
        <div className="small" style={{ color: "var(--text-2)", fontVariantNumeric: "tabular-nums", marginBottom: 16 }}>
          {earned} of {totalMarks} marks
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: passed ? "var(--ok)" : "var(--warn)" }}>
          {passed ? "Passed. Topic marked as mastered." : "Not quite yet. Have another go."}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 className="h3" style={{ marginBottom: 12 }}>Question breakdown</h3>
        {questions.map((q, i) => {
          const a = assessments[i];
          const meta = ASSESSMENT[a] || ASSESSMENT.missed;
          const qEarned = a === "full" ? q.marks : a === "partial" ? Math.round(q.marks / 2) : 0;
          return (
            <div key={i} className="card" style={{ borderRadius: "var(--r-md)", padding: 18, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span className="label" style={{ color: "var(--accent)" }}>Q{i + 1} · {q.marks} marks</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: meta.color, fontVariantNumeric: "tabular-nums" }}>
                  <meta.Icon size={15} aria-hidden="true" /> {meta.label}, {qEarned}/{q.marks}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-2)", margin: "0 0 12px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{q.question}</p>
              <div className="label" style={{ marginBottom: 4 }}>Your answer</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: "0 0 12px", lineHeight: 1.55, fontStyle: "italic", whiteSpace: "pre-wrap" }}>{answers[i] || "(no answer)"}</p>
              <div className="label" style={{ color: "var(--ok)", marginBottom: 4 }}>Model answer</div>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{q.model_answer}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={onRetake}>
          <RotateCcw size={16} aria-hidden="true" /> Take another quiz
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to topics
        </button>
      </div>
    </div>
  );
}
