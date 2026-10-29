import { USER_PROFILES } from "../userConfig";

const storageKey = (userName, subjectKey) => `${userName}:exam-topics:${subjectKey}`;

// The topic picker is only offered for subjects with an exam date for this user.
export function hasExamPicker(userName, subjectKey) {
  return !!USER_PROFILES[userName]?.examDates?.[subjectKey];
}

// Stored array of included topic names, or null (absent key = everything included).
export function readExamTopics(userName, subjectKey) {
  try {
    const raw = localStorage.getItem(storageKey(userName, subjectKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeExamTopics(userName, subjectKey, included, allTopics) {
  try {
    if (!included || (allTopics && included.length === allTopics.length && allTopics.every((t) => included.includes(t)))) {
      localStorage.removeItem(storageKey(userName, subjectKey));
    } else {
      localStorage.setItem(storageKey(userName, subjectKey), JSON.stringify(included));
    }
  } catch {}
}

// Every topic a subject has, as [{ topic, branchKey, progressKey }] using the existing progress key format.
export function getAllTopics(subjectKey, subject) {
  if (!subject) return [];
  if (subject.isCombined && subject.branches) {
    return Object.entries(subject.branches).flatMap(([branchKey, b]) =>
      b.topics.map((topic) => ({ topic, branchKey, progressKey: `${subjectKey}:${branchKey}:${topic}` }))
    );
  }
  return (subject.topics || []).map((topic) => ({ topic, branchKey: null, progressKey: `${subjectKey}:${topic}` }));
}

// The single source of truth for "which topics count": used by progress rings, ThisWeekCard,
// completion counts, landing milestones and background prefetch.
export function getIncludedTopics(userName, subjectKey, subject) {
  const all = getAllTopics(subjectKey, subject);
  if (!hasExamPicker(userName, subjectKey)) return all;
  const stored = readExamTopics(userName, subjectKey);
  if (!stored) return all;
  const set = new Set(stored);
  return all.filter((t) => set.has(t.topic));
}

export function countMastered(userName, subjectKey, subject, completedTopics) {
  const included = getIncludedTopics(userName, subjectKey, subject);
  return {
    done: included.filter((t) => completedTopics?.[t.progressKey]).length,
    total: included.length,
  };
}
