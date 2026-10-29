import { Flame } from "lucide-react";
import CountdownRing from "./CountdownRing";
import useCountUp from "./useCountUp";
import { getLevel, DAILY_GOAL } from "../rewards";

export default function StatRow({ xpTotal, streakCount, dailyQuizzes, accent }) {
  const level = getLevel(xpTotal);
  const span = level.ceiling ? level.ceiling - level.floor : 1;
  const pct = level.ceiling ? Math.min(1, (xpTotal - level.floor) / span) : 1;
  const streakShown = useCountUp(streakCount, 600);
  const dailyDone = Math.min(dailyQuizzes, DAILY_GOAL);

  return (
    <div
      className="stat-row-wrap"
      style={{
        "--accent": accent,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        alignItems: "center",
        gap: 20,
        paddingBottom: 18,
        marginBottom: 18,
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
            Level {level.index + 1}, {level.name}
          </span>
          <span className="small" style={{ color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
            {level.ceiling ? `${xpTotal} / ${level.ceiling} XP` : `${xpTotal} XP`}
          </span>
        </div>
        <div style={{ height: 6, background: "var(--line)", borderRadius: "var(--r-pill)", overflow: "hidden" }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label="XP towards next level">
          <div style={{ width: `${pct * 100}%`, height: "100%", background: "var(--accent)", borderRadius: "var(--r-pill)", transition: "width var(--dur-slow) var(--ease)" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }} title="Day streak">
        <span className={streakCount >= 2 ? "a-flame" : undefined} style={{ display: "inline-flex" }}>
          <Flame size={22} color={streakCount >= 1 ? "var(--warn)" : "var(--text-3)"} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, fontVariantNumeric: "tabular-nums" }}>
          {streakShown}
        </span>
        <span className="label" style={{ fontSize: 10 }}>day{streakCount === 1 ? "" : "s"}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }} title="Daily goal: 3 quizzes">
        <CountdownRing value={dailyDone / DAILY_GOAL} size={44} stroke={4} color="var(--ok)" label={`${dailyDone} of ${DAILY_GOAL} quizzes today`}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
            {dailyDone}/{DAILY_GOAL}
          </span>
        </CountdownRing>
        <span className="label" style={{ fontSize: 10, lineHeight: 1.2 }}>Daily<br />goal</span>
      </div>
      <style>{`@media (max-width: 479px) { .stat-row-wrap { grid-template-columns: 1fr 1fr !important; row-gap: 14px !important; } .stat-row-wrap > :first-child { grid-column: 1 / -1; } }`}</style>
    </div>
  );
}
