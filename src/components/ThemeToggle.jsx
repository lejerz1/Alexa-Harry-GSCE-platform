import { Sun, Moon } from "lucide-react";
import { setTheme, useTheme } from "../theme";

// Two-state light/dark toggle. Sun in dark mode (tap for light), Moon in light mode (tap for dark).
export default function ThemeToggle({ style }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;
  return (
    <button
      type="button"
      className="btn btn-ghost theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
      style={{ width: 40, height: 40, minHeight: 40, padding: 0, flexShrink: 0, ...style }}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
