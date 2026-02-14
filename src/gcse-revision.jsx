import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { USER_PROFILES, getSubjectsForUser, getTotalTopicsCount } from "./userConfig";
import { EFFECTS, animateParticles } from "./avatarEffects";
import SubjectCarousel from "./SubjectCarousel";
import { playSound, playEasterEggSound } from "./soundEffects";
import { BookOpen, Calculator, TrendingUp, Landmark, Microscope, FlaskConical, Atom, Globe2, Monitor } from "lucide-react";

const LUCIDE_ICONS = { BookOpen, Calculator, TrendingUp, Landmark, Microscope, FlaskConical, Atom, Globe2, Monitor };

function SubjectIcon({ icon, size = 36, color = "#4ECDC4" }) {
  const LucideComponent = LUCIDE_ICONS[icon];
  if (LucideComponent) return <LucideComponent size={size} color={color} strokeWidth={1.5} />;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}

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
      <div style={{ marginBottom: 12, lineHeight: 1 }}><SubjectIcon icon={subject.icon} size={36} /></div>
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

// ── Grade boundaries ─────────────────────────────────────────

function getGrade(pct) {
  if (pct >= 90) return "9";
  if (pct >= 80) return "8";
  if (pct >= 70) return "7";
  if (pct >= 60) return "6";
  if (pct >= 50) return "5";
  if (pct >= 40) return "4";
  if (pct >= 30) return "3";
  if (pct >= 20) return "2";
  return "1";
}

