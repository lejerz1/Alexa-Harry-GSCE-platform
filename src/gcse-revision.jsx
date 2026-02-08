import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { USER_PROFILES, getSubjectsForUser, getTotalTopicsCount } from "./userConfig";
import { EFFECTS, animateParticles } from "./avatarEffects";

function LoadingDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span style={{ fontFamily: "monospace", minWidth: 24, display: "inline-block" }}>{dots}</span>;
}

function SubjectCard({ subjectKey, subject, onClick, delay, topicCount }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${subject.color}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? subject.color + "60" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        padding: "28px 24px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 40px ${subject.color}20` : "none",
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{subject.icon}</div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "#F0EDE6",
          marginBottom: 6,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        {subject.name}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(240,237,230,0.4)",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.02em",
        }}
      >
        {topicCount} topics · {subject.board}
      </div>
    </div>
  );
}

function QuestionCard({ q, index, revealed, onReveal, color, practiceQuestions, onRequestPractice, onTogglePractice, practiceLoading }) {
  const freqColor =
    q.frequency === "Very High"
      ? "#2ECC71"
      : q.frequency === "High"
      ? "#F39C12"
      : "#E74C3C";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 28,
        marginBottom: 16,
        animation: `fadeSlideUp 0.4s ease both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              background: color + "20",
              color: color,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Q{index + 1}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(240,237,230,0.6)",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            [{q.marks} marks]
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(240,237,230,0.5)",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {q.command_word}
          </span>
        </div>
        <span
          style={{
            background: freqColor + "18",
            color: freqColor,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: "nowrap",
          }}
        >
          ● {q.frequency} frequency
        </span>
      </div>

      <p
        style={{
          fontSize: 16,
          lineHeight: 1.65,
          color: "#F0EDE6",
          fontFamily: "'DM Sans', sans-serif",
          margin: 0,
          marginBottom: 20,
          fontWeight: 500,
        }}
      >
        {q.question}
      </p>

      <button
        onClick={onReveal}
        style={{
          background: color + "15",
          color: color,
          border: `1px solid ${color}30`,
          borderRadius: 10,
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s ease",
          marginBottom: revealed ? 16 : 0,
        }}
        onMouseEnter={(e) => {
          e.target.style.background = color + "25";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = color + "15";
        }}
      >
        {revealed ? "Hide Answer" : "Reveal Model Answer"}
      </button>
      {revealed && (
        <div
          style={{
            animation: "fadeSlideUp 0.3s ease both",
          }}
        >
          <div
            style={{
              background: "rgba(46, 204, 113, 0.06)",
              border: "1px solid rgba(46, 204, 113, 0.15)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#2ECC71",
                marginBottom: 10,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              Model Answer
            </div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(240,237,230,0.85)",
                fontFamily: "'DM Sans', sans-serif",
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {q.model_answer}
            </p>
          </div>
          <div
            style={{
              background: "rgba(243, 156, 18, 0.06)",
              border: "1px solid rgba(243, 156, 18, 0.15)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#F39C12",
                marginBottom: 8,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              Examiner Tip
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(240,237,230,0.7)",
                fontFamily: "'DM Sans', sans-serif",
                margin: 0,
              }}
            >
              {q.examiner_tip}
            </p>
          </div>

          {onRequestPractice && (
            <button
              onClick={() => onRequestPractice(index)}
              disabled={practiceLoading}
              style={{
                marginTop: 16,
                background: "rgba(78,205,196,0.10)",
                color: "#4ECDC4",
                border: "1px solid rgba(78,205,196,0.25)",
                borderRadius: 10,
                padding: "10px 20px",
                cursor: practiceLoading ? "default" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
                opacity: practiceLoading ? 0.6 : 1,
              }}
            >
              {practiceLoading ? "Generating..." : "Try a Similar Question"}
            </button>
          )}

          {practiceQuestions && practiceQuestions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {practiceQuestions.map((pq, pi) => (
                <div
                  key={pi}
                  style={{
                    background: "rgba(78,205,196,0.04)",
                    border: "1px solid rgba(78,205,196,0.25)",
                    borderRadius: 14,
                    padding: 22,
                    marginBottom: 12,
                    animation: "fadeSlideUp 0.3s ease both",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                    <span
                      style={{
                        background: "rgba(78,205,196,0.15)",
                        color: "#4ECDC4",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Practice {pi + 1}
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(240,237,230,0.6)",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      [{pq.question.marks} marks]
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "#F0EDE6",
                      fontFamily: "'DM Sans', sans-serif",
                      margin: 0,
                      marginBottom: 16,
                      fontWeight: 500,
                    }}
                  >
                    {pq.question.question}
                  </p>
                  <button
                    onClick={() => onTogglePractice(index, pi)}
                    style={{
                      background: "rgba(78,205,196,0.10)",
                      color: "#4ECDC4",
                      border: "1px solid rgba(78,205,196,0.25)",
                      borderRadius: 10,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s ease",
                      marginBottom: pq.revealed ? 14 : 0,
                    }}
                  >
                    {pq.revealed ? "Hide Answer" : "Reveal Model Answer"}
                  </button>
                  {pq.revealed && (
                    <div style={{ animation: "fadeSlideUp 0.3s ease both" }}>
                      <div
                        style={{
                          background: "rgba(46, 204, 113, 0.06)",
                          border: "1px solid rgba(46, 204, 113, 0.15)",
                          borderRadius: 12,
                          padding: 18,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "#2ECC71",
                            marginBottom: 8,
                            fontFamily: "'JetBrains Mono', monospace",
                            textTransform: "uppercase",
                          }}
                        >
                          Model Answer
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: "rgba(240,237,230,0.85)",
                            fontFamily: "'DM Sans', sans-serif",
                            margin: 0,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {pq.question.model_answer}
                        </p>
                      </div>
                      <div
                        style={{
                          background: "rgba(243, 156, 18, 0.06)",
                          border: "1px solid rgba(243, 156, 18, 0.15)",
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "#F39C12",
                            marginBottom: 8,
                            fontFamily: "'JetBrains Mono', monospace",
                            textTransform: "uppercase",
                          }}
                        >
                          Examiner Tip
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            lineHeight: 1.6,
                            color: "rgba(240,237,230,0.7)",
                            fontFamily: "'DM Sans', sans-serif",
                            margin: 0,
                          }}
                        >
                          {pq.question.examiner_tip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Motivational message ─────────────────────────────────────

function getMotivationalMessage(completedCount, totalTopics, streakCount, practiceTotal) {
  const pct = totalTopics > 0 ? completedCount / totalTopics : 0;
  if (pct >= 1) return "You've covered every topic. Exam-ready!";
  if (pct >= 0.75) return "Nearly there -- the finish line is in sight.";
  if (pct >= 0.5) return "Halfway through. Solid momentum.";
  if (pct >= 0.25) return "Good start. Keep the consistency going.";
  if (practiceTotal >= 10) return "Nice work on the practice questions.";
  if (streakCount >= 2) return `${streakCount} days in a row. Building a great habit.`;
  if (completedCount > 0) return "Every topic you cover gets you closer. Keep going.";
  return "Pick a subject and start with whatever feels right.";
}

// ── Helpers for counting topics ────────────────────────────────

function getSubjectTopicCount(subject) {
  if (subject.isCombined && subject.branches) {
    return Object.values(subject.branches).reduce((sum, b) => sum + b.topics.length, 0);
  }
  return subject.topics.length;
}

function getCompletedCountForSubject(key, subject, completedTopics) {
  if (subject.isCombined && subject.branches) {
    let done = 0;
    for (const [branchKey, branch] of Object.entries(subject.branches)) {
      done += branch.topics.filter((t) => completedTopics[`${key}:${branchKey}:${t}`]).length;
    }
    return done;
  }
  return subject.topics.filter((t) => completedTopics[`${key}:${t}`]).length;
}

// ── Main component ─────────────────────────────────────────────

export default function GCSERevision({ userName }) {
  const navigate = useNavigate();
  const [zaraClickCount, setZaraClickCount] = useState(() => {
    try { return parseInt(localStorage.getItem("zara:click-count") || "0", 10); } catch { return 0; }
  });
  const [zaraMummRa, setZaraMummRa] = useState(false);
  const [laylaClickCount, setLaylaClickCount] = useState(() => {
    try { return parseInt(localStorage.getItem("layla:click-count") || "0", 10); } catch { return 0; }
  });
  const [laylaRusty, setLaylaRusty] = useState(false);
  const [harryClickCount, setHarryClickCount] = useState(() => {
    try { return parseInt(localStorage.getItem("harry:click-count") || "0", 10); } catch { return 0; }
  });
  const [harryDumbbell, setHarryDumbbell] = useState(false);
  const avatarUrl = zaraMummRa ? "/avatars/mumm-ra.png"
    : harryDumbbell ? "/avatars/dumbbell.png"
    : laylaRusty ? "/avatars/rustyspoons.png"
    : `/avatars/${userName}.png`;

  const userProfile = USER_PROFILES[userName] || USER_PROFILES.georgia;
  const displayName = userProfile.displayName;
  const userSubjects = getSubjectsForUser(userName);

  const tierLabels = userProfile.board === "Cambridge IGCSE"
    ? ["Core", "Extended"]
    : ["Foundation", "Higher"];

  // Scroll to top on mount / user switch
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userName]);

  const [screen, setScreen] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [completedTopics, setCompletedTopics] = useState({});
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selfScores, setSelfScores] = useState({});
  const [avatarSpin, setAvatarSpin] = useState(false);
  const [particles, setParticles] = useState([]);
  const avatarContainerRef = useRef(null);
  const [screenShake, setScreenShake] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(`${userName}:banner-dismissed`) === "1";
    } catch { return false; }
  });
  const [practiceQuestions, setPracticeQuestions] = useState({});
  const [practiceLoading, setPracticeLoading] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    streak: { lastDate: null, count: 0 },
    practiceStats: { totalAttempts: 0, bySubject: {} },
    sessionStats: { totalSetsGenerated: 0 },
  });

  const triggerAvatarEffect = (e) => {
    e.stopPropagation();
    setAvatarSpin(true);

    // Zara's Mumm-Ra easter egg
    if (userName === "zara") {
      const newCount = zaraClickCount + 1;
      setZaraClickCount(newCount);
      try { localStorage.setItem("zara:click-count", String(newCount)); } catch {}
      if (zaraMummRa) {
        setZaraMummRa(false);
      } else if (newCount >= 3 && (newCount - 3) % 4 === 0) {
        setZaraMummRa(true);
      }
    }

    // Harry's dumbbell easter egg
    if (userName === "harry") {
      const newCount = harryClickCount + 1;
      setHarryClickCount(newCount);
      try { localStorage.setItem("harry:click-count", String(newCount)); } catch {}
      if (harryDumbbell) {
        setHarryDumbbell(false);
      } else if (newCount >= 3 && (newCount - 3) % 4 === 0) {
        setHarryDumbbell(true);
      }
    }

    // Layla's Rusty Spoons easter egg
    if (userName === "layla") {
      const newCount = laylaClickCount + 1;
      setLaylaClickCount(newCount);
      try { localStorage.setItem("layla:click-count", String(newCount)); } catch {}
      if (laylaRusty) {
        setLaylaRusty(false);
      } else if (newCount >= 3 && (newCount - 3) % 4 === 0) {
        setLaylaRusty(true);
      }
    }

    const gen = EFFECTS[userName];
    const parts = gen ? gen() : [];
    setParticles(parts);

    // Harry's screen shake
    if (userName === "harry") {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 350);
    }

    // Kick off DOM transitions after React renders particles
    const maxDuration = animateParticles(avatarContainerRef.current, parts);

    // Cleanup
    const cleanupDelay = Math.max(maxDuration + 100, 900);
    setTimeout(() => {
      setParticles([]);
      setAvatarSpin(false);
    }, cleanupDelay);
  };

  // Load progress from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${userName}:gcse-progress`);
      if (stored) {
        setCompletedTopics(JSON.parse(stored));
      } else {
        setCompletedTopics({});
      }
    } catch (e) {}
  }, [userName]);

  // Save progress
  const saveProgress = useCallback((newCompleted) => {
    try {
      localStorage.setItem(`${userName}:gcse-progress`, JSON.stringify(newCompleted));
    } catch (e) {}
  }, [userName]);

  const updateStreak = useCallback(() => {
    try {
      const key = `${userName}:streak`;
      const existing = JSON.parse(localStorage.getItem(key) || '{"lastDate":null,"count":0}');
      const today = new Date().toISOString().split("T")[0];
      if (existing.lastDate === today) return;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (existing.lastDate === yesterday) {
        existing.count += 1;
      } else {
        existing.count = 1;
      }
      existing.lastDate = today;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  }, [userName]);

  const refreshDashboardStats = useCallback(() => {
    try {
      const streak = JSON.parse(localStorage.getItem(`${userName}:streak`) || '{"lastDate":null,"count":0}');
      const practiceStats = JSON.parse(localStorage.getItem(`${userName}:practice-stats`) || '{"totalAttempts":0,"bySubject":{}}');
      const sessionStats = JSON.parse(localStorage.getItem(`${userName}:session-stats`) || '{"totalSetsGenerated":0}');
      setDashboardStats({ streak, practiceStats, sessionStats });
    } catch {}
  }, [userName]);

  // Load dashboard stats on mount
  useEffect(() => {
    refreshDashboardStats();
  }, [refreshDashboardStats]);

  const fetchQuestions = async (subject, topic, tier) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          tier,
          board: userProfile.board,
          branch: selectedBranch || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setQuestions(data);
      try {
        const ssKey = `${userName}:session-stats`;
        const ss = JSON.parse(localStorage.getItem(ssKey) || '{"totalSetsGenerated":0}');
        ss.totalSetsGenerated += 1;
        localStorage.setItem(ssKey, JSON.stringify(ss));
      } catch {}
      updateStreak();
      refreshDashboardStats();
    } catch (e) {
      console.error(e);
      setError("Failed to generate questions. Please try again.");
    }
    setLoading(false);
  };

  const updatePracticeStats = useCallback(() => {
    try {
      const key = `${userName}:practice-stats`;
      const existing = JSON.parse(localStorage.getItem(key) || '{"totalAttempts":0,"bySubject":{}}');
      existing.totalAttempts += 1;
      const subj = selectedSubject || "unknown";
      existing.bySubject[subj] = (existing.bySubject[subj] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  }, [userName, selectedSubject]);

  const fetchPracticeQuestion = async (questionIndex) => {
    const q = questions[questionIndex];
    if (!q) return;
    setPracticeLoading((prev) => ({ ...prev, [questionIndex]: true }));
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          tier: selectedTier,
          board: userProfile.board,
          branch: selectedBranch || undefined,
          mode: "practice",
          originalQuestion: q.question,
          marks: q.marks,
          commandWord: q.command_word,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      const practiceQ = data[0];
      setPracticeQuestions((prev) => ({
        ...prev,
        [questionIndex]: [
          ...(prev[questionIndex] || []),
          { question: practiceQ, revealed: false },
        ],
      }));
      updatePracticeStats();
      updateStreak();
    } catch (e) {
      console.error(e);
    }
    setPracticeLoading((prev) => ({ ...prev, [questionIndex]: false }));
  };

  const togglePracticeReveal = (questionIndex, practiceIndex) => {
    setPracticeQuestions((prev) => {
      const list = [...(prev[questionIndex] || [])];
      list[practiceIndex] = { ...list[practiceIndex], revealed: !list[practiceIndex].revealed };
      return { ...prev, [questionIndex]: list };
    });
  };

  const selectSubject = (key) => {
    setSelectedSubject(key);
    const subject = userSubjects[key];
    if (subject.isCombined) {
      setScreen("branches");
    } else {
      setScreen("topics");
    }
  };

  const selectBranch = (branchKey) => {
    setSelectedBranch(branchKey);
    setScreen("topics");
  };

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    const subject = userSubjects[selectedSubject];
    if (subject && subject.hasTiers) {
      setScreen("tier");
    } else {
      startGeneration(topic, null);
    }
  };

  const selectTier = (tier) => {
    setSelectedTier(tier);
    startGeneration(selectedTopic, tier);
  };

  const startGeneration = (topic, tier) => {
    setScreen("questions");
    setQuestions([]);
    setRevealed({});
    setSelfScores({});
    setQuizMode(false);
    setCurrentQuizIndex(0);
    setPracticeQuestions({});
    setPracticeLoading({});
    fetchQuestions(selectedSubject, topic, tier);
  };

  const markComplete = () => {
    const key = selectedBranch
      ? `${selectedSubject}:${selectedBranch}:${selectedTopic}`
      : `${selectedSubject}:${selectedTopic}`;
    const newCompleted = { ...completedTopics, [key]: true };
    setCompletedTopics(newCompleted);
    saveProgress(newCompleted);
  };

  const isTopicComplete = (subjectKey, topic, branchKey) => {
    const key = branchKey
      ? `${subjectKey}:${branchKey}:${topic}`
      : `${subjectKey}:${topic}`;
    return !!completedTopics[key];
  };

  const goHome = () => {
    setScreen("home");
    setSelectedSubject(null);
    setSelectedBranch(null);
    setSelectedTopic(null);
    setSelectedTier(null);
    setQuestions([]);
    setRevealed({});
    setSelfScores({});
    setQuizMode(false);
    setPracticeQuestions({});
    setPracticeLoading({});
    refreshDashboardStats();
  };

  const goToTopics = () => {
    const subject = selectedSubject ? userSubjects[selectedSubject] : null;
    if (subject && subject.isCombined) {
      setScreen("branches");
      setSelectedBranch(null);
    } else {
      setScreen("topics");
    }
    setSelectedTopic(null);
    setQuestions([]);
    setRevealed({});
    setPracticeQuestions({});
    setPracticeLoading({});
  };

  const goToBranchTopics = () => {
    setScreen("topics");
    setSelectedTopic(null);
    setQuestions([]);
    setRevealed({});
  };

  const subjectData = selectedSubject ? userSubjects[selectedSubject] : null;

  // For branch-based subjects, resolve the active display data (icon, color)
  const activeBranch = selectedBranch && subjectData?.branches?.[selectedBranch];
  const activeColor = activeBranch ? activeBranch.color : subjectData?.color;
  const activeIcon = activeBranch ? activeBranch.icon : subjectData?.icon;

  // Current topic list — from branch or from subject directly
  const currentTopics = activeBranch ? activeBranch.topics : subjectData?.topics;

  const totalRevealed = Object.values(revealed).filter(Boolean).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (totalRevealed / totalQuestions) * 100 : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0C0B",
        color: "#F0EDE6",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
        animation: screenShake ? "screenShake 0.35s ease-out" : "none",
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes avatarSpinScale {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes screenShake {
          0% { transform: translate(0, 0); }
          15% { transform: translate(-3px, 2px); }
          30% { transform: translate(3px, -2px); }
          45% { transform: translate(-2px, -3px); }
          60% { transform: translate(2px, 3px); }
          75% { transform: translate(-1px, 1px); }
          100% { transform: translate(0, 0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Ambient background */}
      <div
        style={{
          position: "fixed",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: activeColor
            ? `radial-gradient(circle, ${activeColor}08 0%, transparent 70%)`
            : "radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          transition: "all 1s ease",
        }}
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px", position: "relative" }}>
        {/* Header */}
        <header
          style={{
            padding: "32px 0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            marginBottom: 32,
          }}
        >
          <div
            onClick={goHome}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              ref={avatarContainerRef}
              onClick={triggerAvatarEffect}
              style={{ position: "relative", cursor: "pointer", width: 60, height: 60, flexShrink: 0 }}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  objectFit: "contain",
                  display: "block",
                  animation: avatarSpin ? "avatarSpinScale 0.9s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                }}
              />
              {particles.map((p) => (
                <div
                  key={p.id}
                  data-particle={p.id}
                  style={p.style}
                />
              ))}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                    fontFamily: "'Syne', sans-serif",
                    color: "#4ECDC4",
                  }}
                >
                  {displayName}'s
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "rgba(240,237,230,0.4)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  GCSEs
                </span>
              </div>
              {userProfile.school && (
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(240,237,230,0.3)",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 2,
                  }}
                >
                  {userProfile.school} · {userProfile.yearGroup}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {screen !== "home" && (
              <button
                onClick={goHome}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: "rgba(240,237,230,0.5)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#F0EDE6";
                  e.target.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "rgba(240,237,230,0.5)";
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                ← All Subjects
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 14px",
                color: "rgba(240,237,230,0.5)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#F0EDE6";
                e.target.style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "rgba(240,237,230,0.5)";
                e.target.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              Switch User
            </button>
          </div>
        </header>

        {/* HOME SCREEN */}
        {screen === "home" && (
          <div>
            <div
              style={{
                marginBottom: 48,
                animation: "fadeSlideUp 0.5s ease both",
              }}
            >
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  margin: 0,
                  marginBottom: 12,
                  lineHeight: 1.15,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                You've got this,{" "}
                <span style={{ color: "#4ECDC4" }}>{displayName}</span>
              </h1>
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(240,237,230,0.45)",
                  margin: 0,
                  lineHeight: 1.6,
                  maxWidth: 500,
                }}
              >
                AI-generated questions based on the most common patterns from the
                last 5 years of past papers. Focus on what's most likely to come up.
              </p>
            </div>

            {/* Georgia head-start banner */}
            {userName === "georgia" && !bannerDismissed && (
              <div
                style={{
                  position: "relative",
                  marginBottom: 28,
                  padding: "20px 44px 20px 22px",
                  background: "rgba(78,205,196,0.04)",
                  border: "1px solid rgba(78,205,196,0.18)",
                  borderLeft: "3px solid #4ECDC4",
                  borderRadius: 14,
                  animation: "fadeSlideUp 0.5s ease both",
                  animationDelay: "0.15s",
                }}
              >
                <button
                  onClick={() => {
                    setBannerDismissed(true);
                    try { localStorage.setItem(`${userName}:banner-dismissed`, "1"); } catch {}
                  }}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "none",
                    border: "none",
                    color: "rgba(240,237,230,0.3)",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: "4px 8px",
                    lineHeight: 1,
                    borderRadius: 6,
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.target.style.color = "rgba(240,237,230,0.7)"; }}
                  onMouseLeave={(e) => { e.target.style.color = "rgba(240,237,230,0.3)"; }}
                >
                  ✕
                </button>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "rgba(240,237,230,0.65)",
                    margin: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 16 }}>🚀</span>{" "}
                  You're in Year 8 — GCSEs don't start until Year 10, so you've got a proper
                  head start. Explore the topics now and by the time everyone else is scrambling
                  you'll already know what's coming. Want to use this for your current subjects instead?
                  Just say the word and we'll set it up for you.
                </p>
              </div>
            )}

            {/* Progress Dashboard */}
            {(() => {
              const totalTopics = getTotalTopicsCount(userSubjects);
              const completedCount = Object.entries(userSubjects).reduce(
                (sum, [key, subject]) => sum + getCompletedCountForSubject(key, subject, completedTopics),
                0
              );
              const { streak, practiceStats, sessionStats } = dashboardStats;
              const hasActivity = completedCount > 0 || streak.count > 0 || practiceStats.totalAttempts > 0 || sessionStats.totalSetsGenerated > 0;
              if (!hasActivity) return null;
              const motivationalMsg = getMotivationalMessage(completedCount, totalTopics, streak.count, practiceStats.totalAttempts);
              return (
                <div
                  style={{
                    marginBottom: 32,
                    padding: 24,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    animation: "fadeSlideUp 0.5s ease both",
                    animationDelay: "0.1s",
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,230,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                        Your Progress
                      </span>
                      {streak.count >= 2 && (
                        <span style={{
                          background: "rgba(243, 156, 18, 0.12)",
                          color: "#F39C12",
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {streak.count} day streak
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#4ECDC4", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {completedCount} of {totalTopics} topics
                    </span>
                  </div>

                  {/* Overall progress bar */}
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ width: `${totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0}%`, height: "100%", background: "#4ECDC4", borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>

                  {/* Motivational message */}
                  <p style={{
                    fontSize: 13,
                    color: "rgba(240,237,230,0.4)",
                    fontStyle: "italic",
                    margin: "0 0 18px 0",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {motivationalMsg}
                  </p>

                  {/* Per-subject rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {Object.entries(userSubjects).map(([key, subject]) => {
                      const done = getCompletedCountForSubject(key, subject, completedTopics);
                      const total = getSubjectTopicCount(subject);
                      const subjectPractice = practiceStats.bySubject[key] || 0;
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14, minWidth: 22, textAlign: "center" }}>{subject.icon}</span>
                          <span style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: "right" }}>
                            {done}/{total}
                          </span>
                          {subjectPractice > 0 && (
                            <span style={{
                              fontSize: 10,
                              color: "#4ECDC4",
                              fontFamily: "'JetBrains Mono', monospace",
                              minWidth: 24,
                            }}>
                              +{subjectPractice}
                            </span>
                          )}
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%", height: "100%", background: subject.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary stats */}
                  {(sessionStats.totalSetsGenerated > 0 || practiceStats.totalAttempts > 0) && (
                    <div style={{
                      display: "flex",
                      gap: 16,
                      paddingTop: 14,
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      flexWrap: "wrap",
                    }}>
                      {sessionStats.totalSetsGenerated > 0 && (
                        <span style={{ fontSize: 11, color: "rgba(240,237,230,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {sessionStats.totalSetsGenerated} question {sessionStats.totalSetsGenerated === 1 ? "set" : "sets"} generated
                        </span>
                      )}
                      {practiceStats.totalAttempts > 0 && (
                        <span style={{ fontSize: 11, color: "rgba(240,237,230,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {practiceStats.totalAttempts} practice {practiceStats.totalAttempts === 1 ? "question" : "questions"} attempted
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240, 1fr))",
                gap: 14,
              }}
            >
              <style>{`
                @media (min-width: 540px) {
                  .subject-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (min-width: 780px) {
                  .subject-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
              `}</style>
              <div
                className="subject-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 14,
                }}
              >
                {Object.entries(userSubjects).map(([key, subject], i) => {
                  const completedCount = getCompletedCountForSubject(key, subject, completedTopics);
                  const totalCount = getSubjectTopicCount(subject);
                  return (
                    <div key={key} style={{ position: "relative" }}>
                      <SubjectCard
                        subjectKey={key}
                        subject={subject}
                        onClick={() => selectSubject(key)}
                        delay={i * 60}
                        topicCount={totalCount}
                      />
                      {completedCount > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: "rgba(46, 204, 113, 0.15)",
                            color: "#2ECC71",
                            borderRadius: 20,
                            padding: "3px 8px",
                            fontSize: 10,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600,
                          }}
                        >
                          {completedCount}/{totalCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 48,
                padding: 20,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.04)",
                animation: "fadeSlideUp 0.6s ease both",
                animationDelay: "0.5s",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(240,237,230,0.35)",
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ⚡ Questions are generated by AI based on exam board patterns. Always verify with
                your teacher and official past papers. Use as a supplement, not a replacement.
              </p>
            </div>
          </div>
        )}

        {/* BRANCHES SCREEN (Combined Science) */}
        {screen === "branches" && subjectData && subjectData.branches && (
          <div>
            <div
              style={{
                marginBottom: 36,
                animation: "fadeSlideUp 0.4s ease both",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 12 }}>{subjectData.icon}</div>
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 8,
                  fontFamily: "'Instrument Serif', serif",
                }}
              >
                {subjectData.name}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(240,237,230,0.4)",
                  margin: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Choose a science to revise
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(subjectData.branches).map(([branchKey, branch], i) => {
                const done = branch.topics.filter(
                  (t) => completedTopics[`${selectedSubject}:${branchKey}:${t}`]
                ).length;
                const total = branch.topics.length;
                return (
                  <div
                    key={branchKey}
                    onClick={() => selectBranch(branchKey)}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid rgba(255,255,255,0.06)`,
                      borderRadius: 16,
                      padding: "28px 24px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation: `fadeSlideUp 0.5s ease both`,
                      animationDelay: `${i * 80}ms`,
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = branch.color + "60";
                      e.currentTarget.style.background = branch.color + "10";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ fontSize: 36, flexShrink: 0 }}>{branch.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "#F0EDE6",
                          marginBottom: 4,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {branch.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(240,237,230,0.4)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {total} topics
                      </div>
                    </div>
                    {done > 0 && (
                      <div
                        style={{
                          background: "rgba(46, 204, 113, 0.15)",
                          color: "#2ECC71",
                          borderRadius: 20,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {done}/{total}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOPICS SCREEN */}
        {screen === "topics" && subjectData && (
          <div>
            <div
              style={{
                marginBottom: 36,
                animation: "fadeSlideUp 0.4s ease both",
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 12,
                }}
              >
                {activeIcon}
              </div>
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 8,
                  fontFamily: "'Instrument Serif', serif",
                }}
              >
                {activeBranch ? `${subjectData.name}: ${activeBranch.name}` : subjectData.name}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(240,237,230,0.4)",
                  margin: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Select a topic to generate high-probability exam questions
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentTopics && currentTopics.map((topic, i) => {
                const isComplete = isTopicComplete(selectedSubject, topic, selectedBranch);
                return (
                  <div
                    key={topic}
                    onClick={() => selectTopic(topic)}
                    style={{
                      background: isComplete
                        ? "rgba(46, 204, 113, 0.05)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        isComplete
                          ? "rgba(46, 204, 113, 0.15)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      borderRadius: 14,
                      padding: "20px 24px",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      animation: "fadeSlideUp 0.4s ease both",
                      animationDelay: `${i * 60}ms`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = (activeColor || "#4ECDC4") + "40";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isComplete
                        ? "rgba(46, 204, 113, 0.15)"
                        : "rgba(255,255,255,0.06)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#F0EDE6",
                      }}
                    >
                      {topic}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: isComplete ? "#2ECC71" : "rgba(240,237,230,0.3)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isComplete ? "✓ Done" : "→"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TIER SCREEN */}
        {screen === "tier" && (
          <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 300,
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: 8,
                fontFamily: "'Instrument Serif', serif",
              }}
            >
              Select Tier
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "rgba(240,237,230,0.4)",
                margin: 0,
                marginBottom: 28,
              }}
            >
              {selectedTopic}
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              {tierLabels.map((tier) => (
                <button
                  key={tier}
                  onClick={() => selectTier(tier)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "24px",
                    color: "#F0EDE6",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = (activeColor || "#4ECDC4") + "50";
                    e.target.style.background = (activeColor || "#4ECDC4") + "10";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.background = "rgba(255,255,255,0.03)";
                  }}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUESTIONS SCREEN */}
        {screen === "questions" && (
          <div>
            {/* Breadcrumb & info */}
            <div
              style={{
                marginBottom: 28,
                animation: "fadeSlideUp 0.4s ease both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  onClick={goToTopics}
                  style={{
                    fontSize: 13,
                    color: subjectData?.color || "#4ECDC4",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {subjectData?.name}
                </span>
                {activeBranch && (
                  <>
                    <span style={{ color: "rgba(240,237,230,0.2)", fontSize: 12 }}>›</span>
                    <span
                      onClick={goToBranchTopics}
                      style={{
                        fontSize: 13,
                        color: activeBranch.color,
                        cursor: "pointer",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {activeBranch.name}
                    </span>
                  </>
                )}
                <span style={{ color: "rgba(240,237,230,0.2)", fontSize: 12 }}>›</span>
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(240,237,230,0.6)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {selectedTopic}
                  {selectedTier ? ` · ${selectedTier}` : ""}
                </span>
              </div>

              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 4,
                  fontFamily: "'Instrument Serif', serif",
                }}
              >
                Most Likely Questions
              </h2>

              {!loading && questions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {/* Progress bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: "100%",
                          background: activeColor || "#4ECDC4",
                          borderRadius: 2,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(240,237,230,0.4)",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {totalRevealed}/{totalQuestions} revealed
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        const allRevealed = {};
                        questions.forEach((_, i) => (allRevealed[i] = true));
                        setRevealed(allRevealed);
                      }}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        padding: "8px 14px",
                        color: "rgba(240,237,230,0.6)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.08)";
                      }}
                    >
                      Reveal All
                    </button>
                    <button
                      onClick={() => {
                        setQuizMode(!quizMode);
                        setCurrentQuizIndex(0);
                      }}
                      style={{
                        background: quizMode ? (activeColor || "#4ECDC4") + "20" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${quizMode ? (activeColor || "#4ECDC4") + "40" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 8,
                        padding: "8px 14px",
                        color: quizMode ? (activeColor || "#4ECDC4") : "rgba(240,237,230,0.6)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {quizMode ? "✕ Exit Quiz" : "⚡ Quiz Mode"}
                    </button>
                    {totalRevealed === totalQuestions && (
                      <button
                        onClick={() => {
                          markComplete();
                          if (selectedBranch) {
                            goToBranchTopics();
                          } else {
                            goToTopics();
                          }
                        }}
                        style={{
                          background: "rgba(46, 204, 113, 0.12)",
                          border: "1px solid rgba(46, 204, 113, 0.25)",
                          borderRadius: 8,
                          padding: "8px 14px",
                          color: "#2ECC71",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          transition: "all 0.2s ease",
                        }}
                      >
                        ✓ Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Loading state */}
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 0",
                  animation: "fadeSlideUp 0.4s ease both",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 20,
                    animation: "pulse 1.5s ease infinite",
                  }}
                >
                  {activeIcon}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(240,237,230,0.5)",
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  Analysing 5 years of past papers
                  <LoadingDots />
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(240,237,230,0.25)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Generating highest-probability questions
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  animation: "fadeSlideUp 0.4s ease both",
                }}
              >
                <p style={{ color: "#E74C3C", marginBottom: 16 }}>{error}</p>
                <button
                  onClick={() => startGeneration(selectedTopic, selectedTier)}
                  style={{
                    background: (activeColor || "#4ECDC4") + "20",
                    border: `1px solid ${(activeColor || "#4ECDC4")}40`,
                    borderRadius: 10,
                    padding: "10px 24px",
                    color: activeColor || "#4ECDC4",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Quiz Mode */}
            {quizMode && questions.length > 0 && (
              <div>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 20,
                    fontSize: 12,
                    color: "rgba(240,237,230,0.4)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Question {currentQuizIndex + 1} of {questions.length}
                </div>
                <QuestionCard
                  q={questions[currentQuizIndex]}
                  index={currentQuizIndex}
                  revealed={revealed[currentQuizIndex]}
                  onReveal={() =>
                    setRevealed((prev) => ({ ...prev, [currentQuizIndex]: !prev[currentQuizIndex] }))
                  }
                  color={activeColor || "#4ECDC4"}
                  practiceQuestions={practiceQuestions[currentQuizIndex]}
                  onRequestPractice={fetchPracticeQuestion}
                  onTogglePractice={togglePracticeReveal}
                  practiceLoading={practiceLoading[currentQuizIndex]}
                />
                {revealed[currentQuizIndex] && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 16,
                      animation: "fadeSlideUp 0.3s ease both",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(240,237,230,0.4)",
                        alignSelf: "center",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      How'd you do?
                    </span>
                    {["😟", "😐", "😊", "🎯"].map((emoji, score) => (
                      <button
                        key={score}
                        onClick={() => {
                          setSelfScores((prev) => ({
                            ...prev,
                            [currentQuizIndex]: score,
                          }));
                          if (currentQuizIndex < questions.length - 1) {
                            setTimeout(() => {
                              setCurrentQuizIndex((prev) => prev + 1);
                            }, 300);
                          }
                        }}
                        style={{
                          background:
                            selfScores[currentQuizIndex] === score
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(255,255,255,0.03)",
                          border: `1px solid ${
                            selfScores[currentQuizIndex] === score
                              ? "rgba(255,255,255,0.2)"
                              : "rgba(255,255,255,0.06)"
                          }`,
                          borderRadius: 10,
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontSize: 18,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {/* Nav buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 20,
                  }}
                >
                  <button
                    onClick={() =>
                      setCurrentQuizIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentQuizIndex === 0}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: "8px 18px",
                      color:
                        currentQuizIndex === 0
                          ? "rgba(240,237,230,0.2)"
                          : "rgba(240,237,230,0.6)",
                      cursor: currentQuizIndex === 0 ? "default" : "pointer",
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentQuizIndex((prev) =>
                        Math.min(questions.length - 1, prev + 1)
                      )
                    }
                    disabled={currentQuizIndex === questions.length - 1}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: "8px 18px",
                      color:
                        currentQuizIndex === questions.length - 1
                          ? "rgba(240,237,230,0.2)"
                          : "rgba(240,237,230,0.6)",
                      cursor:
                        currentQuizIndex === questions.length - 1
                          ? "default"
                          : "pointer",
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Standard question list */}
            {!quizMode &&
              questions.map((q, i) => (
                <QuestionCard
                  key={i}
                  q={q}
                  index={i}
                  revealed={revealed[i]}
                  onReveal={() => setRevealed((prev) => ({ ...prev, [i]: !prev[i] }))}
                  color={activeColor || "#4ECDC4"}
                  practiceQuestions={practiceQuestions[i]}
                  onRequestPractice={fetchPracticeQuestion}
                  onTogglePractice={togglePracticeReveal}
                  practiceLoading={practiceLoading[i]}
                />
              ))}
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
