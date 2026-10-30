import { Eye, EyeOff, Sparkles } from "lucide-react";

const FREQ_COLOR = { "Very High": "var(--ok)", High: "var(--warn)" };

export function AnswerBlocks({ modelAnswer, examinerTip, compact = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeSlideUp var(--dur) var(--ease) both" }}>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: compact ? 16 : 18 }}>
        <div className="label" style={{ color: "var(--ok)", marginBottom: 8 }}>Model answer</div>
        <p style={{ fontSize: compact ? 13 : 14, lineHeight: 1.7, color: "var(--text)", margin: 0, whiteSpace: "pre-wrap" }}>{modelAnswer}</p>
      </div>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: compact ? 14 : 16 }}>
        <div className="label" style={{ color: "var(--warn)", marginBottom: 8 }}>Examiner tip</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-2)", margin: 0 }}>{examinerTip}</p>
      </div>
    </div>
  );
}

export function QuestionMeta({ index, label, marks, commandWord, frequency }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="label" style={{ color: "var(--accent-ink)" }}>{label ?? `Q${index + 1}`}</span>
        {commandWord && <span className="chip label" style={{ color: "var(--text-2)", padding: "3px 9px" }}>{commandWord}</span>}
        {frequency && (
          <span className="small" style={{ color: FREQ_COLOR[frequency] || "var(--text-3)", fontSize: 12 }}>
            {frequency} frequency
          </span>
        )}
      </div>
      <span
        className="chip"
        style={{ color: "var(--text)", background: "var(--bg-2)", borderColor: "var(--line-strong)", fontVariantNumeric: "tabular-nums" }}
      >
        {marks} {marks === 1 ? "mark" : "marks"}
      </span>
    </div>
  );
}

export default function QuestionCard({ q, index, revealed, onReveal, color, practiceQuestions, onRequestPractice, onTogglePractice, practiceLoading }) {
  return (
    <article
      className="card"
      style={{
        "--accent": color,
        borderLeft: "3px solid var(--accent-ink)",
        padding: "22px 22px 22px 20px",
        marginBottom: 14,
        animation: "fadeSlideUp var(--dur-slow) var(--ease) both",
        animationDelay: `${index * 60}ms`,
      }}
    >
      <QuestionMeta index={index} marks={q.marks} commandWord={q.command_word} frequency={q.frequency} />

      <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--text)", margin: "0 0 18px", fontWeight: 500, whiteSpace: "pre-wrap" }}>
        {q.question}
      </p>

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-expanded={!!revealed}
        onClick={(e) => onReveal(e.currentTarget)}
        style={{ marginBottom: revealed ? 14 : 0 }}
      >
        {revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        {revealed ? "Hide answer" : "Reveal model answer"}
      </button>

      {revealed && (
        <div>
          <AnswerBlocks modelAnswer={q.model_answer} examinerTip={q.examiner_tip} />

          {onRequestPractice && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={(e) => onRequestPractice(index, e.currentTarget)}
              disabled={practiceLoading}
              style={{ marginTop: 14, color: "var(--accent-ink)" }}
            >
              <Sparkles size={15} aria-hidden="true" />
              {practiceLoading ? "Generating…" : "Try a similar question"}
            </button>
          )}

          {practiceQuestions && practiceQuestions.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {practiceQuestions.map((pq, pi) => (
                <div
                  key={pi}
                  className="card-raised"
                  style={{ padding: 18, marginBottom: 10, borderRadius: "var(--r-md)", animation: "fadeSlideUp var(--dur) var(--ease) both" }}
                >
                  <QuestionMeta label={`Practice ${pi + 1}`} marks={pq.question.marks} commandWord={pq.question.command_word} />
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text)", margin: "0 0 14px", fontWeight: 500, whiteSpace: "pre-wrap" }}>
                    {pq.question.question}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-expanded={!!pq.revealed}
                    onClick={() => onTogglePractice(index, pi)}
                    style={{ marginBottom: pq.revealed ? 12 : 0 }}
                  >
                    {pq.revealed ? "Hide answer" : "Reveal model answer"}
                  </button>
                  {pq.revealed && <AnswerBlocks modelAnswer={pq.question.model_answer} examinerTip={pq.question.examiner_tip} compact />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
