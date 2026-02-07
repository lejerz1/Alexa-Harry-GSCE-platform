import { useState, useEffect, useCallback } from "react";

const SUBJECTS = {
  maths: {
    name: "Mathematics",
    icon: "∑",
    color: "#FF6B35",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Algebra & Equations",
      "Geometry & Measures",
      "Statistics & Probability",
      "Number & Ratio",
      "Graphs & Functions",
    ],
  },
  english_lang: {
    name: "English Language",
    icon: "✎",
    color: "#4ECDC4",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Reading Comprehension & Analysis",
      "Creative Writing",
      "Transactional Writing",
      "Language Techniques",
      "Comparing Texts",
    ],
  },
  english_lit: {
    name: "English Literature",
    icon: "📖",
    color: "#9B59B6",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Shakespeare",
      "19th Century Novel",
      "Modern Prose/Drama",
      "Poetry Anthology",
      "Unseen Poetry",
    ],
  },
  biology: {
    name: "Biology",
    icon: "🧬",
    color: "#2ECC71",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Cell Biology & Organisation",
      "Infection & Response",
      "Bioenergetics",
      "Homeostasis & Response",
      "Inheritance & Evolution",
      "Ecology",
    ],
  },
  chemistry: {
    name: "Chemistry",
    icon: "⚗",
    color: "#3498DB",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Atomic Structure & Bonding",
      "Quantitative Chemistry",
      "Chemical Changes",
      "Energy Changes",
      "Rate & Equilibrium",
      "Organic Chemistry",
    ],
  },
  physics: {
    name: "Physics",
    icon: "⚛",
    color: "#E74C3C",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Energy & Forces",
      "Electricity",
      "Particle Model",
      "Atomic Structure & Radiation",
      "Waves & EM Spectrum",
      "Magnetism",
    ],
  },
  geography: {
    name: "Geography",
    icon: "🌍",
    color: "#F39C12",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Natural Hazards",
      "Living World (Ecosystems)",
      "Physical Landscapes (Rivers & Coasts)",
      "Urban Issues & Challenges",
      "Economic World",
      "Resource Management",
    ],
  },
  history: {
    name: "History",
    icon: "⏳",
    color: "#8E6F47",
    board: "AQA / Edexcel / OCR",
    topics: [
      "Medicine Through Time",
      "Elizabethan England",
      "Weimar & Nazi Germany",
      "Cold War",
      "Norman England",
      "American West",
    ],
  },
  computer_science: {
    name: "Computer Science",
    icon: "💻",
    color: "#1ABC9C",
    board: "AQA / OCR",
    topics: [
      "Computational Thinking & Algorithms",
      "Data Representation",
      "Computer Systems & Networks",
      "Programming Fundamentals",
      "Cyber Security",
      "Databases & SQL",
    ],
  },
};

const TIERS = ["Foundation", "Higher"];

const generateSystemPrompt = (subject, topic, tier) => {
  return `You are a GCSE exam question expert. Your job is to generate the 8 most likely exam questions for the upcoming GCSE ${subject} exam, specifically on the topic "${topic}"${tier ? ` at ${tier} tier` : ""}.

Base these on patterns from the last 5 years of AQA, Edexcel, and OCR past papers. Focus on:
- Questions that appear most frequently across exam boards
- Common command words (Calculate, Explain, Describe, Evaluate, Compare)
- Topics that are statistically most examined
- The exact style and mark allocation of real GCSE papers

For each question, provide:
1. The question exactly as it might appear on the paper
2. The mark allocation
3. A model answer that would achieve full marks
4. An examiner tip for maximizing marks

Respond ONLY with valid JSON in this exact format, no markdown, no backticks:
[
  {
    "id": 1,
    "question": "...",
    "marks": 4,
    "command_word": "Explain",
    "frequency": "Very High",
    "model_answer": "...",
    "examiner_tip": "..."
  }
]`;
};

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

function SubjectCard({ subjectKey, subject, onClick, delay }) {
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
        {subject.topics.length} topics · {subject.board}
      </div>
    </div>
  );
}

function QuestionCard({ q, index, revealed, onReveal, color }) {
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

      {!revealed ? (
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
          }}
          onMouseEnter={(e) => {
            e.target.style.background = color + "25";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = color + "15";
          }}
        >
          Reveal Model Answer
        </button>
      ) : (
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
              💡 Examiner Tip
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
        </div>
      )}
    </div>
  );
}

