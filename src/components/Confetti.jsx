import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";

const COUNT = 110;
const DURATION = 900;

// Hand-rolled canvas confetti. `origin` = { x, y } for a small burst, or null for a full-width burst.
export default function Confetti({ origin = null, colors = ["#5BD0C3", "#4ADE80", "#F2F1EC"], onDone }) {
  const canvasRef = useRef(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      onDone?.();
      return undefined;
    }
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const small = !!origin;
    const parts = Array.from({ length: COUNT }, () => {
      let x, y, vx, vy;
      if (small) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const speed = 260 + Math.random() * 420;
        x = origin.x; y = origin.y;
        vx = Math.cos(angle) * speed; vy = Math.sin(angle) * speed;
      } else {
        x = Math.random() * w; y = h * (0.25 + Math.random() * 0.2);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const speed = 380 + Math.random() * 520;
        vx = Math.cos(angle) * speed; vy = Math.sin(angle) * speed;
      }
      return {
        x, y, vx, vy,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < 0.6 ? "rect" : "dot",
      };
    });

    const GRAVITY = 1400; // px/s²
    const DRAG = 2.2;     // per second
    let raf;
    let last = performance.now();
    const start = last;
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const t = (now - start) / DURATION;
      ctx.clearRect(0, 0, w, h);
      const alpha = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3);
      for (const p of parts) {
        p.vx -= p.vx * DRAG * dt;
        p.vy -= p.vy * DRAG * dt;
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (t < 1) raf = requestAnimationFrame(frame);
      else onDone?.();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 10000 }}
    />
  );
}
