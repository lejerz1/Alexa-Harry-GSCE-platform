import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { EFFECTS, animateParticles } from "./avatarEffects";

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
  const containerRefs = useRef([]);

  const handleClick = useCallback(
    (user, index) => {
      if (animatingIndex !== null) return; // block double-clicks

      setAnimatingIndex(index);

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

      // Navigate after animation
      const maxDuration = (parts.length > 0 ? Math.max(...parts.map((p) => p.duration + p.delay)) : 0) + 100;
      const navDelay = Math.min(Math.max(maxDuration, 800), 1600);
      setTimeout(() => {
        setAnimatingIndex(null);
        setParticles([]);
        navigate(`/app/${user.slug}`);
      }, navDelay);
    },
    [animatingIndex, navigate, zaraClickCount, zaraMummRa, laylaClickCount, laylaRusty, harryClickCount, harryDumbbell]
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
      `}</style>

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
          animation: "fadeSlideUp 0.5s ease both",
          textAlign: "center",
        }}
      >
        Who's revising<span style={{ color: "#4ECDC4" }}>?</span>
      </h1>

      <p
        style={{
          maxWidth: 440,
          textAlign: "center",
          fontSize: 14,
          lineHeight: 1.65,
          color: "rgba(240,237,230,0.5)",
          margin: 0,
          marginBottom: 40,
          fontFamily: "'DM Sans', sans-serif",
          animation: "fadeSlideUp 0.5s ease both",
          animationDelay: "0.08s",
        }}
      >
        5 years of past papers. The questions that actually keep coming up.
        {" "}Less grinding, smarter revision, better grades. That's the hack.
      </p>

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          justifyContent: "center",
          animation: "fadeSlideUp 0.5s ease both",
          animationDelay: "0.15s",
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
                      user.slug === "zara" && zaraMummRa ? "/avatars/mumm-ra.png"
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
        }}
      >
        GCSE Revision Platform
      </p>
    </div>
  );
}
