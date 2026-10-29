import { ArrowRight } from "lucide-react";
import { getExamSubjectsForUser } from "../userConfig";
import CountdownRing from "./CountdownRing";
import { countMastered } from "./topicInclusion";
import { formatShortDate } from "./motion";

const WINDOW_DAYS = 21;

export default function ThisWeekCard({ userName, completedTopics, onContinue }) {
  const exams = getExamSubjectsForUser(userName);
  if (exams.length === 0 || exams[0].daysToGo > WINDOW_DAYS) return null;
  const upcoming = exams.filter((e) => e.daysToGo <= WINDOW_DAYS);

  // Group rows by date; a shared date is shown once above its group.
  const groups = [];
  for (const exam of upcoming) {
    const label = formatShortDate(exam.date);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(exam);
    else groups.push({ label, items: [exam] });
  }

  return (
    <section
      className="card"
      aria-labelledby="this-week-heading"
      style={{ padding: "20px 20px 8px", marginBottom: 28, animation: "fadeSlideUp var(--dur-slow) var(--ease) both" }}
    >
      <h2 id="this-week-heading" className="h3" style={{ marginBottom: 4 }}>This week</h2>
      <p className="small" style={{ color: "var(--text-3)", margin: "0 0 12px" }}>
        Your exams, nearest first. Pick up where you left off.
      </p>
      {groups.map((group) => {
        const shared = group.items.length > 1;
        return (
          <div key={group.label}>
            {shared && <div className="label" style={{ padding: "10px 0 2px" }}>{group.label}</div>}
            {group.items.map(({ key, subject, date, daysToGo }) => {
              const { done, total } = countMastered(userName, key, subject, completedTopics);
              return (
                <div
                  key={key}
                  style={{
                    "--accent": subject.color,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 0",
                    borderTop: "1px solid var(--line)",
                    flexWrap: "wrap",
                  }}
                >
                  <CountdownRing days={daysToGo} />
                  <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{subject.name}</span>
                      {subject.spec?.code && (
                        <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                          {subject.spec.code}
                        </span>
                      )}
                    </div>
                    <div className="small" style={{ color: "var(--text-2)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                      {!shared && <>{formatShortDate(date)} · </>}
                      {daysToGo === 0 ? "Exam today · " : ""}
                      {done} of {total} topics mastered
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => onContinue(key)}>
                    Continue <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
