import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { ArrowLeft, ChevronRight, RefreshCw, Zap, SlidersHorizontal, Play, Info, X as XIcon } from "lucide-react";
import { USER_PROFILES, getSubjectsForUser } from "./userConfig";
import { EFFECTS, animateParticles } from "./avatarEffects";
import SubjectCarousel from "./SubjectCarousel";
import { playSound, playEasterEggSound, playReward } from "./soundEffects";
import SubjectIcon from "./components/SubjectIcon";
import SubjectCard from "./components/SubjectCard";
import QuestionCard, { AnswerBlocks, QuestionMeta } from "./components/QuestionCard";
import TopicList from "./components/TopicList";
import TopicPicker from "./components/TopicPicker";
import ThisWeekCard from "./components/ThisWeekCard";
import StatRow from "./components/StatRow";
import QuizResults, { ASSESSMENT } from "./components/QuizResults";
import RewardToastHost from "./components/RewardToast";
import Confetti from "./components/Confetti";
import LevelUpCard from "./components/LevelUpCard";
import { awardXp, getLevel, readXp, readDaily, recordDailyQuiz } from "./rewards";
import { countMastered, getIncludedTopics, hasExamPicker, readExamTopics } from "./components/topicInclusion";
import { localDateKey } from "./components/motion";

