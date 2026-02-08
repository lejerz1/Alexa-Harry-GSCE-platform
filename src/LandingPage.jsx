import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const USERS = [
  { slug: "alexa", name: "Alexa" },
  { slug: "harry", name: "Harry" },
  { slug: "zara", name: "Zara" },
  { slug: "layla", name: "Layla" },
  { slug: "georgia", name: "Georgia" },
];

/* ── Particle generators ────────────────────────────────────── */

function alexaParticles() {
  // Catherine wheel — teal & platinum shards radiating outward
  const colors = ["#4ECDC4", "#E5E4E2", "#4ECDC4", "#E5E4E2", "#4ECDC4", "#b8f0ec"];
  return Array.from({ length: 26 }, (_, i) => {
    const angle = (i / 26) * 360 + (Math.random() * 14 - 7);
    const rad = (angle * Math.PI) / 180;
    const dist = 70 + Math.random() * 70;
    return {
      id: i,
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        marginTop: -3,
        marginLeft: -3,
        background: colors[Math.floor(Math.random() * colors.length)],
        borderRadius: 1,
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        opacity: 1,
        transform: "translate(0,0) rotate(0deg) scale(1)",
        transition: "none",
        pointerEvents: "none",
        zIndex: 10,
      },
      animate: {
        transform: `translate(${Math.cos(rad) * dist}px, ${Math.sin(rad) * dist}px) rotate(${Math.random() * 720 - 360}deg) scale(0)`,
        opacity: 0,
      },
      duration: 600 + Math.random() * 500,
      delay: Math.random() * 80,
    };
  });
}

function harryParticles() {
  // Lightning bolts — jagged streaks radiating outward
  const bolts = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * 360 + Math.random() * 30 - 15;
    const rad = (angle * Math.PI) / 180;
    const length = 50 + Math.random() * 60;
    // Build a jagged SVG bolt path
    const segments = 4 + Math.floor(Math.random() * 3);
    let path = "M 0 0 ";
    for (let s = 1; s <= segments; s++) {
      const progress = s / segments;
      const along = progress * length;
      const jag = (Math.random() - 0.5) * 18;
      path += `L ${jag} ${-along} `;
    }
    const svgW = 40;
    const svgH = Math.ceil(length) + 10;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${svgW}' height='${svgH}' viewBox='-20 ${-svgH + 5} ${svgW} ${svgH}'><path d='${path}' fill='none' stroke='%234ECDC4' stroke-width='2.5' stroke-linecap='round'/><path d='${path}' fill='none' stroke='white' stroke-width='1' stroke-linecap='round' opacity='0.6'/></svg>`;
    return {
      id: i,
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: svgW,
        height: svgH,
        marginLeft: -svgW / 2,
        marginTop: -svgH / 2,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/%/g, '%25').replace(/#/g, '%23'))}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        transform: `rotate(${angle - 90}deg) translateY(0px)`,
        opacity: 1,
        transition: "none",
        pointerEvents: "none",
        zIndex: 10,
      },
      animate: {
        transform: `rotate(${angle - 90}deg) translateY(${-length * 0.4}px)`,
        opacity: 0,
      },
      duration: 400 + Math.random() * 300,
      delay: Math.random() * 100,
    };
  });

  // White flash overlay
  const flash = {
    id: 100,
    style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 110,
      height: 110,
      marginTop: -55,
      marginLeft: -55,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(78,205,196,0.3) 50%, transparent 70%)",
      opacity: 1,
      transform: "scale(0.5)",
      transition: "none",
      pointerEvents: "none",
      zIndex: 9,
    },
    animate: {
      opacity: 0,
      transform: "scale(1.6)",
    },
    duration: 500,
    delay: 0,
  };

  return [...bolts, flash];
}

