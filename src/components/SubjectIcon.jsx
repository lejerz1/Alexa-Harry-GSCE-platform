import {
  BookOpen, Calculator, TrendingUp, Landmark, Microscope, FlaskConical, Atom, Globe2, Monitor,
  Dumbbell, Brain, Languages, Flame, Check, Minus, X,
} from "lucide-react";

export const LUCIDE_ICONS = {
  BookOpen, Calculator, TrendingUp, Landmark, Microscope, FlaskConical, Atom, Globe2, Monitor,
  Dumbbell, Brain, Languages, Flame, Check, Minus, X,
};

export default function SubjectIcon({ icon, size = 36, color = "currentColor", strokeWidth = 1.5 }) {
  const LucideComponent = LUCIDE_ICONS[icon];
  if (LucideComponent) return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} aria-hidden="true" />;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
}
