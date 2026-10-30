import {
  BookOpen, Calculator, TrendingUp, Landmark, Microscope, FlaskConical, Atom, Globe2, Monitor,
  Dumbbell, Brain, Languages, Flame, Check, Minus, X,
} from "lucide-react";

export const LUCIDE_ICONS = {
  BookOpen, Calculator, TrendingUp, Landmark, Microscope, FlaskConical, Atom, Globe2, Monitor,
  Dumbbell, Brain, Languages, Flame, Check, Minus, X,
};

// Icons are thin strokes, so a raw subject colour is drawn as --accent-ink (darkened in light mode).
function inkStyle(color) {
  if (!color || color === "currentColor" || color.startsWith("var(")) return { color };
  return { "--accent": color, color: "var(--accent-ink)" };
}

export default function SubjectIcon({ icon, size = 36, color = "currentColor", strokeWidth = 1.5 }) {
  const LucideComponent = LUCIDE_ICONS[icon];
  if (LucideComponent) return <LucideComponent size={size} color="currentColor" strokeWidth={strokeWidth} aria-hidden="true" style={inkStyle(color)} />;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}