function zaraParticles() {
  // Bubbles floating upward, wobbling, popping at different heights
  const colors = ["#4ECDC4", "rgba(255,255,255,0.6)", "#4ECDC4", "rgba(78,205,196,0.5)", "rgba(255,255,255,0.4)"];
  return Array.from({ length: 18 }, (_, i) => {
    const size = 6 + Math.random() * 14;
    const xDrift = (Math.random() - 0.5) * 80;
    const yRise = -(60 + Math.random() * 90);
    const wobble = (Math.random() - 0.5) * 30;
    return {
      id: i,
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        marginTop: -size / 2,
        marginLeft: -size / 2 + (Math.random() - 0.5) * 30,
        borderRadius: "50%",
        background: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.8,
        transform: "translate(0, 0) scale(1)",
        transition: "none",
        pointerEvents: "none",
        zIndex: 10,
        boxShadow: `inset -${size * 0.15}px -${size * 0.15}px ${size * 0.3}px rgba(0,0,0,0.1), inset ${size * 0.1}px ${size * 0.1}px ${size * 0.2}px rgba(255,255,255,0.3)`,
      },
      animate: {
        transform: `translate(${xDrift + wobble}px, ${yRise}px) scale(0)`,
        opacity: 0,
      },
      duration: 700 + Math.random() * 600,
      delay: Math.random() * 250,
    };
  });
}

