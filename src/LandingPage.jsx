import { useState } from "react";
import { useNavigate } from "react-router-dom";

const USERS = [
  { slug: "alexa", name: "Alexa" },
  { slug: "harry", name: "Harry" },
  { slug: "zara", name: "Zara" },
  { slug: "layla", name: "Layla" },
  { slug: "georgia", name: "Georgia" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
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
        {USERS.map((user, i) => (
          <div
            key={user.slug}
            onClick={() => navigate(`/app/${user.slug}`)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hoveredIndex === i ? "scale(1.1)" : "scale(1)",
              animation: "fadeSlideUp 0.5s ease both",
              animationDelay: `${0.15 + i * 0.08}s`,
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                overflow: "hidden",
                border: hoveredIndex === i
                  ? "3px solid #4ECDC4"
                  : "3px solid rgba(255,255,255,0.08)",
                boxShadow: hoveredIndex === i
                  ? "0 0 24px rgba(78,205,196,0.35)"
                  : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <img
                src={`/avatars/${user.slug}.png`}
                alt={user.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: hoveredIndex === i ? "#4ECDC4" : "rgba(240,237,230,0.7)",
                fontFamily: "'Syne', sans-serif",
                transition: "color 0.3s ease",
                letterSpacing: "-0.01em",
              }}
            >
              {user.name}
            </span>
          </div>
        ))}
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
