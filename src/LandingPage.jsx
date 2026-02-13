import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { EFFECTS, animateParticles } from "./avatarEffects";
import { playSound } from "./soundEffects";

const USERS = [
  { slug: "alexa", name: "Alexa" },
  { slug: "harry", name: "Harry" },
  { slug: "zara", name: "Zara" },
  { slug: "layla", name: "Layla" },
  { slug: "georgia", name: "Georgia" },
];

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
  const containerRefs = useRef([]);
  const canvasRef = useRef(null);

  // Exam countdown
  const examDate = (() => {
    const now = new Date();
    const exam2025 = new Date(2025, 4, 12);
    return now < exam2025 ? exam2025 : new Date(2026, 4, 11);
  })();
  const daysUntil = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil < 30;
  const isCritical = daysUntil < 7;

  // Floating particle background
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

    const particles = Array.from({ length: 35 }, () => ({
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

      particles.forEach((p) => {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.15;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78,205,196,${p.opacity})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
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
          marginBottom: 36,
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

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          justifyContent: "center",
          animation: "fadeSlideUp 0.5s ease both",
          animationDelay: "0.15s",
          position: "relative",
          zIndex: 1,
        }}
      >
        {USERS.map((user, i) => {
          const isAnimating = animatingIndex === i;
          return (
            <div
              key={user.slug}
              onClick={() => handleClick(user, i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                cursor: animatingIndex !== null ? "default" : "pointer",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: hoveredIndex === i && !isAnimating ? "scale(1.1)" : "scale(1)",
                animation: isAnimating && user.slug === "layla"
                  ? "fadeSlideUp 0.5s ease both, laylaLift 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                  : "fadeSlideUp 0.5s ease both",
                animationDelay: isAnimating ? "0s" : `${0.15 + i * 0.08}s`,
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
                      : hoveredIndex === i
                      ? "0 0 24px rgba(78,205,196,0.35)"
                      : "none",
                    transition: "border 0.3s ease, box-shadow 0.3s ease",
                    background: "rgba(255,255,255,0.03)",
                    boxSizing: "border-box",
                    animation: isAnimating ? "avatarSpinScale 0.9s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
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
                  transition: "color 0.3s ease",
                  letterSpacing: "-0.01em",
                }}
              >
                {user.name}
              </span>
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
