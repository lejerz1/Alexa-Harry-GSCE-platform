import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { EFFECTS, animateParticles } from "./avatarEffects";
import { playSound, playWhoosh } from "./soundEffects";
import { Flame, ChevronDown } from "lucide-react";
import {
  getSubjectsForUser, getNextExamForUser, getNextExamAcrossUsers, USER_PROFILES,
  CAMBRIDGE_IGCSE_SUBJECTS, GENERIC_SUBJECTS, EDEXCEL_IGCSE_SUBJECTS,
} from "./userConfig";
import SubjectCarousel from "./SubjectCarousel";
import { countMastered } from "./components/topicInclusion";
import { formatShortDate } from "./components/motion";
import ThemeToggle from "./components/ThemeToggle";
import { onThemeChange, tokenRgb } from "./theme";

const BASE_USERS = [
  { slug: "alexa", name: "Alexa" },
  { slug: "harry", name: "Harry" },
  { slug: "zara", name: "Zara" },
  { slug: "layla", name: "Layla" },
  { slug: "georgia", name: "Georgia" },
];

// Nearest upcoming exam first, then everyone else in the usual order.
function orderUsers() {
  return BASE_USERS.map((u, i) => ({
    ...u,
    accent: USER_PROFILES[u.slug]?.accent || "#5BD0C3",
    next: getNextExamForUser(u.slug),
    i,
  })).sort((a, b) => {
    if (a.next && b.next) return a.next.date - b.next.date || a.i - b.i;
    if (a.next) return -1;
    if (b.next) return 1;
    return a.i - b.i;
  });
}

const examWithin = (slug, days) => {
  const n = getNextExamForUser(slug);
  return !!n && n.daysToGo <= days;
};

const QUOTES = [
  "Future grade 9 students right here",
  "Examiners hate this one trick",
  "Your revision, turbocharged",
  "While everyone else is panicking, you\u2019re prepared",
  "Work smarter, not harder. That\u2019s the whole point",
  "Past papers don\u2019t lie. Neither do we",
  "Every question you nail here is one less surprise on exam day",
  "The smart ones revise what matters. That\u2019s you",
  "Zara and Layla, this is your week.",
  "Small sessions, every day, beats one long panic.",
];

function pickQuote() {
  const zaraLaylaWeek = examWithin("zara", 21) || examWithin("layla", 21);
  const pool = QUOTES.filter((q) => zaraLaylaWeek || !q.startsWith("Zara and Layla"));
  return pool[Math.floor(Math.random() * pool.length)];
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning grinder";
  if (hour >= 12 && hour < 17) return "Afternoon session, let\u2019s go";
  if (hour >= 17 && hour < 21) return "Evening revision? Smart move";
  return "Late night revision? Respect";
}

function getMilestone(slug) {
  try {
    // 1. Active streak (2+ days)
    const streakRaw = localStorage.getItem(`${slug}:streak`);
    if (streakRaw) {
      const streak = JSON.parse(streakRaw);
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if ((streak.lastDate === today || streak.lastDate === yesterday) && streak.count >= 2) {
        return { text: `${streak.count}-day streak`, flame: true };
      }
    }

    const progressRaw = localStorage.getItem(`${slug}:gcse-progress`);
    const progress = progressRaw ? JSON.parse(progressRaw) : {};
    const subjects = getSubjectsForUser(slug);

    let totalCompleted = 0;
    let closestName = null;
    let closestRemaining = Infinity;

    for (const [key, subject] of Object.entries(subjects)) {
      const { done: completed, total } = countMastered(slug, key, subject, progress);
      totalCompleted += completed;
      const remaining = total - completed;
      if (completed > 0 && remaining > 0 && remaining < closestRemaining) {
        closestRemaining = remaining;
        closestName = subject.name;
      }
    }

    // 2. Closest subject to completion
    if (closestName && closestRemaining <= 5) {
      return { text: `${closestRemaining} away from finishing ${closestName}` };
    }

    // 3. Total topics completed
    if (totalCompleted > 0) {
      return { text: `${totalCompleted} topic${totalCompleted !== 1 ? "s" : ""} completed` };
    }

    return { text: "Ready to start" };
  } catch {
    return { text: "Ready to start" };
  }
}