function getScoreColor(pct) {
  if (pct >= 70) return "#2ECC71";
  if (pct >= 40) return "#F39C12";
  return "#E74C3C";
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
  const [alexaClickCount, setAlexaClickCount] = useState(() => {
    try { return parseInt(localStorage.getItem("alexa:click-count") || "0", 10); } catch { return 0; }
  });
  const [alexaFootball, setAlexaFootball] = useState(false);
  const [georgiaClickCount, setGeorgiaClickCount] = useState(() => {
    try { return parseInt(localStorage.getItem("georgia:click-count") || "0", 10); } catch { return 0; }
  });
  const [georgiaZoom, setGeorgiaZoom] = useState(false);
  const avatarUrl = alexaFootball ? "/avatars/alexafootball.png"
    : zaraMummRa ? "/avatars/mumm-ra.png"
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
  const soundClickCount = useRef(0);
  const [screenShake, setScreenShake] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(`${userName}:banner-dismissed`) === "1";
    } catch { return false; }
  });
  const [heartPhase, setHeartPhase] = useState("idle"); // idle | beating | explode | rain | afterglow | done
  const heartRef = useRef(null);
  const heartParticleRef = useRef(null);
  const [colorFlash, setColorFlash] = useState(true);
  const [practiceQuestions, setPracticeQuestions] = useState({});
  const [practiceLoading, setPracticeLoading] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});
  const [quizAssessments, setQuizAssessments] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    streak: { lastDate: null, count: 0 },
    practiceStats: { totalAttempts: 0, bySubject: {} },
    sessionStats: { totalSetsGenerated: 0 },
  });

  // Massive heart explosion on every page visit
  useEffect(() => {
    const timers = [];
    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

    // Web Audio heartbeat sound
    const playHeartbeat = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        [0, 140, 300].forEach((delay) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "sine";
          osc.frequency.value = 55;
          gain.gain.setValueAtTime(0.3, ac.currentTime + delay / 1000);
          gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + delay / 1000 + 0.12);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(ac.currentTime + delay / 1000);
          osc.stop(ac.currentTime + delay / 1000 + 0.15);
        });
      } catch {}
    };

    // Web Audio explosion pop
    const playPop = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = ac.sampleRate * 0.15;
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.4, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.15);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        src.start();
      } catch {}
    };

    // Phase 1: beating
    setHeartPhase("beating");
    playHeartbeat();

    // Phase 2: explode at 600ms
    t(() => {
      setHeartPhase("explode");
      playPop();

      // Spawn particles in staggered batches into the fixed overlay
      const container = heartParticleRef.current;
      if (!container) return;
      const rect = heartRef.current?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : 200;
      const emojis = ["❤️", "💖", "💗", "💕", "🧡", "💛", "✨", "⭐"];
      const TOTAL = 70;
      const BATCH = 18;

      const spawnBatch = (startIdx, count) => {
        for (let j = 0; j < count && startIdx + j < TOTAL; j++) {
          const i = startIdx + j;
          const el = document.createElement("span");
          const angle = (i / TOTAL) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
          const dist = 100 + Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.45;
          const tx = Math.cos(angle) * dist;
          const ty = Math.sin(angle) * dist * 0.7;
          const rot = (Math.random() - 0.5) * 900;
          const sizeClass = Math.random();
          const sz = sizeClass < 0.3 ? 8 + Math.random() * 6 : sizeClass < 0.7 ? 16 + Math.random() * 8 : 32 + Math.random() * 12;
          const dur = 1.2 + Math.random() * 0.8;
          const del = Math.random() * 0.15;
          const swayX = (Math.random() - 0.5) * 60;
          const gravY = 80 + Math.random() * 120;

          const kf = `hb${i}_${Date.now()}`;
          const styleTag = document.createElement("style");
          styleTag.textContent = `@keyframes ${kf} {
            0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
            35% { transform: translate(${tx * 0.7}px,${ty * 0.5}px) rotate(${rot * 0.5}deg) scale(${sz > 24 ? 1.2 : 1}); opacity: 1; }
            100% { transform: translate(${tx + swayX}px,${ty + gravY}px) rotate(${rot}deg) scale(0.2); opacity: 0; }
          }`;
          container.appendChild(styleTag);

          el.textContent = emojis[i % emojis.length];
          el.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;font-size:${sz}px;display:inline-block;will-change:transform,opacity;animation:${kf} ${dur}s cubic-bezier(0.25,0.46,0.45,0.94) ${del}s both;pointer-events:none;`;
          container.appendChild(el);
        }
      };

      spawnBatch(0, BATCH);
      t(() => spawnBatch(BATCH, BATCH), 60);
      t(() => spawnBatch(BATCH * 2, BATCH), 120);
      t(() => spawnBatch(BATCH * 3, TOTAL - BATCH * 3), 180);

      // Shockwave ring
      const ring = document.createElement("div");
      ring.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:0;height:0;border-radius:50%;border:2px solid rgba(78,205,196,0.6);transform:translate(-50%,-50%);animation:shockwave 0.8s ease-out both;pointer-events:none;`;
      const ringStyle = document.createElement("style");
      ringStyle.textContent = `@keyframes shockwave { 0%{width:0;height:0;opacity:0.8;} 100%{width:${Math.min(window.innerWidth, 800)}px;height:${Math.min(window.innerWidth, 800)}px;opacity:0;} }`;
      container.appendChild(ringStyle);
      container.appendChild(ring);

      // Delayed sparkles (rain phase)
      t(() => {
        for (let s = 0; s < 20; s++) {
          t(() => {
            if (!container.parentNode) return;
            const sp = document.createElement("span");
            const sx = Math.random() * window.innerWidth;
            const sy = Math.random() * window.innerHeight * 0.6;
            const skf = `sp${s}_${Date.now()}`;
            const spStyle = document.createElement("style");
            spStyle.textContent = `@keyframes ${skf} { 0%{transform:scale(0) rotate(0deg);opacity:0;} 30%{transform:scale(1.2) rotate(90deg);opacity:1;} 100%{transform:scale(0) rotate(270deg) translateY(40px);opacity:0;} }`;
            container.appendChild(spStyle);
            sp.textContent = "✨";
            sp.style.cssText = `position:absolute;left:${sx}px;top:${sy}px;font-size:${10 + Math.random() * 16}px;animation:${skf} 0.8s ease-out both;pointer-events:none;`;
            container.appendChild(sp);
          }, s * 80);
        }
      }, 800);
    }, 600);

    // Phase 3: rain
    t(() => setHeartPhase("rain"), 1200);

    // Phase 4: afterglow — name glows teal
    t(() => setHeartPhase("afterglow"), 3200);

    // Cleanup
    t(() => {
      setHeartPhase("done");
      if (heartParticleRef.current) heartParticleRef.current.innerHTML = "";
    }, 4200);

    return () => timers.forEach(clearTimeout);
  }, [userName]);

  const triggerAvatarEffect = (e) => {
    e.stopPropagation();
    setAvatarSpin(true);

    // Play sound — every 3rd click plays the easter egg variant
    soundClickCount.current += 1;
    if (soundClickCount.current % 3 === 0) {
      playEasterEggSound(userName);
    } else {
      playSound(userName);
    }

    // Alexa's football easter egg
    if (userName === "alexa") {
      const newCount = alexaClickCount + 1;
      setAlexaClickCount(newCount);
      try { localStorage.setItem("alexa:click-count", String(newCount)); } catch {}
      if (alexaFootball) {
        setAlexaFootball(false);
      } else if (newCount >= 3 && (newCount - 3) % 4 === 0) {
        setAlexaFootball(true);
      }
    }

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

    // Georgia's zoom easter egg
    if (userName === "georgia") {
      const newCount = georgiaClickCount + 1;
      setGeorgiaClickCount(newCount);
      try { localStorage.setItem("georgia:click-count", String(newCount)); } catch {}
      if (georgiaZoom) {
        setGeorgiaZoom(false);
      } else if (newCount >= 3 && (newCount - 3) % 4 === 0) {
        setGeorgiaZoom(true);
        setTimeout(() => setGeorgiaZoom(false), 3000);
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

  const getTopicKey = useCallback(() => {
    return selectedBranch
      ? `${selectedSubject}:${selectedBranch}:${selectedTopic}`
      : `${selectedSubject}:${selectedTopic}`;
  }, [selectedSubject, selectedBranch, selectedTopic]);

  const getQuizScore = useCallback(() => {
    let earned = 0;
    let totalMarks = 0;
    questions.forEach((q, i) => {
      totalMarks += q.marks;
      if (quizAssessments[i] === "full") earned += q.marks;
      else if (quizAssessments[i] === "partial") earned += Math.round(q.marks / 2);
    });
    return { earned, totalMarks };
  }, [questions, quizAssessments]);

  const getQuizScoresSoFar = useCallback(() => {
    let earned = 0;
    let totalSoFar = 0;
    questions.forEach((q, i) => {
      if (quizAssessments[i]) {
        totalSoFar += q.marks;
        if (quizAssessments[i] === "full") earned += q.marks;
        else if (quizAssessments[i] === "partial") earned += Math.round(q.marks / 2);
      }
    });
    return { earned, totalSoFar };
  }, [questions, quizAssessments]);

  const loadQuizScores = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(`${userName}:quiz-scores`) || "{}");
    } catch { return {}; }
  }, [userName]);

  const saveQuizResult = useCallback((pct, earned, totalMarks) => {
    try {
      const key = getTopicKey();
      const all = loadQuizScores();
      const existing = all[key] || { bestPct: 0, bestScore: 0, bestTotal: 0, attempts: 0 };
      existing.attempts += 1;
      if (pct > existing.bestPct) {
        existing.bestPct = pct;
        existing.bestScore = earned;
        existing.bestTotal = totalMarks;
      }
      all[key] = existing;
      localStorage.setItem(`${userName}:quiz-scores`, JSON.stringify(all));
    } catch {}
  }, [userName, getTopicKey, loadQuizScores]);

  const finishQuiz = useCallback(() => {
    const { earned, totalMarks } = getQuizScore();
    const pct = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : 0;
    saveQuizResult(pct, earned, totalMarks);
    posthog.capture("quiz_completed", { user: userName, subject: selectedSubject, topic: selectedTopic, score: earned, percentage: pct });
    if (pct >= 60) {
      const key = getTopicKey();
      const newCompleted = { ...completedTopics, [key]: true };
      setCompletedTopics(newCompleted);
      saveProgress(newCompleted);
    }
    setQuizFinished(true);
  }, [getQuizScore, saveQuizResult, getTopicKey, completedTopics, saveProgress, userName, selectedSubject, selectedTopic]);

  const retakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted({});
    setQuizAssessments({});
    setQuizFinished(false);
    setCurrentQuizIndex(0);
    setRevealed({});
    setSelfScores({});
    setQuestions([]);
    fetchQuestions(selectedSubject, selectedTopic, selectedTier);
  };

  const selectSubject = (key) => {
    setSelectedSubject(key);
    posthog.capture("subject_selected", { user: userName, subject: key });
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
    setQuizAnswers({});
    setQuizSubmitted({});
    setQuizAssessments({});
    setQuizFinished(false);
    fetchQuestions(selectedSubject, topic, tier);
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
    setQuizAnswers({});
    setQuizSubmitted({});
    setQuizAssessments({});
    setQuizFinished(false);
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
        @keyframes georgiaSpin {
          0% { transform: rotate(0deg); animation-timing-function: linear; }
          83.3% { transform: rotate(5760deg); animation-timing-function: ease-out; }
          100% { transform: rotate(6120deg); }
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
              <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden" }}>
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "contain",
                    display: "block",
                    animation: georgiaZoom
                      ? "georgiaSpin 3s both"
                      : avatarSpin ? "avatarSpinScale 0.9s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                  }}
                />
              </div>
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
                <span
                  style={{
                    color: heartPhase === "afterglow" ? "#4ECDC4" : "#4ECDC4",
                    textShadow: heartPhase === "afterglow" ? "0 0 20px rgba(78,205,196,0.6), 0 0 40px rgba(78,205,196,0.3)" : "none",
                    transition: "text-shadow 0.4s ease",
                  }}
                >
                  {displayName}
                </span>
                {heartPhase === "beating" && (
                  <>
                    <style>{`
                      @keyframes heartBeat3 {
                        0% { transform: scale(1); }
                        8% { transform: scale(1.3); }
                        16% { transform: scale(1); }
                        30% { transform: scale(1.5); }
                        40% { transform: scale(1); }
                        56% { transform: scale(1.8); }
                        68% { transform: scale(1); }
                        100% { transform: scale(1); }
                      }
                      @keyframes glowRing {
                        0% { box-shadow: 0 0 4px rgba(78,205,196,0.2); }
                        30% { box-shadow: 0 0 12px rgba(78,205,196,0.4); }
                        56% { box-shadow: 0 0 24px rgba(78,205,196,0.6), 0 0 48px rgba(78,205,196,0.2); }
                        100% { box-shadow: 0 0 4px rgba(78,205,196,0.1); }
                      }
                    `}</style>
                    <span
                      ref={heartRef}
                      style={{
                        display: "inline-block",
                        marginLeft: 8,
                        fontSize: 36,
                        animation: "heartBeat3 0.6s ease-in-out both",
                        position: "relative",
                        borderRadius: "50%",
                      }}
                    >
                      <span style={{ animation: "glowRing 0.6s ease-in-out both", borderRadius: "50%", display: "inline-block" }}>
                        ❤️
                      </span>
                    </span>
                  </>
                )}
                {(heartPhase === "explode" || heartPhase === "rain") && (
                  <span ref={heartRef} style={{ display: "inline-block", marginLeft: 8, fontSize: 36, opacity: 0 }}>❤️</span>
                )}
              </h1>

              {/* Full-screen color flash on page entry */}
              {colorFlash && (
                <div
                  onAnimationEnd={() => setColorFlash(false)}
                  style={{
                    position: "fixed", inset: 0, zIndex: 9997, pointerEvents: "none",
                    background: userName === "harry" ? "#00BFFF" : "#FF10F0",
                    animation: "colorFlashOut 1s ease-out both",
                  }}
                />
              )}
              <style>{`@keyframes colorFlashOut { 0%{opacity:0.45;} 100%{opacity:0;} }`}</style>

              {/* Screen flash on explosion */}
              {heartPhase === "explode" && (
                <div style={{
                  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                  background: "white", opacity: 0.15, zIndex: 9998, pointerEvents: "none",
                  animation: "flashOut 0.15s ease-out both",
                }} />
              )}
              <style>{`@keyframes flashOut { 0%{opacity:0.15;} 100%{opacity:0;} }`}</style>

              {/* Afterglow shimmer where heart was */}
              {heartPhase === "afterglow" && (() => {
                const rect = heartRef.current?.getBoundingClientRect();
                const cx = rect ? rect.left + rect.width / 2 : 0;
                const cy = rect ? rect.top + rect.height / 2 : 0;
                return cx ? (
                  <div style={{
                    position: "fixed", left: cx - 30, top: cy - 30, width: 60, height: 60,
                    borderRadius: "50%", pointerEvents: "none", zIndex: 9999,
                    background: "radial-gradient(circle, rgba(78,205,196,0.3) 0%, transparent 70%)",
                    animation: "shimmerOut 0.8s ease-out both",
                  }} />
                ) : null;
              })()}
              <style>{`@keyframes shimmerOut { 0%{opacity:1;transform:scale(1);} 100%{opacity:0;transform:scale(2);} }`}</style>

              {/* Particle container — particles are added imperatively via DOM for perf */}
              {heartPhase !== "idle" && heartPhase !== "done" && (
                <div
                  ref={heartParticleRef}
                  style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    pointerEvents: "none", zIndex: 9999, overflow: "hidden",
                  }}
                />
              )}
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
                          <span style={{ minWidth: 22, textAlign: "center", display: "inline-flex", justifyContent: "center" }}><SubjectIcon icon={subject.icon} size={14} /></span>
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

            {/* Personalised subject carousel */}
            <div style={{ marginBottom: 20 }}>
              <SubjectCarousel subjects={userSubjects} speed={28} />
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
              <div style={{ marginBottom: 12, lineHeight: 1 }}><SubjectIcon icon={subjectData.icon} size={42} /></div>
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
                    <div style={{ flexShrink: 0, lineHeight: 1 }}><SubjectIcon icon={branch.icon} size={36} /></div>
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
                  marginBottom: 12,
                  lineHeight: 1,
                }}
              >
                <SubjectIcon icon={activeIcon} size={42} />
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
                const topicKey = selectedBranch
                  ? `${selectedSubject}:${selectedBranch}:${topic}`
                  : `${selectedSubject}:${topic}`;
                const allScores = loadQuizScores();
                const topicScore = allScores[topicKey];
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {topicScore && (
                        <span style={{
                          fontSize: 11,
                          color: getScoreColor(topicScore.bestPct),
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          Best: {topicScore.bestPct}% · {topicScore.attempts} {topicScore.attempts === 1 ? "attempt" : "attempts"}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: isComplete ? "#2ECC71" : "rgba(240,237,230,0.3)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {isComplete ? "✅" : "→"}
                      </span>
                    </div>
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
                    {!quizMode && (
                      <button
                        onClick={() => {
                          if (totalRevealed === totalQuestions) {
                            setRevealed({});
                          } else {
                            const allRevealed = {};
                            questions.forEach((_, i) => (allRevealed[i] = true));
                            setRevealed(allRevealed);
                          }
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
                        {totalRevealed === totalQuestions ? "Hide All" : "Reveal All"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!quizMode) {
                          setQuizMode(true);
                          setCurrentQuizIndex(0);
                          setQuizAnswers({});
                          setQuizSubmitted({});
                          setQuizAssessments({});
                          setQuizFinished(false);
                          setRevealed({});
                          posthog.capture("quiz_started", { user: userName, subject: selectedSubject, topic: selectedTopic });
                        } else {
                          setQuizMode(false);
                          setQuizFinished(false);
                        }
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
                        transition: "all 0.25s ease",
                        boxShadow: "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!quizMode) {
                          e.target.style.background = "#4ECDC4";
                          e.target.style.color = "#0D0C0B";
                          e.target.style.borderColor = "#4ECDC4";
                          e.target.style.boxShadow = "0 0 20px rgba(78,205,196,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!quizMode) {
                          e.target.style.background = "rgba(255,255,255,0.05)";
                          e.target.style.color = "rgba(240,237,230,0.6)";
                          e.target.style.borderColor = "rgba(255,255,255,0.08)";
                          e.target.style.boxShadow = "none";
                        }
                      }}
                    >
                      {quizMode ? "✕ Exit Quiz" : "⚡ Quiz Mode"}
                    </button>
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
                    marginBottom: 20,
                    lineHeight: 1,
                    animation: "pulse 1.5s ease infinite",
                  }}
                >
                  <SubjectIcon icon={activeIcon} size={48} />
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

            {/* Quiz Mode — Results Screen */}
            {quizMode && quizFinished && questions.length > 0 && (() => {
              const { earned, totalMarks } = getQuizScore();
              const pct = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : 0;
              const grade = getGrade(pct);
              const passed = pct >= 60;
              const scoreColor = getScoreColor(pct);
              return (
                <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
                  <div style={{
                    textAlign: "center",
                    padding: "40px 24px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${scoreColor}30`,
                    borderRadius: 20,
                    marginBottom: 28,
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{passed ? "🎉" : "💪"}</div>
                    <div style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: scoreColor,
                      fontFamily: "'Syne', sans-serif",
                      marginBottom: 4,
                    }}>
                      {earned}/{totalMarks} marks — {pct}%
                    </div>
                    <div style={{
                      fontSize: 18,
                      color: "rgba(240,237,230,0.6)",
                      fontFamily: "'DM Sans', sans-serif",
                      marginBottom: 16,
                    }}>
                      Grade {grade}
                    </div>
                    <div style={{
                      fontSize: 15,
                      color: passed ? "#2ECC71" : "#F39C12",
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {passed ? "Passed ✅ — topic marked complete!" : "Not quite yet — try again 💪"}
                    </div>
                  </div>

                  {/* Per-question breakdown */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,230,0.6)", marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
                      Question Breakdown
                    </div>
                    {questions.map((q, i) => {
                      const a = quizAssessments[i];
                      const qEarned = a === "full" ? q.marks : a === "partial" ? Math.round(q.marks / 2) : 0;
                      const aColor = a === "full" ? "#2ECC71" : a === "partial" ? "#F39C12" : "#E74C3C";
                      const aLabel = a === "full" ? "✅ Got it" : a === "partial" ? "🟡 Partially" : "❌ Missed it";
                      return (
                        <div key={i} style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 12,
                          padding: 18,
                          marginBottom: 10,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: activeColor || "#4ECDC4", fontFamily: "'JetBrains Mono', monospace" }}>Q{i + 1} [{q.marks} marks]</span>
                            <span style={{ fontSize: 12, color: aColor, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{aLabel} — {qEarned}/{q.marks}</span>
                          </div>
                          <p style={{ fontSize: 13, color: "rgba(240,237,230,0.7)", margin: "0 0 10px 0", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{q.question}</p>
                          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.4)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your answer:</div>
                          <p style={{ fontSize: 13, color: "rgba(240,237,230,0.6)", margin: "0 0 10px 0", lineHeight: 1.5, fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>{quizAnswers[i] || "(no answer)"}</p>
                          <div style={{ fontSize: 11, color: "#2ECC71", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>Model answer:</div>
                          <p style={{ fontSize: 13, color: "rgba(240,237,230,0.8)", margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap" }}>{q.model_answer}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={retakeQuiz}
                      style={{
                        background: (activeColor || "#4ECDC4") + "15",
                        color: activeColor || "#4ECDC4",
                        border: `1px solid ${(activeColor || "#4ECDC4")}30`,
                        borderRadius: 10,
                        padding: "12px 24px",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Take Another Quiz
                    </button>
                    <button
                      onClick={() => { if (selectedBranch) goToBranchTopics(); else goToTopics(); }}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "12px 24px",
                        color: "rgba(240,237,230,0.6)",
                        cursor: "pointer",
                        fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Back to Topics
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Quiz Mode — Active Quiz */}
            {quizMode && !quizFinished && questions.length > 0 && (() => {
              const { earned: runEarned, totalSoFar } = getQuizScoresSoFar();
              const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
              const assessedCount = Object.keys(quizAssessments).length;
              const submittedCount = Object.keys(quizSubmitted).length;
              const allDone = assessedCount === questions.length;
              const runPct = totalSoFar > 0 ? Math.round((runEarned / totalSoFar) * 100) : 0;
              const q = questions[currentQuizIndex];
              const isSubmitted = !!quizSubmitted[currentQuizIndex];
              const isAssessed = !!quizAssessments[currentQuizIndex];

              return (
                <div>
                  {/* Sticky progress panel */}
                  <div style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: "#0D0C0B",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    padding: "14px 0",
                    marginBottom: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,237,230,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                        Question {currentQuizIndex + 1} of {questions.length}
                      </span>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {assessedCount > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(runPct), fontFamily: "'JetBrains Mono', monospace" }}>
                            {runEarned}/{totalSoFar} marks · {runPct}%
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "rgba(240,237,230,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {questions.length - submittedCount} left
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ width: `${(assessedCount / questions.length) * 100}%`, height: "100%", background: activeColor || "#4ECDC4", borderRadius: 2, transition: "width 0.4s ease" }} />
                    </div>
                    {/* Question nav dots */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {questions.map((_, i) => {
                        const dotAssessed = !!quizAssessments[i];
                        const dotSubmitted = !!quizSubmitted[i];
                        const isCurrent = i === currentQuizIndex;
                        let dotBg = "rgba(255,255,255,0.08)";
                        if (dotAssessed) {
                          const a = quizAssessments[i];
                          dotBg = a === "full" ? "#2ECC71" : a === "partial" ? "#F39C12" : "#E74C3C";
                        } else if (dotSubmitted) {
                          dotBg = (activeColor || "#4ECDC4") + "60";
                        }
                        return (
                          <div
                            key={i}
                            onClick={() => setCurrentQuizIndex(i)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: dotBg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              border: isCurrent ? `2px solid ${activeColor || "#4ECDC4"}` : "2px solid transparent",
                              fontSize: 10,
                              fontWeight: 600,
                              color: dotAssessed || dotSubmitted ? "#fff" : "rgba(240,237,230,0.3)",
                              fontFamily: "'JetBrains Mono', monospace",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {i + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current question */}
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    padding: 28,
                    marginBottom: 16,
                  }}>
                    {/* Question header */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                      <span style={{ background: (activeColor || "#4ECDC4") + "20", color: activeColor || "#4ECDC4", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>Q{currentQuizIndex + 1}</span>
                      <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(240,237,230,0.6)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>[{q.marks} marks]</span>
                      <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(240,237,230,0.5)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{q.command_word}</span>
                    </div>

                    <p style={{ fontSize: 16, lineHeight: 1.65, color: "#F0EDE6", fontFamily: "'DM Sans', sans-serif", margin: "0 0 20px 0", fontWeight: 500 }}>
                      {q.question}
                    </p>

                    {/* Answer textarea */}
                    <textarea
                      value={quizAnswers[currentQuizIndex] || ""}
                      onChange={(e) => setQuizAnswers((prev) => ({ ...prev, [currentQuizIndex]: e.target.value }))}
                      disabled={isSubmitted}
                      placeholder="Type your answer here..."
                      style={{
                        width: "100%",
                        minHeight: q.marks >= 6 ? 160 : q.marks >= 3 ? 100 : 70,
                        background: isSubmitted ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isSubmitted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 10,
                        padding: 14,
                        color: "#F0EDE6",
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: "'DM Sans', sans-serif",
                        resize: "vertical",
                        outline: "none",
                        opacity: isSubmitted ? 0.7 : 1,
                      }}
                    />

                    {/* Submit button */}
                    {!isSubmitted && (
                      <button
                        onClick={() => {
                          setQuizSubmitted((prev) => ({ ...prev, [currentQuizIndex]: true }));
                        }}
                        disabled={!quizAnswers[currentQuizIndex]?.trim()}
                        style={{
                          marginTop: 12,
                          background: quizAnswers[currentQuizIndex]?.trim() ? (activeColor || "#4ECDC4") + "15" : "rgba(255,255,255,0.03)",
                          color: quizAnswers[currentQuizIndex]?.trim() ? (activeColor || "#4ECDC4") : "rgba(240,237,230,0.25)",
                          border: `1px solid ${quizAnswers[currentQuizIndex]?.trim() ? (activeColor || "#4ECDC4") + "30" : "rgba(255,255,255,0.06)"}`,
                          borderRadius: 10,
                          padding: "10px 24px",
                          cursor: quizAnswers[currentQuizIndex]?.trim() ? "pointer" : "default",
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Submit Answer
                      </button>
                    )}

                    {/* Model answer comparison (shown after submit) */}
                    {isSubmitted && (
                      <div style={{ marginTop: 16, animation: "fadeSlideUp 0.3s ease both" }}>
                        <div style={{
                          background: "rgba(46, 204, 113, 0.06)",
                          border: "1px solid rgba(46, 204, 113, 0.15)",
                          borderRadius: 12,
                          padding: 20,
                          marginBottom: 12,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#2ECC71", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>Model Answer</div>
                          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(240,237,230,0.85)", fontFamily: "'DM Sans', sans-serif", margin: 0, whiteSpace: "pre-wrap" }}>{q.model_answer}</p>
                        </div>
                        <div style={{
                          background: "rgba(243, 156, 18, 0.06)",
                          border: "1px solid rgba(243, 156, 18, 0.15)",
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 16,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#F39C12", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>Examiner Tip</div>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(240,237,230,0.7)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>{q.examiner_tip}</p>
                        </div>

                        {/* Self-assessment */}
                        {!isAssessed ? (
                          <div style={{ animation: "fadeSlideUp 0.3s ease both" }}>
                            <div style={{ fontSize: 13, color: "rgba(240,237,230,0.5)", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Did you get it right?</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {[
                                { key: "full", label: "✅ Got it", desc: `${q.marks}/${q.marks} marks`, color: "#2ECC71" },
                                { key: "partial", label: "🟡 Partially", desc: `${Math.round(q.marks / 2)}/${q.marks} marks`, color: "#F39C12" },
                                { key: "missed", label: "❌ Missed it", desc: `0/${q.marks} marks`, color: "#E74C3C" },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => {
                                    setQuizAssessments((prev) => ({ ...prev, [currentQuizIndex]: opt.key }));
                                    if (currentQuizIndex < questions.length - 1) {
                                      setTimeout(() => setCurrentQuizIndex((prev) => prev + 1), 400);
                                    }
                                  }}
                                  style={{
                                    background: opt.color + "10",
                                    border: `1px solid ${opt.color}30`,
                                    borderRadius: 10,
                                    padding: "10px 16px",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: opt.color,
                                    fontFamily: "'DM Sans', sans-serif",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  {opt.label}<br />
                                  <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: getScoreColor(quizAssessments[currentQuizIndex] === "full" ? 100 : quizAssessments[currentQuizIndex] === "partial" ? 50 : 0), fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                            {quizAssessments[currentQuizIndex] === "full" ? `✅ Got it — ${q.marks}/${q.marks} marks` : quizAssessments[currentQuizIndex] === "partial" ? `🟡 Partially — ${Math.round(q.marks / 2)}/${q.marks} marks` : `❌ Missed it — 0/${q.marks} marks`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nav buttons + Finish */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 10 }}>
                    <button
                      onClick={() => setCurrentQuizIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuizIndex === 0}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        padding: "8px 18px",
                        color: currentQuizIndex === 0 ? "rgba(240,237,230,0.2)" : "rgba(240,237,230,0.6)",
                        cursor: currentQuizIndex === 0 ? "default" : "pointer",
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ← Previous
                    </button>
                    {allDone && (
                      <button
                        onClick={finishQuiz}
                        style={{
                          background: "rgba(46, 204, 113, 0.12)",
                          border: "1px solid rgba(46, 204, 113, 0.25)",
                          borderRadius: 8,
                          padding: "8px 20px",
                          color: "#2ECC71",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Finish Quiz
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentQuizIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentQuizIndex === questions.length - 1}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        padding: "8px 18px",
                        color: currentQuizIndex === questions.length - 1 ? "rgba(240,237,230,0.2)" : "rgba(240,237,230,0.6)",
                        cursor: currentQuizIndex === questions.length - 1 ? "default" : "pointer",
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              );
            })()}

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