export default function GCSERevision() {
  const [screen, setScreen] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState(null);
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

  // Load progress from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("gcse-progress");
        if (result?.value) {
          setCompletedTopics(JSON.parse(result.value));
        }
      } catch (e) {}
    })();
  }, []);

  // Save progress
  const saveProgress = useCallback(async (newCompleted) => {
    try {
      await window.storage.set("gcse-progress", JSON.stringify(newCompleted));
    } catch (e) {}
  }, []);

  const fetchQuestions = async (subject, topic, tier) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: generateSystemPrompt(
                SUBJECTS[subject].name,
                topic,
                SUBJECTS[subject].name === "Mathematics" ? tier : null
              ),
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content
        .map((i) => i.text || "")
        .filter(Boolean)
        .join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuestions(parsed);
    } catch (e) {
      console.error(e);
      setError("Failed to generate questions. Please try again.");
    }
    setLoading(false);
  };

  const selectSubject = (key) => {
    setSelectedSubject(key);
    setScreen("topics");
  };

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    if (selectedSubject === "maths") {
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
    fetchQuestions(selectedSubject, topic, tier);
  };

  const markComplete = () => {
    const key = `${selectedSubject}:${selectedTopic}`;
    const newCompleted = { ...completedTopics, [key]: true };
    setCompletedTopics(newCompleted);
    saveProgress(newCompleted);
  };

  const goHome = () => {
    setScreen("home");
    setSelectedSubject(null);
    setSelectedTopic(null);
    setSelectedTier(null);
    setQuestions([]);
    setRevealed({});
    setSelfScores({});
    setQuizMode(false);
  };

  const goToTopics = () => {
    setScreen("topics");
    setSelectedTopic(null);
    setQuestions([]);
    setRevealed({});
  };

  const subjectData = selectedSubject ? SUBJECTS[selectedSubject] : null;

  const totalRevealed = Object.keys(revealed).length;
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
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        
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
          background: subjectData
            ? `radial-gradient(circle, ${subjectData.color}08 0%, transparent 70%)`
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
            style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8 }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
              }}
            >
              GCSE
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 300,
                letterSpacing: "-0.03em",
                color: "rgba(240,237,230,0.5)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Revision
            </span>
          </div>
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
                  fontSize: 42,
                  fontWeight: 300,
                  letterSpacing: "-0.03em",
                  margin: 0,
                  marginBottom: 12,
                  lineHeight: 1.15,
                  fontFamily: "'Instrument Serif', serif",
                }}
              >
                Ace your{" "}
                <span style={{ fontStyle: "italic", color: "#FF6B35" }}>GCSEs</span>
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
                {Object.entries(SUBJECTS).map(([key, subject], i) => {
                  const completedCount = subject.topics.filter(
                    (t) => completedTopics[`${key}:${t}`]
                  ).length;
                  return (
                    <div key={key} style={{ position: "relative" }}>
                      <SubjectCard
                        subjectKey={key}
                        subject={subject}
                        onClick={() => selectSubject(key)}
                        delay={i * 60}
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
                          {completedCount}/{subject.topics.length}
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
                {subjectData.icon}
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
                Select a topic to generate high-probability exam questions
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subjectData.topics.map((topic, i) => {
                const isComplete = completedTopics[`${selectedSubject}:${topic}`];
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
                      e.currentTarget.style.borderColor = subjectData.color + "40";
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

        {/* TIER SCREEN (Maths only) */}
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
              {TIERS.map((tier) => (
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
                    e.target.style.borderColor = subjectData.color + "50";
                    e.target.style.background = subjectData.color + "10";
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
                    color: subjectData.color,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {subjectData.name}
                </span>
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
                          background: subjectData.color,
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
                        background: quizMode ? subjectData.color + "20" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${quizMode ? subjectData.color + "40" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 8,
                        padding: "8px 14px",
                        color: quizMode ? subjectData.color : "rgba(240,237,230,0.6)",
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
                          goToTopics();
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
                  {subjectData.icon}
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
                    background: subjectData.color + "20",
                    border: `1px solid ${subjectData.color}40`,
                    borderRadius: 10,
                    padding: "10px 24px",
                    color: subjectData.color,
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
                  index={0}
                  revealed={revealed[currentQuizIndex]}
                  onReveal={() =>
                    setRevealed((prev) => ({ ...prev, [currentQuizIndex]: true }))
                  }
                  color={subjectData.color}
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
                  onReveal={() => setRevealed((prev) => ({ ...prev, [i]: true }))}
                  color={subjectData.color}
                />
              ))}
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