/* ── Component ──────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const [particles, setParticles] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
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
  const [settledAvatars, setSettledAvatars] = useState(new Set());
  const [howOpen, setHowOpen] = useState(false);
  const howContentRef = useRef(null);
  const [howHeight, setHowHeight] = useState(0);
  const containerRefs = useRef([]);
  const canvasRef = useRef(null);
  const hoverPosRef = useRef(null);

  // Stable per-mount values
  const [greeting] = useState(getTimeGreeting);
  const [quote] = useState(pickQuote);
  const [USERS] = useState(orderUsers);
  const [milestones, setMilestones] = useState({});

  // Exam countdown: nearest upcoming exam across every profile
  const [nextExam] = useState(getNextExamAcrossUsers);
  const daysToGo = nextExam?.daysToGo ?? null;
  const isUrgent = daysToGo !== null && daysToGo < 14;
  const isCritical = daysToGo !== null && daysToGo < 5;
  const countdownColor = isCritical ? "var(--bad)" : isUrgent ? "var(--warn)" : "var(--text)";
  const heroAccent = (nextExam && USER_PROFILES[nextExam.userName]?.accent) || "#A78BFA";

  // Load milestones from localStorage
  useEffect(() => {
    const m = {};
    BASE_USERS.forEach((u) => { m[u.slug] = getMilestone(u.slug); });
    setMilestones(m);
  }, []);

  // Entrance whoosh sounds (silently fails if AudioContext not yet activated)
  useEffect(() => {
    BASE_USERS.forEach((_, i) => {
      setTimeout(() => playWhoosh(), 1800 + i * 150);
    });
  }, []);

  // SVG study icon paths (stroke-only line art)
  const studyIcons = useRef([
    // Pencil
    "M3 21l1.5-4.5L17.5 3.5l3 3L7.5 19.5 3 21zM14.5 6.5l3 3",
    // Open book
    "M2 4c2-1 4-1 6 0v16c-2-1-4-1-6 0V4zm20 0c-2-1-4-1-6 0v16c2-1 4-1 6 0V4zM12 4v16",
    // Stack of books
    "M4 19h16M4 15h16M6 11h12M4 19v-4M20 19v-4M4 15v-4h16v4M8 7h8l-1-4H9L8 7z",
    // Test tube
    "M9 3h6M10 3v11l-3 5a2 2 0 002 2h6a2 2 0 002-2l-3-5V3",
    // Microscope
    "M6 21h12M9 21v-4h6v4M12 17v-2M14 3l-4 8h4l-2 4M8 11h8",
    // Protractor/set square
    "M3 21L3 3l18 18H3zM3 12h9M12 12v9",
    // Graduation cap
    "M2 10l10-4 10 4-10 4-10-4zM6 12v5c0 1 3 3 6 3s6-2 6-3v-5M22 10v6",
    // Atom symbol
    "M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 3c-3 0-8 3.5-8 9s5 9 8 9M12 3c3 0 8 3.5 8 9s-5 9-8 9M3.5 8h17M3.5 16h17",
    // DNA helix
    "M6 3c0 4 12 4 12 8s-12 4-12 8M18 3c0 4-12 4-12 8s12 4 12 8M8 7h8M8 17h8M7 12h10",
    // Globe
    "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c-3 0-6 4.5-6 10s3 10 6 10M12 2c3 0 6 4.5 6 10s-3 10-6 10",
    // Bar chart
    "M4 20h16M6 20v-6M10 20V8M14 20v-10M18 20v-14",
    // Lightbulb
    "M9 21h6M10 17h4M12 3a6 6 0 00-4 10.5V16h8v-2.5A6 6 0 0012 3z",
  ]).current;

  // Floating study icons background with hover attraction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pre-build Path2D objects for each icon
    const iconPaths = studyIcons.map((d) => new Path2D(d));

    const PALETTE = [tokenRgb("--text"), ...BASE_USERS.map((u) => {
      const h = (USER_PROFILES[u.slug]?.accent || "#5BD0C3").slice(1);
      const n = parseInt(h, 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    })];
    const COUNT = 18;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 16 + Math.random() * 12, // 16-28px
      opacity: 0.08 + Math.random() * 0.17, // 0.08-0.25
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(0.12 + Math.random() * 0.28),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.006 + Math.random() * 0.012,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.003,
      icon: Math.floor(Math.random() * studyIcons.length),
      tone: Math.floor(Math.random() * PALETTE.length),
    }));
    const offTheme = onThemeChange(() => { PALETTE[0] = tokenRgb("--text"); });

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hoverTarget = hoverPosRef.current;

      pts.forEach((p) => {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.12;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        // Gentle gravitational pull toward hovered avatar
        if (hoverTarget) {
          const dx = hoverTarget.x - p.x;
          const dy = hoverTarget.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 10) {
            const strength = 0.2 * (1 - dist / 200);
            p.x += (dx / dist) * strength;
            p.y += (dy / dist) * strength;
          }
        }

        if (p.y < -30) { p.y = canvas.height + 30; p.x = Math.random() * canvas.width; }
        if (p.x < -30) p.x = canvas.width + 30;
        if (p.x > canvas.width + 30) p.x = -30;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const scale = p.size / 24; // icons are drawn in a 24x24 viewBox
        ctx.scale(scale, scale);
        ctx.translate(-12, -12); // center the 24x24 icon
        ctx.strokeStyle = `rgba(${PALETTE[p.tone]},${p.opacity})`;
        ctx.lineWidth = 1.5 / scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(iconPaths[p.icon]);
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      offTheme();
    };
  }, []);

  const handleClick = useCallback(
    (user, index) => {
      if (animatingIndex !== null) return; // block double-clicks

      setAnimatingIndex(index);

      // Alexa's football easter egg
      if (user.slug === "alexa") {
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
      if (user.slug === "zara") {
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
      if (user.slug === "harry") {
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
      if (user.slug === "layla") {
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
      if (user.slug === "georgia") {
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

      // Generate particles
      const gen = EFFECTS[user.slug];
      const parts = gen ? gen() : [];
      setParticles(parts);

      // Harry's screen shake
      if (user.slug === "harry") {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 350);
      }

      // Kick off particle animations after a frame so initial styles apply first
      animateParticles(containerRefs.current[index], parts);

      // Play sound effect simultaneously with animation
      playSound(user.slug);

      // Track user selection
      posthog.identify(user.slug);
      posthog.capture("user_selected", { user: user.slug });

      // Navigate after animation
      const maxDuration = (parts.length > 0 ? Math.max(...parts.map((p) => p.duration + p.delay)) : 0) + 100;
      const navDelay = Math.min(Math.max(maxDuration, 800), 1600);
      setTimeout(() => {
        setAnimatingIndex(null);
        setParticles([]);
        navigate(`/app/${user.slug}`);
      }, navDelay);
    },
    [animatingIndex, navigate, zaraClickCount, zaraMummRa, laylaClickCount, laylaRusty, harryClickCount, harryDumbbell, alexaClickCount, alexaFootball, georgiaClickCount, georgiaZoom]
  );

  return (
    <div
      className="page-bg"
      style={{
        "--hero-accent": heroAccent,
        minHeight: "100vh",
        background: "var(--bg-0)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        position: "relative",
        overflow: "hidden",
        animation: screenShake ? "screenShake 0.35s ease-out" : "none",
      }}
    >
      <style>{`
        @keyframes headingFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glitchFlicker {
          0%   { opacity: 0; transform: translateX(0); text-shadow: none; clip-path: inset(0 0 0 0); }
          8%   { opacity: 1; transform: translateX(-8px); text-shadow: -3px 0 #F472B6, 3px 0 #60A5FA; clip-path: inset(15% 0 50% 0); }
          14%  { opacity: 0; transform: translateX(6px); text-shadow: 3px 0 #F472B6, -3px 0 #60A5FA; clip-path: inset(60% 0 10% 0); }
          22%  { opacity: 1; transform: translateX(-4px); text-shadow: -2px 0 #F472B6, 2px 0 #60A5FA; clip-path: inset(5% 0 65% 0); }
          28%  { opacity: 0; transform: translateX(3px); clip-path: inset(0 0 0 0); text-shadow: none; }
          36%  { opacity: 1; transform: translateX(5px); text-shadow: 2px 0 #F472B6, -2px 0 #60A5FA; clip-path: inset(40% 0 25% 0); }
          44%  { opacity: 1; transform: translateX(-2px); text-shadow: -1px 0 #F472B6, 1px 0 #60A5FA; clip-path: inset(0 0 0 0); }
          55%  { opacity: 1; transform: translateX(1px); text-shadow: 1px 0 #F472B6, -1px 0 #60A5FA; clip-path: inset(0 0 0 0); }
          70%  { opacity: 1; transform: translateX(0); text-shadow: none; clip-path: inset(0 0 0 0); }
          100% { opacity: 1; transform: translateX(0); text-shadow: none; clip-path: inset(0 0 0 0); }
        }
        .glitch-hack {
          position: relative;
          display: inline-block;
          --accent: var(--hero-accent);
          color: var(--accent-ink);
          opacity: 0;
          animation: glitchFlicker 1.2s ease-out both;
          animation-delay: 0.6s;
        }
        .glitch-hack::before,
        .glitch-hack::after {
          content: 'hacked.';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
        }
        .glitch-hack::before {
          color: #F472B6;
          animation: glitchSliceTop 1.2s ease-out both;
          animation-delay: 0.6s;
        }
        .glitch-hack::after {
          color: #60A5FA;
          animation: glitchSliceBottom 1.2s ease-out both;
          animation-delay: 0.6s;
        }
        @keyframes glitchSliceTop {
          0%   { opacity: 0; }
          8%   { opacity: 0.7; clip-path: inset(0 0 60% 0); transform: translateX(-5px); }
          14%  { opacity: 0.7; clip-path: inset(0 0 45% 0); transform: translateX(6px); }
          22%  { opacity: 0.5; clip-path: inset(0 0 70% 0); transform: translateX(-3px); }
          36%  { opacity: 0.4; clip-path: inset(0 0 55% 0); transform: translateX(4px); }
          44%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes glitchSliceBottom {
          0%   { opacity: 0; }
          8%   { opacity: 0.7; clip-path: inset(60% 0 0 0); transform: translateX(5px); }
          14%  { opacity: 0.7; clip-path: inset(45% 0 0 0); transform: translateX(-6px); }
          22%  { opacity: 0.5; clip-path: inset(70% 0 0 0); transform: translateX(3px); }
          36%  { opacity: 0.4; clip-path: inset(55% 0 0 0); transform: translateX(-4px); }
          44%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes avatarBounceIn {
          0%   { opacity: 0; transform: scale(0) translateY(20px); }
          50%  { opacity: 1; transform: scale(1.1) translateY(-4px); }
          70%  { transform: scale(0.97) translateY(1px); }
          85%  { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes avatarNameFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 14%, transparent); }
          50%      { box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 24%, transparent); }
        }
        @keyframes urgencyPulse {
          0%, 100% { box-shadow: 0 0 8px color-mix(in srgb, currentColor 30%, transparent); }
          50% { box-shadow: 0 0 20px color-mix(in srgb, currentColor 60%, transparent); }
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
        @keyframes laylaLift {
          0% { transform: translateY(0); }
          25% { transform: translateY(-12px); }
          100% { transform: translateY(0); }
        }
        @keyframes georgiaSpin {
          0% { transform: rotate(0deg); animation-timing-function: linear; }
          83.3% { transform: rotate(5760deg); animation-timing-function: ease-out; }
          100% { transform: rotate(6120deg); }
        }
      `}</style>

      <ThemeToggle style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }} />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, color-mix(in srgb, ${heroAccent} 8%, transparent) 0%, transparent 70%)`,
          opacity: "var(--flash-opacity)",
          pointerEvents: "none",
        }}
      />

      {/* Time-of-day greeting */}
      <div
        style={{
          fontSize: 13,
          color: "var(--text-3)",
          marginBottom: 12,
          animation: "fadeSlideUp 0.5s ease both",
          position: "relative",
          zIndex: 1,
        }}
      >
        {greeting}
      </div>

      <h1
        style={{
          fontSize: "clamp(34px, 9vw, 48px)",
          lineHeight: 1.05,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          margin: 0,
          marginBottom: 20,
          fontFamily: "var(--font-display)",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          color: "var(--text)",
        }}
      >
        <span style={{ opacity: 0, animation: "headingFadeIn 0.6s ease both" }}>Your exams, </span>
        <span className="glitch-hack">hacked.</span>
      </h1>

      <p
        style={{
          maxWidth: 460,
          textAlign: "center",
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--text-2)",
          margin: 0,
          marginBottom: 28,
          animation: "fadeSlideUp 0.5s ease both",
          animationDelay: "0.08s",
          position: "relative",
          zIndex: 1,
        }}
      >
        Eight predicted questions per topic, built from five years of past papers. Revise what examiners actually ask.
      </p>

      {/* Exam countdown */}
      {nextExam && (
        <div
          className="card"
          style={{
            textAlign: "center",
            marginBottom: 16,
            position: "relative",
            zIndex: 1,
            padding: "18px 28px",
            width: "100%",
            maxWidth: 420,
            color: countdownColor,
            borderColor: isUrgent ? "color-mix(in srgb, currentColor 35%, transparent)" : "var(--line)",
            background: isUrgent ? "color-mix(in srgb, currentColor 6%, var(--bg-1))" : "var(--bg-1)",
            animation: isUrgent
              ? "fadeSlideUp 0.5s ease both, urgencyPulse 2s ease-in-out infinite"
              : "fadeSlideUp 0.5s ease both",
            animationDelay: "0.12s",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 44,
                lineHeight: 1,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {daysToGo === 0 ? "Today" : daysToGo}
            </span>
            {daysToGo > 0 && (
              <span style={{ fontSize: 16, color: "var(--text-2)", fontWeight: 500 }}>
                {daysToGo === 1 ? "day to go" : "days to go"}
              </span>
            )}
          </div>
          <div className="small" style={{ color: "var(--text-2)", marginTop: 8 }}>
            {nextExam.subject.name} for {USER_PROFILES[nextExam.userName]?.displayName}, {formatShortDate(nextExam.date)}
          </div>
        </div>
      )}

      {/* Rotating motivational quote */}
      <div
        style={{
          fontSize: 15,
          color: "var(--text-3)",
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          textAlign: "center",
          marginBottom: 28,
          maxWidth: 420,
          animation: "fadeSlideUp 0.6s ease 0.25s both",
          position: "relative",
          zIndex: 1,
        }}
      >
        &ldquo;{quote}&rdquo;
      </div>

      {/* How this works: expandable */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          position: "relative",
          zIndex: 1,
          width: "100%",
          animation: "fadeSlideUp 0.6s ease 0.3s both",
        }}
      >
        <button
          type="button"
          className="link-btn"
          aria-expanded={howOpen}
          aria-controls="how-it-works"
          onClick={() => {
            if (!howOpen && howContentRef.current) {
              setHowHeight(howContentRef.current.scrollHeight);
            }
            setHowOpen((v) => !v);
          }}
          style={{ color: howOpen ? "var(--text)" : "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}
        >
          How does this work?
          <ChevronDown
            size={16}
            aria-hidden="true"
            style={{ transition: "transform var(--dur-slow) var(--ease)", transform: howOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        <div
          id="how-it-works"
          style={{
            overflow: "hidden",
            transition: "max-height var(--dur-slow) var(--ease), opacity var(--dur-slow) var(--ease)",
            maxHeight: howOpen ? howHeight || 600 : 0,
            opacity: howOpen ? 1 : 0,
          }}
        >
          <div
            ref={howContentRef}
            className="card"
            style={{
              marginTop: 16,
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
              "--accent": heroAccent,
              borderLeft: "3px solid var(--accent-ink)",
              borderRadius: "var(--r-md)",
              padding: 22,
              textAlign: "left",
            }}
          >
            <h2 className="h3" style={{ marginBottom: 10 }}>The hack is simple.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-2)", margin: 0 }}>
              We ask AI to study five years of past papers for your exact exam board and predict the eight questions most likely to come up on each topic.
              {" "}Quiz mode lets you write your answer, compare it with the model answer and mark yourself honestly.
              {" "}Your progress, streaks and scores are saved on this device.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .user-grid { display: flex; gap: 32px; flex-wrap: wrap; justify-content: center; width: 100%; }
        .user-card { display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
        .user-avatar { width: 100px; height: 100px; }
        .user-meta { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .user-chip { margin-top: 4px; }
        @media (max-width: 559px) {
          .user-grid { flex-direction: column; gap: 10px; max-width: 480px; }
          .user-card {
            flex-direction: row; gap: 16px; width: 100%;
            padding: 12px 14px; background: var(--bg-1); border: 1px solid var(--line); border-radius: var(--r-lg);
          }
          .user-avatar { width: 64px; height: 64px; }
          .user-meta { align-items: flex-start; text-align: left; min-width: 0; }
          .user-chip { margin-top: 2px; }
        }
      `}</style>

      <div className="user-grid" style={{ position: "relative", zIndex: 1 }}>
        {USERS.map((user, i) => {
          const isAnimating = animatingIndex === i;
          const settled = settledAvatars.has(i);
          const hovered = hoveredIndex === i;
          const milestone = milestones[user.slug] || { text: "Ready to start" };
          const showExamChip = user.next && user.next.daysToGo <= 21;

          // Determine entrance vs post-entrance animation
          let outerAnimation = "none";
          if (!settled) {
            outerAnimation = `avatarBounceIn 0.55s cubic-bezier(0.4, 0, 0.2, 1) ${1.8 + i * 0.15}s both`;
          } else if (isAnimating && user.slug === "layla") {
            outerAnimation = "laylaLift 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
          }

          return (
            <div
              key={user.slug}
              role="button"
              tabIndex={0}
              aria-label={`Open ${user.name}'s revision`}
              className="user-card"
              onClick={() => handleClick(user, i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(user, i);
                }
              }}
              onMouseEnter={() => {
                setHoveredIndex(i);
                const rect = containerRefs.current[i]?.getBoundingClientRect();
                if (rect) {
                  hoverPosRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                }
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                hoverPosRef.current = null;
              }}
              onAnimationEnd={(e) => {
                if (e.animationName === "avatarBounceIn") {
                  setSettledAvatars((prev) => new Set([...prev, i]));
                }
              }}
              style={{
                "--accent": user.accent,
                cursor: animatingIndex !== null ? "default" : "pointer",
                outline: "none",
                opacity: settled ? 1 : undefined,
                transform: settled
                  ? (hovered && !isAnimating ? "scale(1.04)" : "scale(1)")
                  : undefined,
                transition: settled ? "transform var(--dur-slow) var(--ease), box-shadow var(--dur) var(--ease)" : "none",
                animation: outerAnimation,
              }}
            >
              <div
                ref={(el) => (containerRefs.current[i] = el)}
                className="user-avatar"
                style={{ position: "relative", flexShrink: 0 }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    padding: "8%",
                    border: isAnimating || hovered ? `3px solid ${user.accent}` : "3px solid var(--line)",
                    boxShadow: isAnimating ? `0 0 30px color-mix(in srgb, ${user.accent} 50%, transparent)` : "0 0 0 1px var(--line-strong)",
                    transition: "border var(--dur-slow) var(--ease)",
                    background: "var(--bg-2)",
                    boxSizing: "border-box",
                    animation: isAnimating
                      ? "avatarSpinScale 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
                      : hovered && settled
                      ? "glowPulse 1.5s ease-in-out infinite"
                      : "none",
                  }}
                >
                  <img
                    src={
                      user.slug === "alexa" && alexaFootball ? "/avatars/alexafootball.png"
                      : user.slug === "zara" && zaraMummRa ? "/avatars/mumm-ra.png"
                      : user.slug === "harry" && harryDumbbell ? "/avatars/dumbbell.png"
                      : user.slug === "layla" && laylaRusty ? "/avatars/rustyspoons.png"
                      : `/avatars/${user.slug}.png`
                    }
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      animation: georgiaZoom && user.slug === "georgia" ? "georgiaSpin 3s both" : "none",
                    }}
                  />
                </div>
                {/* Particles */}
                {isAnimating &&
                  particles.map((p) => (
                    <div
                      key={p.id}
                      data-particle={p.id}
                      style={p.style}
                    />
                  ))}
              </div>
              <div className="user-meta">
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isAnimating || hovered ? "var(--accent-ink)" : "var(--text)",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.01em",
                    opacity: settled ? 1 : 0,
                    transition: settled ? "color var(--dur-slow) var(--ease), opacity var(--dur-slow) var(--ease)" : "none",
                    animation: settled
                      ? "none"
                      : `avatarNameFadeIn 0.3s ease ${1.8 + i * 0.15 + 0.35}s both`,
                  }}
                >
                  {user.name}
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "var(--text-3)",
                    fontVariantNumeric: "tabular-nums",
                    opacity: settled ? 1 : 0,
                    transition: settled ? "opacity var(--dur-slow) var(--ease)" : "none",
                    animation: settled
                      ? "none"
                      : `avatarNameFadeIn 0.3s ease ${1.8 + i * 0.15 + 0.45}s both`,
                  }}
                >
                  {milestone.flame && (
                    <span className="a-flame"><Flame size={13} color="var(--warn)" strokeWidth={2} aria-hidden="true" /></span>
                  )}
                  {milestone.text}
                </div>
                {showExamChip && (
                  <span
                    className="chip user-chip"
                    style={{
                      color: user.next.daysToGo < 5 ? "var(--bad)" : user.next.daysToGo < 14 ? "var(--warn)" : "var(--accent-ink)",
                      borderColor: "color-mix(in srgb, currentColor 40%, transparent)",
                      opacity: settled ? 1 : 0,
                      transition: settled ? "opacity var(--dur-slow) var(--ease)" : "none",
                      animation: settled ? "none" : `avatarNameFadeIn 0.3s ease ${1.8 + i * 0.15 + 0.5}s both`,
                    }}
                  >
                    {user.next.daysToGo === 0 ? "Exam today" : `Exam in ${user.next.daysToGo} ${user.next.daysToGo === 1 ? "day" : "days"}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject carousel: all subjects */}
      <div
        style={{
          marginTop: 48,
          width: "100%",
          position: "relative",
          zIndex: 1,
          animation: "fadeSlideUp 0.5s ease 0.5s both",
        }}
      >
        <SubjectCarousel subjects={{ ...EDEXCEL_IGCSE_SUBJECTS, ...CAMBRIDGE_IGCSE_SUBJECTS, ...GENERIC_SUBJECTS }} speed={35} />
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "var(--text-3)",
          animation: "fadeSlideUp 0.5s ease both",
          animationDelay: "0.6s",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        The Nunn GCSE Hack
      </p>
    </div>
  );
}
