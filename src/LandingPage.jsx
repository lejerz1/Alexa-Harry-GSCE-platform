import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { EFFECTS, animateParticles } from "./avatarEffects";
import { playSound, playWhoosh } from "./soundEffects";
import { getSubjectsForUser } from "./userConfig";

const USERS = [
  { slug: "alexa", name: "Alexa" },
  { slug: "harry", name: "Harry" },
  { slug: "zara", name: "Zara" },
  { slug: "layla", name: "Layla" },
  { slug: "georgia", name: "Georgia" },
];

const QUOTES = [
  "Future grade 9 students right here",
  "Examiners hate this one trick",
  "Your revision, turbocharged",
  "While everyone else is panicking, you\u2019re prepared",
  "This is the cheat code they don\u2019t teach in school",
  "Work smarter, not harder. That\u2019s the whole point",
  "Past papers don\u2019t lie. Neither do we",
  "Every question you nail here is one less surprise on exam day",
  "You\u2019re literally hacking your GCSEs right now",
  "The smart ones revise what matters. That\u2019s you",
];

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Morning grinder \uD83D\uDCAA";
  if (hour >= 12 && hour < 17) return "Afternoon session, let\u2019s go \u2600\uFE0F";
  if (hour >= 17 && hour < 21) return "Evening revision? Smart move \uD83E\uDDE0";
  return "Late night revision? Respect \uD83C\uDF19";
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
        return `${streak.count}-day streak \uD83D\uDD25`;
      }
    }

    const progressRaw = localStorage.getItem(`${slug}:gcse-progress`);
    const progress = progressRaw ? JSON.parse(progressRaw) : {};
    const subjects = getSubjectsForUser(slug);

    let totalCompleted = 0;
    let closestName = null;
    let closestRemaining = Infinity;

    for (const [key, subject] of Object.entries(subjects)) {
      let completed = 0;
      let total = 0;
      if (subject.isCombined && subject.branches) {
        for (const [branchKey, branch] of Object.entries(subject.branches)) {
          total += branch.topics.length;
          completed += branch.topics.filter((t) => progress[`${key}:${branchKey}:${t}`]).length;
        }
      } else {
        total = subject.topics.length;
        completed = subject.topics.filter((t) => progress[`${key}:${t}`]).length;
      }
      totalCompleted += completed;
      const remaining = total - completed;
      if (completed > 0 && remaining > 0 && remaining < closestRemaining) {
        closestRemaining = remaining;
        closestName = subject.name;
      }
    }

    // 2. Closest subject to completion
    if (closestName && closestRemaining <= 5) {
      return `${closestRemaining} away from finishing ${closestName}`;
    }

    // 3. Total topics completed
    if (totalCompleted > 0) {
      return `${totalCompleted} topic${totalCompleted !== 1 ? "s" : ""} completed`;
    }

    return "Ready to start";
  } catch {
    return "Ready to start";
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
  const containerRefs = useRef([]);
  const canvasRef = useRef(null);
  const hoverPosRef = useRef(null);

  // Stable per-mount values
  const [greeting] = useState(getTimeGreeting);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [milestones, setMilestones] = useState({});

  // Exam countdown
  const examDate = (() => {
    const now = new Date();
    const exam2025 = new Date(2025, 4, 12);
    return now < exam2025 ? exam2025 : new Date(2026, 4, 11);
  })();
  const daysUntil = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil < 30;
  const isCritical = daysUntil < 7;

  // Load milestones from localStorage
  useEffect(() => {
    const m = {};
    USERS.forEach((u) => { m[u.slug] = getMilestone(u.slug); });
    setMilestones(m);
  }, []);

  // Entrance whoosh sounds (silently fails if AudioContext not yet activated)
  useEffect(() => {
    USERS.forEach((_, i) => {
      setTimeout(() => playWhoosh(), 1800 + i * 150);
    });
  }, []);

  // Floating particle background with hover attraction
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

    const pts = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.15 + Math.random() * 0.35),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.015,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hoverTarget = hoverPosRef.current;

      pts.forEach((p) => {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.15;
        p.y += p.vy;

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

        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78,205,196,${p.opacity})`;
        ctx.fill();
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(78,205,196,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
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
          setTimeout(() => setGeorgiaZoom(false), 1400);
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
      style={{
        minHeight: "100vh",
        background: "#0D0C0B",
        color: "#F0EDE6",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
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
        @keyframes headingFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glitchFlicker {
          0%   { opacity: 0; transform: translateX(0); text-shadow: none; clip-path: inset(0 0 0 0); }
          8%   { opacity: 1; transform: translateX(-8px); text-shadow: -3px 0 #ff0040, 3px 0 #0040ff; clip-path: inset(15% 0 50% 0); }
          14%  { opacity: 0; transform: translateX(6px); text-shadow: 3px 0 #ff0040, -3px 0 #0040ff; clip-path: inset(60% 0 10% 0); }
          22%  { opacity: 1; transform: translateX(-4px); text-shadow: -2px 0 #ff0040, 2px 0 #0040ff; clip-path: inset(5% 0 65% 0); }
          28%  { opacity: 0; transform: translateX(3px); clip-path: inset(0 0 0 0); text-shadow: none; }
          36%  { opacity: 1; transform: translateX(5px); text-shadow: 2px 0 #ff0040, -2px 0 #0040ff; clip-path: inset(40% 0 25% 0); }
          44%  { opacity: 1; transform: translateX(-2px); text-shadow: -1px 0 #ff0040, 1px 0 #0040ff; clip-path: inset(0 0 0 0); }
          55%  { opacity: 1; transform: translateX(1px); text-shadow: 1px 0 #ff0040, -1px 0 #0040ff; clip-path: inset(0 0 0 0); }
          70%  { opacity: 1; transform: translateX(0); text-shadow: none; clip-path: inset(0 0 0 0); }
          100% { opacity: 1; transform: translateX(0); text-shadow: none; clip-path: inset(0 0 0 0); }
        }
        .glitch-hack {
          position: relative;
          display: inline-block;
          color: #4ECDC4;
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
          color: #ff0040;
          animation: glitchSliceTop 1.2s ease-out both;
          animation-delay: 0.6s;
        }
        .glitch-hack::after {
          color: #0040ff;
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
          0%, 100% { box-shadow: 0 0 6px rgba(78,205,196,0.12); }
          50%      { box-shadow: 0 0 18px rgba(78,205,196,0.18); }
        }
        @keyframes urgencyPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(231, 76, 60, 0.3); }
          50% { box-shadow: 0 0 20px rgba(231, 76, 60, 0.6); }
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
        @keyframes georgiaZoomPulse {
          0% { transform: scale(1); animation-timing-function: ease-out; }
          21.4% { transform: scale(3.5); animation-timing-function: linear; }
          78.6% { transform: scale(3.5); animation-timing-function: ease-in; }
          100% { transform: scale(1); }
        }
      `}</style>

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
          background: "radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Time-of-day greeting */}
      <div
        style={{
          fontSize: 13,
          color: "rgba(240,237,230,0.4)",
          fontFamily: "'DM Sans', sans-serif",
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
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          margin: 0,
          marginBottom: 48,
          fontFamily: "'Syne', sans-serif",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span style={{ opacity: 0, animation: "headingFadeIn 0.6s ease both" }}>Your exams, </span>
        <span className="glitch-hack">hacked.</span>
      </h1>

      <p
        style={{
          maxWidth: 440,
          textAlign: "center",
          fontSize: 14,
          lineHeight: 1.65,
          color: "rgba(240,237,230,0.5)",
          margin: 0,
          marginBottom: 32,
          fontFamily: "'DM Sans', sans-serif",
          animation: "fadeSlideUp 0.5s ease both",
          animationDelay: "0.08s",
          position: "relative",
          zIndex: 1,
        }}
      >
        We crunched 5 years of past papers and found the patterns examiners keep repeating.
        {" "}Stop wasting time on topics that never come up. This is the shortcut.
      </p>

      {/* Exam countdown */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 12,
          position: "relative",
          zIndex: 1,
          padding: "16px 28px",
          borderRadius: 12,
          background: isUrgent ? "rgba(231,76,60,0.06)" : "transparent",
          animation: isUrgent
            ? "fadeSlideUp 0.5s ease both, urgencyPulse 2s ease-in-out infinite"
            : "fadeSlideUp 0.5s ease both",
          animationDelay: "0.12s",
        }}
      >
        <div>
          <span
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: isUrgent ? "#E74C3C" : "#4ECDC4",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            {daysUntil}
          </span>
          <span
            style={{
              fontSize: 16,
              color: "rgba(240,237,230,0.45)",
              fontFamily: "'DM Sans', sans-serif",
              marginLeft: 10,
              fontWeight: 500,
            }}
          >
            {isCritical ? "days \u2014 let's go \uD83D\uDD25" : "days until exams begin"}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(240,237,230,0.3)",
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 8,
            letterSpacing: "0.01em",
          }}
        >
          Every topic you cover now is points in the bank
        </div>
      </div>

      {/* Rotating motivational quote */}
      <div
        style={{
          fontSize: 13,
          color: "rgba(78,205,196,0.4)",
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          textAlign: "center",
          marginBottom: 36,
          animation: "fadeSlideUp 0.6s ease 0.25s both",
          position: "relative",
          zIndex: 1,
        }}
      >
        &ldquo;{quote}&rdquo;
      </div>

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {USERS.map((user, i) => {
          const isAnimating = animatingIndex === i;
          const settled = settledAvatars.has(i);

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
              onClick={() => handleClick(user, i)}
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: animatingIndex !== null ? "default" : "pointer",
                opacity: settled ? 1 : undefined,
                transform: settled
                  ? (hoveredIndex === i && !isAnimating ? "scale(1.08)" : "scale(1)")
                  : undefined,
                transition: settled ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                animation: outerAnimation,
              }}
            >
              <div
                ref={(el) => (containerRefs.current[i] = el)}
                style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    overflow: "hidden",
                    padding: 8,
                    border: isAnimating
                      ? "3px solid #4ECDC4"
                      : hoveredIndex === i
                      ? "3px solid #4ECDC4"
                      : "3px solid rgba(255,255,255,0.08)",
                    boxShadow: isAnimating
                      ? "0 0 30px rgba(78,205,196,0.5)"
                      : "none",
                    transition: "border 0.3s ease",
                    background: "rgba(255,255,255,0.03)",
                    boxSizing: "border-box",
                    animation: isAnimating
                      ? "avatarSpinScale 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
                      : hoveredIndex === i && settled
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
                    alt={user.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                      animation: georgiaZoom && user.slug === "georgia" ? "georgiaZoomPulse 1.4s linear" : "none",
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
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: isAnimating
                    ? "#4ECDC4"
                    : hoveredIndex === i
                    ? "#4ECDC4"
                    : "rgba(240,237,230,0.7)",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "-0.01em",
                  opacity: settled ? 1 : 0,
                  transition: settled ? "color 0.3s ease, opacity 0.3s ease" : "none",
                  animation: settled
                    ? "none"
                    : `avatarNameFadeIn 0.3s ease ${1.8 + i * 0.15 + 0.35}s both`,
                }}
              >
                {user.name}
              </span>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(240,237,230,0.35)",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.01em",
                  opacity: settled ? 1 : 0,
                  transition: settled ? "opacity 0.3s ease" : "none",
                  animation: settled
                    ? "none"
                    : `avatarNameFadeIn 0.3s ease ${1.8 + i * 0.15 + 0.45}s both`,
                }}
              >
                {milestones[user.slug] || "Ready to start"}
              </div>
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: 56,
          fontSize: 12,
          color: "rgba(240,237,230,0.25)",
          fontFamily: "'JetBrains Mono', monospace",
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
