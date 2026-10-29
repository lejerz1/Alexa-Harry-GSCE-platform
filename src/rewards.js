import posthog from "posthog-js";

export const LEVELS = [
  { floor: 0,    name: "Warming up" },
  { floor: 100,  name: "Finding form" },
  { floor: 250,  name: "Focused" },
  { floor: 500,  name: "On a roll" },
  { floor: 900,  name: "Sharp" },
  { floor: 1400, name: "Examiner's nightmare" },
  { floor: 2000, name: "Grade 9 energy" },
  { floor: 2800, name: "Untouchable" },
];

const HISTORY_CAP = 200;
const xpKey = (userName) => `${userName}:xp`;

export function readXp(userName) {
  try {
    const parsed = JSON.parse(localStorage.getItem(xpKey(userName)) || "null");
    if (parsed && typeof parsed.total === "number" && Array.isArray(parsed.history)) return parsed;
  } catch {}
  return { total: 0, history: [] };
}

// { index, name, floor, ceiling } where ceiling is the next level's floor (null at the top level).
export function getLevel(total) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (total >= LEVELS[i].floor) index = i;
  const next = LEVELS[index + 1];
  return { index, name: LEVELS[index].name, floor: LEVELS[index].floor, ceiling: next ? next.floor : null };
}

export function awardXp(userName, reason, amount) {
  const ledger = readXp(userName);
  const levelBefore = getLevel(ledger.total).index;
  ledger.total += amount;
  ledger.history.push({ ts: Date.now(), reason, amount });
  if (ledger.history.length > HISTORY_CAP) ledger.history = ledger.history.slice(-HISTORY_CAP);
  try { localStorage.setItem(xpKey(userName), JSON.stringify(ledger)); } catch {}
  const levelAfter = getLevel(ledger.total).index;

  try {
    posthog.capture("xp_gained", { user: userName, reason, amount, total: ledger.total });
    if (levelAfter > levelBefore) posthog.capture("level_up", { user: userName, level: levelAfter + 1 });
  } catch {}

  return { total: ledger.total, levelBefore, levelAfter };
}

// ── Daily goal: 3 quiz completions per day ─────────────────────
export const DAILY_GOAL = 3;
const dailyKey = (userName, dateKey) => `${userName}:daily:${dateKey}`;

export function readDaily(userName, dateKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(dailyKey(userName, dateKey)) || "null");
    if (parsed && typeof parsed.quizzes === "number") return parsed;
  } catch {}
  return { quizzes: 0, goalReached: false };
}

// Records a quiz completion. Returns { quizzes, justReachedGoal }.
export function recordDailyQuiz(userName, dateKey) {
  const d = readDaily(userName, dateKey);
  d.quizzes += 1;
  let justReachedGoal = false;
  if (!d.goalReached && d.quizzes >= DAILY_GOAL) {
    d.goalReached = true;
    justReachedGoal = true;
  }
  try { localStorage.setItem(dailyKey(userName, dateKey), JSON.stringify(d)); } catch {}
  return { quizzes: d.quizzes, justReachedGoal };
}