function laylaParticles() {
  // Firework: bright center flash + large glowing streaks (150-200px) + secondary sparkle bursts
  const parts = [];
  const streakCount = 14;

  // Center flash
  parts.push({
    id: 0,
    style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 120,
      height: 120,
      marginTop: -60,
      marginLeft: -60,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.4) 40%, transparent 70%)",
      opacity: 1,
      transform: "scale(0.3)",
      transition: "none",
      pointerEvents: "none",
      zIndex: 11,
    },
    animate: {
      opacity: 0,
      transform: "scale(2)",
    },
    duration: 600,
    delay: 0,
  });

  // Stage 1: glowing streaks shooting outward 150-200px
  for (let i = 0; i < streakCount; i++) {
    const angle = (i / streakCount) * 360 + Math.random() * 16 - 8;
    const rad = (angle * Math.PI) / 180;
    const dist = 150 + Math.random() * 60;
    const endX = Math.cos(rad) * dist;
    const endY = Math.sin(rad) * dist;
    const color = Math.random() > 0.45 ? "#FFD700" : "#4ECDC4";
    const size = 8 + Math.random() * 4;
    parts.push({
      id: 1 + i,
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        marginTop: -size / 2,
        marginLeft: -size / 2,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 16px ${color}, 0 0 24px ${color}80`,
        opacity: 1,
        transform: "translate(0, 0) scale(1)",
        transition: "none",
        pointerEvents: "none",
        zIndex: 10,
      },
      animate: {
        transform: `translate(${endX}px, ${endY}px) scale(0.4)`,
        opacity: 0.2,
      },
      duration: 550 + Math.random() * 150,
      delay: Math.random() * 60,
    });

    // Stage 2: 3-4 sparkles per streak, spawning from the streak endpoint
    const sparkCount = 3 + Math.floor(Math.random() * 2);
    for (let j = 0; j < sparkCount; j++) {
      const sparkAngle = angle + (Math.random() - 0.5) * 120;
      const sparkRad = (sparkAngle * Math.PI) / 180;
      const sparkDist = 30 + Math.random() * 50;
      const sparkColor = ["#FFD700", "#4ECDC4", "#fff", "#FFD700"][Math.floor(Math.random() * 4)];
      const sparkSize = 5 + Math.random() * 4;
      parts.push({
        id: 100 + i * 4 + j,
        style: {
          position: "absolute",
          top: "50%",
          left: "50%",
          width: sparkSize,
          height: sparkSize,
          marginTop: endY - sparkSize / 2,
          marginLeft: endX - sparkSize / 2,
          borderRadius: "50%",
          background: sparkColor,
          boxShadow: `0 0 6px ${sparkColor}, 0 0 12px ${sparkColor}80`,
          opacity: 0,
          transform: "translate(0, 0) scale(1)",
          transition: "none",
          pointerEvents: "none",
          zIndex: 10,
        },
        animate: {
          transform: `translate(${Math.cos(sparkRad) * sparkDist}px, ${Math.sin(sparkRad) * sparkDist}px) scale(0)`,
          opacity: 0,
        },
        flashFirst: true,
        duration: 500 + Math.random() * 400,
        delay: 450 + Math.random() * 150,
      });
    }
  }
  return parts;
}

function georgiaParticles() {
  // Galaxy explosion — shockwave ring + 45 glowing stars spiralling outward 200px+
  const parts = [];
  const colors = ["#4ECDC4", "#ffffff", "#9B59B6", "#4ECDC4", "#E5E4E2", "#9B59B6", "#fff"];
  const starCount = 45;

  // Shockwave ring — expands outward from avatar
  parts.push({
    id: 0,
    style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 80,
      height: 80,
      marginTop: -40,
      marginLeft: -40,
      borderRadius: "50%",
      background: "transparent",
      border: "3px solid #4ECDC4",
      boxShadow: "0 0 15px #4ECDC4, 0 0 30px rgba(78,205,196,0.4), inset 0 0 15px rgba(78,205,196,0.2)",
      opacity: 1,
      transform: "scale(0.5)",
      transition: "none",
      pointerEvents: "none",
      zIndex: 9,
    },
    animate: {
      opacity: 0,
      transform: "scale(5)",
    },
    duration: 900,
    delay: 0,
  });

  // Central bright pulse
  parts.push({
    id: 1,
    style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 100,
      height: 100,
      marginTop: -50,
      marginLeft: -50,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(155,89,182,0.6) 0%, rgba(78,205,196,0.3) 40%, transparent 70%)",
      opacity: 1,
      transform: "scale(0.4)",
      transition: "none",
      pointerEvents: "none",
      zIndex: 9,
    },
    animate: {
      opacity: 0,
      transform: "scale(2.5)",
    },
    duration: 700,
    delay: 50,
  });

  // Spiral stars — vortex pattern, large and glowing
  for (let i = 0; i < starCount; i++) {
    const spiralTurns = 2.5;
    const baseAngle = (i / starCount) * 360 * spiralTurns;
    const rad = (baseAngle * Math.PI) / 180;
    const dist = 60 + (i / starCount) * 160 + Math.random() * 30;
    const endX = Math.cos(rad) * dist;
    const endY = Math.sin(rad) * dist;
    const size = 6 + Math.random() * 3;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isStar = Math.random() > 0.35;
    const glowColor = color === "#ffffff" || color === "#E5E4E2" ? "rgba(78,205,196,0.6)" : color;
    parts.push({
      id: 10 + i,
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        marginTop: -size / 2,
        marginLeft: -size / 2,
        borderRadius: isStar ? "1px" : "50%",
        background: color,
        clipPath: isStar ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : "none",
        boxShadow: `0 0 6px ${glowColor}, 0 0 14px ${glowColor}80`,
        opacity: 0,
        transform: `translate(0, 0) rotate(0deg) scale(0.5)`,
        transition: "none",
        pointerEvents: "none",
        zIndex: 10,
      },
      animate: {
        transform: `translate(${endX}px, ${endY}px) rotate(${200 + Math.random() * 400}deg) scale(0)`,
        opacity: 0,
      },
      flashFirst: true,
      duration: 800 + Math.random() * 500,
      delay: (i / starCount) * 350 + Math.random() * 80,
    });
  }
  return parts;
}

const EFFECTS = {
  alexa: alexaParticles,
  harry: harryParticles,
  zara: zaraParticles,
  layla: laylaParticles,
  georgia: georgiaParticles,
};

/* ── Component ──────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const [particles, setParticles] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const containerRefs = useRef([]);

  const handleClick = useCallback(
    (user, index) => {
      if (animatingIndex !== null) return; // block double-clicks

      setAnimatingIndex(index);

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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = containerRefs.current[index];
          if (!container) return;
          const els = container.querySelectorAll("[data-particle]");
          els.forEach((el) => {
            const pId = parseInt(el.dataset.particle, 10);
            const p = parts.find((pp) => pp.id === pId);
            if (!p) return;

            // If flashFirst, first bring opacity to 1
            if (p.flashFirst) {
              el.style.opacity = "1";
            }

            el.style.transition = `transform ${p.duration}ms cubic-bezier(0.2, 0.8, 0.3, 1), opacity ${p.duration * 0.7}ms ease-out ${p.duration * 0.3}ms`;
            el.style.transitionDelay = `${p.delay}ms`;
            Object.assign(el.style, p.animate);
          });
        });
      });

      // Navigate after animation
      const maxDuration = Math.max(...parts.map((p) => p.duration + p.delay)) + 100;
      const navDelay = Math.min(Math.max(maxDuration, 800), 1600);
      setTimeout(() => {
        setAnimatingIndex(null);
        setParticles([]);
        navigate(`/app/${user.slug}`);
      }, navDelay);
    },
    [animatingIndex, navigate]
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
                    src={`/avatars/${user.slug}.png`}
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