// "#RRGGBB" + alpha → rgba(), used to retint the existing effects to the user's accent.
function hexA(hex, a) {
  const h = (hex || "#4ECDC4").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function LoadingDots() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span style={{ fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums", minWidth: 24, display: "inline-block" }}>{dots}</span>;
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
  if (pct >= 70) return "#4ADE80";
  if (pct >= 40) return "#FBBF24";
  return "#F87171";
}

// ── Motivational message ─────────────────────────────────────

function getMotivationalMessage(completedCount, totalTopics, streakCount, practiceTotal) {
  const pct = totalTopics > 0 ? completedCount / totalTopics : 0;
  if (pct >= 1) return "You've covered every topic. Exam-ready.";
  if (pct >= 0.75) return "Nearly there. The finish line is in sight.";
  if (pct >= 0.5) return "Halfway through. Solid momentum.";
  if (pct >= 0.25) return "Good start. Keep the consistency going.";
  if (practiceTotal >= 10) return "Nice work on the practice questions.";
  if (streakCount >= 2) return `${streakCount} days in a row. Building a great habit.`;
  if (completedCount > 0) return "Every topic you cover gets you closer. Keep going.";
  return "Pick a subject and start with whatever feels right.";
}

// Effective streak: only counts if the last activity was today or yesterday.
function liveStreakCount(streak) {
  if (!streak?.lastDate) return 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  return streak.lastDate === today || streak.lastDate === yesterday ? streak.count : 0;
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
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [completedTopics, setCompletedTopics] = useState({});
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selfScores, setSelfScores] = useState({});
  const quizCardRef = useRef(null);
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

  // ── Reward layer state ─────────────────────────────────────
  const accent = userProfile.accent || "#4ECDC4";
  const [xpTotal, setXpTotal] = useState(() => readXp(userName).total);
  const [dailyQuizzes, setDailyQuizzes] = useState(() => readDaily(userName, localDateKey()).quizzes);
  const [combo, setCombo] = useState(0);
  const [levelUp, setLevelUp] = useState(null);
  const [confettiBursts, setConfettiBursts] = useState([]);
  const [pendingCelebration, setPendingCelebration] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, setExamTopicsVersion] = useState(0);
  const toastRef = useRef(null);
  const rewardedReveals = useRef(new Set());
  const celebratedRef = useRef(null);

  const fireConfetti = useCallback((origin, color) => {
    setConfettiBursts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, origin, colors: [color || accent, "#4ADE80", "#F2F1EC"] },
    ]);
  }, [accent]);

  // Awards XP, shows the toast from the element that caused it, and handles level-ups.
  const grantXp = useCallback((reason, amount, originEl) => {
    if (!amount) return;
    const r = awardXp(userName, reason, amount);
    setXpTotal(r.total);
    toastRef.current?.show(amount, originEl || null);
    if (r.levelAfter > r.levelBefore) {
      setLevelUp({ id: Date.now(), level: getLevel(r.total) });
      fireConfetti(null);
    }
  }, [userName, fireConfetti]);

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
      ring.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:0;height:0;border-radius:50%;border:2px solid ${hexA(accent, 0.6)};transform:translate(-50%,-50%);animation:shockwave 0.8s ease-out both;pointer-events:none;`;
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

    // Phase 4: afterglow, name glows in the user accent
    t(() => setHeartPhase("afterglow"), 3200);

    // Cleanup
    t(() => {
      setHeartPhase("done");
      if (heartParticleRef.current) heartParticleRef.current.innerHTML = "";
    }, 4200);

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let extendedTo = 0;
    try {
      const key = `${userName}:streak`;
      const existing = JSON.parse(localStorage.getItem(key) || '{"lastDate":null,"count":0}');
      const today = new Date().toISOString().split("T")[0];
      if (existing.lastDate === today) return;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (existing.lastDate === yesterday) {
        existing.count += 1;
        extendedTo = existing.count;
      } else {
        existing.count = 1;
      }
      existing.lastDate = today;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    if (extendedTo > 0) grantXp("streak_extended", Math.min(50, 10 * extendedTo), null);
  }, [userName, grantXp]);

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

  const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

  const getCacheKey = (subject, topic, tier, branch) => {
    const parts = ["cache", userName, subject, topic];
    if (branch) parts.push(branch);
    if (tier) parts.push(tier);
    return parts.join(":").replace(/\s+/g, "-").toLowerCase();
  };

  const fetchQuestions = async (subject, topic, tier, { skipCache = false } = {}) => {
    setLoading(true);
    setError(null);
    setLoadedFromCache(false);

    const cacheKey = getCacheKey(subject, topic, tier, selectedBranch);

    // Check cache (unless skipping)
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL && Array.isArray(data) && data.length > 0) {
            setQuestions(data);
            setLoadedFromCache(true);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic,
          tier,
          board: userSubjects[subject]?.board || userProfile.board,
          branch: selectedBranch || undefined,
          spec: userSubjects[subject]?.spec,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setQuestions(data);

      // Save to cache
      try { localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}

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

  // Background pre-fetch uncached topics for a subject (only topics included in the user's exam)
  const prefetchSubjectTopics = useCallback((subjectKey) => {
    const subject = userSubjects[subjectKey];
    if (!subject) return;
    const tier = subject.hasTiers ? tierLabels[0] : null;

    const topics = getIncludedTopics(userName, subjectKey, subject);

    // Fire off uncached topics quietly after a short delay
    let delay = 800;
    topics.forEach(({ topic, branchKey: branch }) => {
      const key = getCacheKey(subjectKey, topic, tier, branch);
      try { if (localStorage.getItem(key)) return; } catch {}
      setTimeout(() => {
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subjectKey,
            topic,
            tier,
            board: subject.board || userProfile.board,
            branch: branch || undefined,
            spec: subject.spec,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
            }
          })
          .catch(() => {});
      }, delay);
      delay += 1500; // stagger to avoid hammering the API
    });
  }, [userName, userSubjects, userProfile.board, tierLabels]);

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

  const fetchPracticeQuestion = async (questionIndex, originEl) => {
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
          board: userSubjects[selectedSubject]?.board || userProfile.board,
          branch: selectedBranch || undefined,
          spec: userSubjects[selectedSubject]?.spec,
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
      grantXp("practice_generated", 3, originEl);
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

  const finishQuiz = useCallback((originEl) => {
    const { earned, totalMarks } = getQuizScore();
    const pct = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : 0;
    saveQuizResult(pct, earned, totalMarks);
    posthog.capture("quiz_completed", { user: userName, subject: selectedSubject, topic: selectedTopic, score: earned, percentage: pct });
    const key = getTopicKey();
    const firstClear = pct >= 60 && !completedTopics[key];
    if (pct >= 60) {
      const newCompleted = { ...completedTopics, [key]: true };
      setCompletedTopics(newCompleted);
      saveProgress(newCompleted);
    }
    setQuizFinished(true);

    // Rewards (all triggered by finishing, never on load)
    if (pct >= 60) grantXp("quiz_passed", 25, originEl);
    if (firstClear) {
      const subj = userSubjects[selectedSubject];
      const color = (selectedBranch && subj?.branches?.[selectedBranch]?.color) || subj?.color;
      grantXp("topic_cleared", 50, originEl);
      playReward();
      fireConfetti(null, color);
    }
    const daily = recordDailyQuiz(userName, localDateKey());
    setDailyQuizzes(daily.quizzes);
    if (daily.justReachedGoal) grantXp("daily_goal", 30, originEl);
    setPendingCelebration(pct >= 60 ? { id: Date.now() } : null);
  }, [getQuizScore, saveQuizResult, getTopicKey, completedTopics, saveProgress, userName, selectedSubject, selectedTopic, selectedBranch, userSubjects, grantXp, fireConfetti]);

  const retakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted({});
    setQuizAssessments({});
    setQuizFinished(false);
    setCurrentQuizIndex(0);
    setRevealed({});
    setSelfScores({});
    setCombo(0);
    setQuestions([]);
    fetchQuestions(selectedSubject, selectedTopic, selectedTier, { skipCache: true });
  };

  // Quiz self-assessment sound + visual feedback
  const playAssessmentFeedback = useCallback((type, buttonEl) => {
    // --- Sound ---
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      if (type === "full") {
        // Triumphant ascending chime: C5-E5-G5
        [523, 659, 784].forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25, ac.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + i * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(ac.currentTime + i * 0.08);
          osc.stop(ac.currentTime + i * 0.08 + 0.3);
        });
      } else if (type === "partial") {
        // Gentle two-note ascending chime
        [392, 440].forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, ac.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + i * 0.12 + 0.3);
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.start(ac.currentTime + i * 0.12);
          osc.stop(ac.currentTime + i * 0.12 + 0.35);
        });
      } else {
        // Soft descending womp
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(330, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ac.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.4);
      }
    } catch {}

    if (!buttonEl) return;

    // --- Button animation ---
    if (type === "full") {
      buttonEl.style.transition = "transform 0.15s cubic-bezier(0.4,0,0.2,1)";
      buttonEl.style.transform = "scale(1.15)";
      setTimeout(() => { buttonEl.style.transform = "scale(1)"; }, 150);
    } else if (type === "partial") {
      buttonEl.style.transition = "transform 0.1s ease";
      buttonEl.style.transform = "rotate(3deg)";
      setTimeout(() => { buttonEl.style.transform = "rotate(-2deg)"; }, 100);
      setTimeout(() => { buttonEl.style.transform = "rotate(0deg)"; }, 200);
    } else {
      const orig = buttonEl.style.transform || "";
      [0, 60, 120, 180, 240, 300].forEach((ms, i) => {
        setTimeout(() => {
          buttonEl.style.transform = i % 2 === 0 ? "translateX(-3px)" : "translateX(3px)";
        }, ms);
      });
      setTimeout(() => { buttonEl.style.transform = orig; }, 360);
    }

    // --- Card border pulse ---
    const card = quizCardRef.current;
    if (card) {
      const pulseColor = type === "full" ? "#4ADE80" : type === "partial" ? "#FBBF24" : "#F87171";
      card.style.transition = "box-shadow 0.15s ease";
      card.style.boxShadow = `0 0 20px ${pulseColor}40, inset 0 0 20px ${pulseColor}10`;
      setTimeout(() => { card.style.boxShadow = "none"; }, 400);
    }

    // --- Floating emoji ---
    const rect = buttonEl.getBoundingClientRect();
    const emoji = type === "full" ? "🔥" : type === "partial" ? "💪" : "📚";
    const floater = document.createElement("div");
    floater.textContent = emoji;
    floater.style.cssText = `position:fixed;left:${rect.left + rect.width / 2 - 12}px;top:${rect.top - 10}px;font-size:24px;pointer-events:none;z-index:10000;animation:floatUp 0.8s ease-out both;`;
    const style = document.createElement("style");
    style.textContent = `@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1);}100%{opacity:0;transform:translateY(-50px) scale(1.3);}}`;
    document.body.appendChild(style);
    document.body.appendChild(floater);
    setTimeout(() => { floater.remove(); style.remove(); }, 900);

    // --- Particles (full & partial only) ---
    if (type !== "missed") {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const count = type === "full" ? 18 : 10;
      const emojis = type === "full" ? ["✨", "⭐", "✨", "⭐", "✨"] : ["✨", "⭐"];
      const color = type === "full" ? "#4ADE80" : "#FBBF24";
      const container = document.createElement("div");
      container.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;overflow:hidden;`;
      document.body.appendChild(container);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 40 + Math.random() * 80;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;
        const sz = 8 + Math.random() * 10;
        const dur = 0.5 + Math.random() * 0.3;
        const kf = `af${i}_${Date.now()}`;
        const s = document.createElement("style");
        s.textContent = `@keyframes ${kf}{0%{transform:translate(0,0) scale(1);opacity:1;}100%{transform:translate(${tx}px,${ty}px) scale(0.3);opacity:0;}}`;
        container.appendChild(s);
        const p = document.createElement("span");
        p.textContent = emojis[i % emojis.length];
        p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;font-size:${sz}px;animation:${kf} ${dur}s ease-out both;pointer-events:none;`;
        container.appendChild(p);
      }
      setTimeout(() => container.remove(), 1000);
    }
  }, []);

  const selectSubject = (key) => {
    setSelectedSubject(key);
    setPickerOpen(false);
    posthog.capture("subject_selected", { user: userName, subject: key });
    const subject = userSubjects[key];
    if (subject.isCombined) {
      setScreen("branches");
    } else {
      setScreen("topics");
    }
    // Pre-fetch uncached topics in the background
    prefetchSubjectTopics(key);
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
    setCombo(0);
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


  const totalRevealed = Object.values(revealed).filter(Boolean).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (totalRevealed / totalQuestions) * 100 : 0;

  // ── Reveal, quiz and celebration handlers ──────────────────
  const rewardRevealOnce = (i) => {
    const q = questions[i];
    if (!q) return false;
    const k = `${getTopicKey()}|${q.question}`;
    if (rewardedReveals.current.has(k)) return false;
    rewardedReveals.current.add(k);
    return true;
  };

  const handleReveal = (i, originEl) => {
    const willReveal = !revealed[i];
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));
    if (willReveal && rewardRevealOnce(i)) grantXp("reveal_answer", 2, originEl);
  };

  const handleRevealAll = (originEl) => {
    if (totalRevealed === totalQuestions) {
      setRevealed({});
      return;
    }
    const allRevealed = {};
    let fresh = 0;
    questions.forEach((_, i) => {
      allRevealed[i] = true;
      if (!revealed[i] && rewardRevealOnce(i)) fresh += 1;
    });
    setRevealed(allRevealed);
    if (fresh > 0) grantXp("reveal_answer", 2 * fresh, originEl);
  };

  const toggleQuizMode = () => {
    if (!quizMode) {
      setQuizMode(true);
      setCurrentQuizIndex(0);
      setQuizAnswers({});
      setQuizSubmitted({});
      setQuizAssessments({});
      setQuizFinished(false);
      setRevealed({});
      setCombo(0);
      posthog.capture("quiz_started", { user: userName, subject: selectedSubject, topic: selectedTopic });
    } else {
      setQuizMode(false);
      setQuizFinished(false);
    }
  };

  const assessQuestion = (optKey, buttonEl) => {
    const q = questions[currentQuizIndex];
    if (!q || quizAssessments[currentQuizIndex]) return;
    playAssessmentFeedback(optKey, buttonEl);
    setQuizAssessments((prev) => ({ ...prev, [currentQuizIndex]: optKey }));
    if (optKey === "full") {
      const next = combo + 1;
      setCombo(next);
      grantXp("quiz_got_it", 2 * q.marks + (next >= 3 ? 5 : 0), buttonEl);
      setTimeout(playReward, 260);
    } else {
      setCombo(0);
      if (optKey === "partial") grantXp("quiz_partially", q.marks, buttonEl);
    }
    if (currentQuizIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuizIndex((prev) => prev + 1), 600);
    }
  };

  // Small burst from the grade once per finished quiz (guarded against StrictMode double effects)
  const handleGradeMounted = (gradeEl) => {
    if (!pendingCelebration || celebratedRef.current === pendingCelebration.id || !gradeEl) return;
    celebratedRef.current = pendingCelebration.id;
    const r = gradeEl.getBoundingClientRect();
    fireConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, activeColor);
  };

  const qualLabel = (userProfile.board || "").includes("IGCSE") ? "IGCSEs" : "GCSEs";

  // Sticky quiz header height, measured (it wraps when the combo chip or score appears, and includes the rail)
  const quizHeaderRef = useRef(null);
  const [quizHeaderH, setQuizHeaderH] = useState(0);
  const quizActive = quizMode && !quizFinished && questions.length > 0;
  useEffect(() => {
    const el = quizHeaderRef.current;
    if (!quizActive || !el) return undefined;
    const measure = () => setQuizHeaderH(Math.ceil(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [quizActive]);

  // When the quiz moves to another question, bring its card fully clear of the sticky header
  useEffect(() => {
    if (!quizActive) return;
    const card = quizCardRef.current;
    if (!card) return;
    if (card.getBoundingClientRect().top < quizHeaderH + 8) {
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuizIndex, quizActive]);

  return (
    <div
      style={{
        "--accent": accent,
        minHeight: "100vh",
        background: "var(--bg-0)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
        position: "relative",
        overflowX: "clip",
        animation: screenShake ? "screenShake 0.35s ease-out" : "none",
      }}
    >
      <style>{`
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
        .quiz-textarea:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent) !important; box-shadow: var(--ring); }
        .quiz-dot:focus-visible { box-shadow: var(--ring); }
        .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
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

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px", position: "relative" }}>
        {/* Header */}
        <header
          style={{
            padding: "24px 0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            borderBottom: "1px solid var(--line)",
            marginBottom: 32,
          }}
        >
          <div
            onClick={goHome}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
          >
            <div
              ref={avatarContainerRef}
              onClick={triggerAvatarEffect}
              style={{ position: "relative", cursor: "pointer", width: 60, height: 60, flexShrink: 0 }}
            >
              <div style={{ width: 60, height: 60, borderRadius: "var(--r-sm)", overflow: "hidden" }}>
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
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", fontFamily: "var(--font-display)", color: accent }}>
                  {displayName}'s
                </span>
                <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-3)", fontFamily: "var(--font-display)" }}>
                  {qualLabel}
                </span>
              </div>
              {userProfile.school && (
                <div className="small" style={{ color: "var(--text-3)", marginTop: 2 }}>
                  {[userProfile.school, userProfile.yearGroup, userProfile.board].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
          <nav aria-label="Account" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {screen !== "home" && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={goHome}>
                <ArrowLeft size={15} aria-hidden="true" /> All subjects
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>
              Switch user
            </button>
          </nav>
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
                  fontSize: "clamp(30px, 7vw, 40px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  margin: 0,
                  marginBottom: 10,
                  lineHeight: 1.15,
                  fontFamily: "var(--font-display)",
                }}
              >
                You've got this,{" "}
                <span
                  style={{
                    color: accent,
                    textShadow: heartPhase === "afterglow" ? `0 0 20px ${hexA(accent, 0.6)}, 0 0 40px ${hexA(accent, 0.3)}` : "none",
                    transition: "text-shadow var(--dur-slow) var(--ease)",
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
                        0% { box-shadow: 0 0 4px ${hexA(accent, 0.2)}; }
                        30% { box-shadow: 0 0 12px ${hexA(accent, 0.4)}; }
                        56% { box-shadow: 0 0 24px ${hexA(accent, 0.6)}, 0 0 48px ${hexA(accent, 0.2)}; }
                        100% { box-shadow: 0 0 4px ${hexA(accent, 0.1)}; }
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
                    background: accent,
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
                    background: `radial-gradient(circle, ${hexA(accent, 0.3)} 0%, transparent 70%)`,
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
                  fontSize: 15,
                  color: "var(--text-3)",
                  margin: 0,
                  lineHeight: 1.6,
                  maxWidth: 520,
                }}
              >
                AI-generated questions based on the most common patterns from the
                last 5 years of past papers. Focus on what's most likely to come up.
              </p>
            </div>

            <ThisWeekCard userName={userName} completedTopics={completedTopics} onContinue={selectSubject} />

            {/* Georgia head-start banner */}
            {userName === "georgia" && !bannerDismissed && (
              <div
                className="card"
                style={{
                  position: "relative",
                  marginBottom: 28,
                  padding: "18px 48px 18px 20px",
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: "var(--r-md)",
                  animation: "fadeSlideUp var(--dur-slow) var(--ease) both",
                  animationDelay: "0.15s",
                }}
              >
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setBannerDismissed(true);
                    try { localStorage.setItem(`${userName}:banner-dismissed`, "1"); } catch {}
                  }}
                  style={{ position: "absolute", top: 8, right: 8, minHeight: 32, width: 32, padding: 0, border: "none" }}
                >
                  <XIcon size={16} aria-hidden="true" />
                </button>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", margin: 0 }}>
                  You're in Year 8, and GCSEs don't start until Year 10, so you've got a proper
                  head start. Explore the topics now and by the time everyone else is scrambling
                  you'll already know what's coming. Want to use this for your current subjects instead?
                  Just say the word and we'll set it up for you.
                </p>
              </div>
            )}

            {/* Progress Dashboard */}
            {(() => {
              const perSubject = Object.entries(userSubjects).map(([key, subject]) => ({
                key, subject, ...countMastered(userName, key, subject, completedTopics),
              }));
              const totalTopics = perSubject.reduce((s, x) => s + x.total, 0);
              const completedCount = perSubject.reduce((s, x) => s + x.done, 0);
              const { streak, practiceStats, sessionStats } = dashboardStats;
              const streakNow = liveStreakCount(streak);
              const hasActivity = completedCount > 0 || streak.count > 0 || practiceStats.totalAttempts > 0 || sessionStats.totalSetsGenerated > 0 || xpTotal > 0;
              if (!hasActivity) return null;
              const motivationalMsg = getMotivationalMessage(completedCount, totalTopics, streakNow, practiceStats.totalAttempts);
              return (
                <section
                  className="card"
                  aria-label="Your progress"
                  style={{
                    marginBottom: 28,
                    padding: 22,
                    animation: "fadeSlideUp var(--dur-slow) var(--ease) both",
                    animationDelay: "0.1s",
                  }}
                >
                  <StatRow xpTotal={xpTotal} streakCount={streakNow} dailyQuizzes={dailyQuizzes} accent={accent} />

                  {/* Header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <h2 className="h3">Your progress</h2>
                    <span className="small" style={{ color: "var(--accent)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {completedCount} of {totalTopics} topics
                    </span>
                  </div>

                  {/* Overall progress bar */}
                  <div style={{ height: 6, background: "var(--line)", borderRadius: "var(--r-pill)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: `${totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0}%`, height: "100%", background: "var(--accent)", borderRadius: "var(--r-pill)", transition: "width var(--dur-slow) var(--ease)" }} />
                  </div>

                  {/* Motivational message */}
                  <p className="small" style={{ color: "var(--text-3)", margin: "0 0 18px 0" }}>
                    {motivationalMsg}
                  </p>

                  {/* Per-subject rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {perSubject.map(({ key, subject, done, total }) => {
                      const subjectPractice = practiceStats.bySubject[key] || 0;
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ minWidth: 20, display: "inline-flex", justifyContent: "center" }}><SubjectIcon icon={subject.icon} size={15} color={subject.color} /></span>
                          <span className="small" style={{ color: "var(--text-2)", minWidth: 0, flex: "0 1 140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {subject.name}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-3)", minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {done}/{total}
                          </span>
                          {subjectPractice > 0 && (
                            <span style={{ fontSize: 11, color: subject.color, minWidth: 24, fontVariantNumeric: "tabular-nums" }}>
                              +{subjectPractice}
                            </span>
                          )}
                          <div style={{ flex: 1, height: 4, background: "var(--line)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
                            <div style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%", height: "100%", background: subject.color, borderRadius: "var(--r-pill)", transition: "width var(--dur-slow) var(--ease)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary stats */}
                  {(sessionStats.totalSetsGenerated > 0 || practiceStats.totalAttempts > 0) && (
                    <div style={{ display: "flex", gap: 16, paddingTop: 14, borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
                      {sessionStats.totalSetsGenerated > 0 && (
                        <span style={{ fontSize: 12, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                          {sessionStats.totalSetsGenerated} question {sessionStats.totalSetsGenerated === 1 ? "set" : "sets"} generated
                        </span>
                      )}
                      {practiceStats.totalAttempts > 0 && (
                        <span style={{ fontSize: 12, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                          {practiceStats.totalAttempts} practice {practiceStats.totalAttempts === 1 ? "question" : "questions"} attempted
                        </span>
                      )}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Personalised subject carousel: only worth showing with 4+ distinct subjects */}
            {new Set(Object.values(userSubjects).map((s) => s.name)).size >= 4 && (
              <div style={{ marginBottom: 20 }}>
                <SubjectCarousel subjects={userSubjects} speed={28} />
              </div>
            )}

            <style>{`
              .subject-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
              .subject-grid--one { max-width: 560px; }
              @media (min-width: 540px) { .subject-grid--two, .subject-grid--many { grid-template-columns: repeat(2, 1fr); } }
              @media (min-width: 780px) { .subject-grid--many { grid-template-columns: repeat(3, 1fr); } }
            `}</style>
            <div
              className={`subject-grid ${
                Object.keys(userSubjects).length === 1 ? "subject-grid--one"
                : Object.keys(userSubjects).length === 2 ? "subject-grid--two"
                : "subject-grid--many"
              }`}
            >
              {Object.entries(userSubjects).map(([key, subject], i) => {
                const { done, total } = countMastered(userName, key, subject, completedTopics);
                return (
                  <SubjectCard
                    key={key}
                    subject={subject}
                    onClick={() => selectSubject(key)}
                    delay={i * 60}
                    done={done}
                    total={total}
                  />
                );
              })}
            </div>

            <div
              style={{
                marginTop: 48,
                padding: 18,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: "var(--bg-1)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line)",
                animation: "fadeSlideUp var(--dur-slow) var(--ease) both",
                animationDelay: "0.5s",
              }}
            >
              <Info size={16} color="var(--text-3)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="small" style={{ color: "var(--text-3)", margin: 0 }}>
                Questions are generated by AI based on exam board patterns. Always verify with
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
              <div style={{ marginBottom: 12, lineHeight: 1 }}><SubjectIcon icon={subjectData.icon} size={40} color={subjectData.color} /></div>
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  marginBottom: 8,
                  fontFamily: "var(--font-display)",
                }}
              >
                {subjectData.name}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-3)",
                  margin: 0,
                  fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums",
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
                      background: "var(--bg-1)",
                      border: `1px solid var(--line)`,
                      borderRadius: "var(--r-lg)",
                      padding: "28px 24px",
                      cursor: "pointer",
                      transition: "all var(--dur-slow) var(--ease)",
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
                      e.currentTarget.style.borderColor = "var(--line)";
                      e.currentTarget.style.background = "var(--bg-1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ flexShrink: 0, lineHeight: 1 }}><SubjectIcon icon={branch.icon} size={32} color={branch.color} /></div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 4,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {branch.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-3)",
                          fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {total} topics
                      </div>
                    </div>
                    {done > 0 && (
                      <div
                        style={{
                          background: "rgba(74, 222, 128, 0.15)",
                          color: "#4ADE80",
                          borderRadius: "var(--r-pill)",
                          padding: "3px 10px",
                          fontSize: 11,
                          fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums",
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
        {screen === "topics" && subjectData && (() => {
          const topicSource = activeBranch || subjectData;
          const pickerAvailable = !activeBranch && hasExamPicker(userName, selectedSubject);
          const stored = pickerAvailable ? readExamTopics(userName, selectedSubject) : null;
          const includedSet = stored ? new Set(stored) : null;
          const isExcluded = (t) => !!includedSet && !includedSet.has(t);
          const keyFor = (t) => (selectedBranch ? `${selectedSubject}:${selectedBranch}:${t}` : `${selectedSubject}:${t}`);
          const allScores = loadQuizScores();
          const includedTopics = activeBranch
            ? activeBranch.topics
            : getIncludedTopics(userName, selectedSubject, subjectData).map((x) => x.topic);
          const masteredCount = includedTopics.filter((t) => completedTopics[keyFor(t)]).length;
          return (
            <div style={{ "--accent": activeColor }}>
              <div style={{ marginBottom: 24, animation: "fadeSlideUp var(--dur-slow) var(--ease) both" }}>
                <div style={{ marginBottom: 14, lineHeight: 1 }}>
                  <SubjectIcon icon={activeIcon} size={40} color={activeColor} />
                </div>
                <h2 style={{ fontSize: 32, lineHeight: 1.1, fontWeight: 700, marginBottom: 12 }}>
                  {activeBranch ? `${subjectData.name}: ${activeBranch.name}` : subjectData.name}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <span
                    className="chip"
                    style={{
                      color: "var(--accent)",
                      borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                      whiteSpace: "normal",
                      lineHeight: 1.4,
                    }}
                  >
                    {subjectData.spec?.label || subjectData.board || userProfile.board}
                  </span>
                  {pickerAvailable && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-expanded={pickerOpen}
                      aria-controls={`topic-picker-${selectedSubject}`}
                      onClick={() => setPickerOpen((v) => !v)}
                    >
                      <SlidersHorizontal size={15} aria-hidden="true" /> Set up my exam
                    </button>
                  )}
                </div>
                <p className="small" style={{ color: "var(--text-3)", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                  {masteredCount} of {includedTopics.length} topics mastered. Pick a topic to generate high-probability exam questions.
                </p>
              </div>

              {pickerAvailable && (
                <TopicPicker
                  userName={userName}
                  subjectKey={selectedSubject}
                  subject={subjectData}
                  open={pickerOpen}
                  onDone={() => {
                    setPickerOpen(false);
                    setExamTopicsVersion((v) => v + 1);
                  }}
                />
              )}

              <TopicList
                source={topicSource}
                isExcluded={isExcluded}
                isComplete={(t) => !!completedTopics[keyFor(t)]}
                getScore={(t) => allScores[keyFor(t)]}
                onSelect={selectTopic}
              />
            </div>
          );
        })()}

        {/* TIER SCREEN */}
        {screen === "tier" && (
          <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: 8,
                fontFamily: "var(--font-display)",
              }}
            >
              Select tier
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-3)",
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
                    background: "var(--bg-1)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)",
                    padding: "24px",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "var(--font-body)",
                    transition: "all var(--dur) var(--ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = (activeColor || "#4ECDC4") + "50";
                    e.target.style.background = (activeColor || "#4ECDC4") + "10";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "var(--line)";
                    e.target.style.background = "var(--bg-1)";
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
          <div style={{ "--accent": activeColor || accent }}>
            {/* Breadcrumb & info */}
            <div style={{ marginBottom: 24, animation: "fadeSlideUp var(--dur-slow) var(--ease) both" }}>
              <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                <button type="button" className="link-btn" onClick={goToTopics}>
                  {subjectData?.name}
                </button>
                {activeBranch && (
                  <>
                    <ChevronRight size={14} color="var(--text-3)" aria-hidden="true" />
                    <button type="button" className="link-btn" onClick={goToBranchTopics}>
                      {activeBranch.name}
                    </button>
                  </>
                )}
                <ChevronRight size={14} color="var(--text-3)" aria-hidden="true" />
                <span className="small" style={{ color: "var(--text-2)" }} aria-current="page">
                  {selectedTopic}
                  {selectedTier ? ` · ${selectedTier}` : ""}
                </span>
              </nav>

              <div className="label" style={{ marginBottom: 6 }}>Most likely questions</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 700 }}>{selectedTopic}</h2>
                {subjectData?.spec?.code && (
                  <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                    {subjectData.spec.code}
                  </span>
                )}
              </div>

              {!loading && questions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
                    {loadedFromCache && (
                      <span className="small" style={{ color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Zap size={13} aria-hidden="true" /> Loaded instantly
                      </span>
                    )}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => fetchQuestions(selectedSubject, selectedTopic, selectedTier, { skipCache: true })}
                      style={{ color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}
                      title="Fetch fresh questions from the API"
                    >
                      <RefreshCw size={13} aria-hidden="true" /> Refresh questions
                    </button>
                  </div>

                  {!quizMode && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ flex: 1, height: 4, background: "var(--line)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", borderRadius: "var(--r-pill)", transition: "width var(--dur-slow) var(--ease)" }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        {totalRevealed}/{totalQuestions} revealed
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {!quizMode && (
                      <button type="button" className="btn btn-ghost" onClick={(e) => handleRevealAll(e.currentTarget)}>
                        {totalRevealed === totalQuestions ? "Hide all" : "Reveal all"}
                      </button>
                    )}
                    <button type="button" className={quizMode ? "btn btn-ghost" : "btn btn-primary"} onClick={toggleQuizMode}>
                      {quizMode ? <XIcon size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                      {quizMode ? "Exit quiz" : "Start quiz"}
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
                  <SubjectIcon icon={activeIcon} size={48} color={activeColor} />
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--text-2)",
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
                    color: "var(--text-3)",
                    fontFamily: "var(--font-body)", fontVariantNumeric: "tabular-nums",
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
                <p style={{ color: "var(--bad)", marginBottom: 16 }}>{error}</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => startGeneration(selectedTopic, selectedTier)}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Quiz mode: results screen */}
            {quizMode && quizFinished && questions.length > 0 && (() => {
              const { earned, totalMarks } = getQuizScore();
              const pct = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : 0;
              return (
                <QuizResults
                  questions={questions}
                  assessments={quizAssessments}
                  answers={quizAnswers}
                  earned={earned}
                  totalMarks={totalMarks}
                  pct={pct}
                  grade={getGrade(pct)}
                  onRetake={retakeQuiz}
                  onBack={() => { if (selectedBranch) goToBranchTopics(); else goToTopics(); }}
                  onGradeMounted={handleGradeMounted}
                />
              );
            })()}

            {/* Quiz mode: active quiz */}
            {quizMode && !quizFinished && questions.length > 0 && (() => {
              const { earned: runEarned, totalSoFar } = getQuizScoresSoFar();
              const assessedCount = Object.keys(quizAssessments).length;
              const submittedCount = Object.keys(quizSubmitted).length;
              const allDone = assessedCount === questions.length;
              const runPct = totalSoFar > 0 ? Math.round((runEarned / totalSoFar) * 100) : 0;
              const q = questions[currentQuizIndex];
              const isSubmitted = !!quizSubmitted[currentQuizIndex];
              const isAssessed = !!quizAssessments[currentQuizIndex];
              const answer = quizAnswers[currentQuizIndex] || "";

              return (
                <div>
                  {/* Sticky progress panel */}
                  <div ref={quizHeaderRef} style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    background: "var(--bg-0)",
                    borderBottom: "1px solid var(--line)",
                    padding: "12px 0 0",
                    marginBottom: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 26 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          Question {currentQuizIndex + 1} of {questions.length}
                        </span>
                        {combo >= 2 && (
                          <span
                            key={combo}
                            className="chip a-pop"
                            aria-live="polite"
                            style={{
                              color: "var(--ok)",
                              borderColor: "color-mix(in srgb, var(--ok) 40%, transparent)",
                              background: "color-mix(in srgb, var(--ok) 12%, transparent)",
                            }}
                          >
                            <Zap size={12} aria-hidden="true" /> Combo x{combo}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {assessedCount > 0 && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: getScoreColor(runPct), fontVariantNumeric: "tabular-nums" }}>
                            {runEarned}/{totalSoFar} marks · {runPct}%
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                          {questions.length - submittedCount} left
                        </span>
                      </div>
                    </div>
                    {/* Question nav dots */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {questions.map((_, i) => {
                        const a = quizAssessments[i];
                        const dotSubmitted = !!quizSubmitted[i];
                        const isCurrent = i === currentQuizIndex;
                        const meta = a ? ASSESSMENT[a] : null;
                        return (
                          <button
                            type="button"
                            key={i}
                            className="quiz-dot"
                            aria-label={`Question ${i + 1}${meta ? `, ${meta.label}` : ""}`}
                            aria-current={isCurrent ? "step" : undefined}
                            onClick={() => setCurrentQuizIndex(i)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "var(--r-sm)",
                              background: meta
                                ? `color-mix(in srgb, ${meta.color} 22%, transparent)`
                                : dotSubmitted ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--bg-1)",
                              border: `1.5px solid ${isCurrent ? "var(--accent)" : meta ? meta.color : "var(--line)"}`,
                              color: meta ? meta.color : dotSubmitted ? "var(--text)" : "var(--text-3)",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              fontVariantNumeric: "tabular-nums",
                              padding: 0,
                              transition: "background-color var(--dur) var(--ease), border-color var(--dur) var(--ease)",
                            }}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                    {/* Progress rail */}
                    <div
                      role="progressbar"
                      aria-label="Questions answered"
                      aria-valuemin={0}
                      aria-valuemax={questions.length}
                      aria-valuenow={assessedCount}
                      style={{ height: 3, background: "var(--line)", overflow: "hidden" }}
                    >
                      <div style={{ width: `${(assessedCount / questions.length) * 100}%`, height: "100%", background: "var(--accent)", transition: "width var(--dur) var(--ease)" }} />
                    </div>
                  </div>

                  {/* Current question */}
                  <div
                    ref={quizCardRef}
                    className="card"
                    style={{
                      position: "relative",
                      zIndex: 1,
                      borderLeft: "3px solid var(--accent)",
                      padding: "22px 22px 22px 20px",
                      marginBottom: 16,
                      scrollMarginTop: quizHeaderH + 12,
                    }}
                  >
                    <QuestionMeta index={currentQuizIndex} marks={q.marks} commandWord={q.command_word} />

                    <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--text)", margin: "0 0 18px 0", fontWeight: 500, whiteSpace: "pre-wrap" }}>
                      {q.question}
                    </p>

                    {/* Answer textarea */}
                    <label htmlFor="quiz-answer" className="visually-hidden">Your answer</label>
                    <textarea
                      id="quiz-answer"
                      className="quiz-textarea"
                      value={answer}
                      onChange={(e) => setQuizAnswers((prev) => ({ ...prev, [currentQuizIndex]: e.target.value }))}
                      disabled={isSubmitted}
                      placeholder="Type your answer here…"
                      style={{
                        width: "100%",
                        minHeight: q.marks >= 6 ? 160 : q.marks >= 3 ? 100 : 70,
                        background: "var(--bg-2)",
                        border: "1px solid var(--line-strong)",
                        borderRadius: "var(--r-sm)",
                        padding: 14,
                        color: "var(--text)",
                        fontSize: 15,
                        lineHeight: 1.6,
                        fontFamily: "var(--font-body)",
                        resize: "vertical",
                        outline: "none",
                        opacity: isSubmitted ? 0.7 : 1,
                        transition: "border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)",
                      }}
                    />

                    {/* Submit button */}
                    {!isSubmitted && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setQuizSubmitted((prev) => ({ ...prev, [currentQuizIndex]: true }))}
                        disabled={!answer.trim()}
                        style={{ marginTop: 12 }}
                      >
                        Submit answer
                      </button>
                    )}

                    {/* Model answer comparison (shown after submit) */}
                    {isSubmitted && (
                      <div style={{ marginTop: 16 }}>
                        <AnswerBlocks modelAnswer={q.model_answer} examinerTip={q.examiner_tip} />

                        {/* Self-assessment */}
                        <div style={{ marginTop: 18, animation: "fadeSlideUp var(--dur) var(--ease) both" }}>
                          <div className="small" style={{ color: "var(--text-2)", marginBottom: 10 }}>
                            {isAssessed ? "Your mark" : "Did you get it right?"}
                          </div>
                          <div role="group" aria-label="Mark your answer" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {["full", "partial", "missed"].map((key) => {
                              const meta = ASSESSMENT[key];
                              const chosen = quizAssessments[currentQuizIndex] === key;
                              const marksText = key === "full" ? `${q.marks}/${q.marks} marks` : key === "partial" ? `${Math.round(q.marks / 2)}/${q.marks} marks` : `0/${q.marks} marks`;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  className="btn"
                                  aria-pressed={chosen}
                                  disabled={isAssessed && !chosen}
                                  onClick={(e) => assessQuestion(key, e.currentTarget)}
                                  style={{
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 2,
                                    minWidth: 118,
                                    padding: "10px 14px",
                                    background: chosen ? `color-mix(in srgb, ${meta.color} 16%, transparent)` : "var(--bg-2)",
                                    border: `1px solid ${chosen ? meta.color : "var(--line-strong)"}`,
                                    color: "var(--text)",
                                    cursor: isAssessed ? "default" : "pointer",
                                  }}
                                >
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: meta.color }}>
                                    <meta.Icon size={16} strokeWidth={2.25} aria-hidden="true" /> {meta.label}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{marksText}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nav buttons + Finish */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCurrentQuizIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuizIndex === 0}
                    >
                      Previous
                    </button>
                    {allDone && (
                      <button type="button" className="btn btn-primary" onClick={(e) => finishQuiz(e.currentTarget)}>
                        Finish quiz
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCurrentQuizIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentQuizIndex === questions.length - 1}
                    >
                      Next
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
                  onReveal={(el) => handleReveal(i, el)}
                  color={activeColor || accent}
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

      {/* Reward layer overlays */}
      <RewardToastHost ref={toastRef} accent={activeColor || accent} />
      {confettiBursts.map((b) => (
        <Confetti
          key={b.id}
          origin={b.origin}
          colors={b.colors}
          onDone={() => setConfettiBursts((prev) => prev.filter((x) => x.id !== b.id))}
        />
      ))}
      {levelUp && <LevelUpCard key={levelUp.id} level={levelUp.level} accent={accent} onDismiss={() => setLevelUp(null)} />}
    </div>
  );
}
