import { useSyncExternalStore } from "react";

// Theme follows the device (prefers-color-scheme) until the user taps the toggle.
// The manual choice is stored per device and wins from then on.
// The initial value is set before first paint by the inline script in index.html.

export const THEME_KEY = "ui:theme";
const THEME_COLOR = { light: "#F7F6F2", dark: "#0B0B10" };
const EVENT = "ui:themechange";

const media = () => window.matchMedia?.("(prefers-color-scheme: light)");

export function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  window.dispatchEvent(new Event(EVENT));
}

export function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme(theme);
}

// Live device changes apply only while no manual override is stored.
let listening = false;
export function initTheme() {
  const root = document.documentElement;
  const initial = readStoredTheme() || (media()?.matches ? "light" : "dark");
  if (root.dataset.theme !== initial) applyTheme(initial);
  else document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[initial]);
  if (listening) return;
  listening = true;
  media()?.addEventListener?.("change", (e) => {
    if (!readStoredTheme()) applyTheme(e.matches ? "light" : "dark");
  });
}

export function onThemeChange(cb) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useTheme() {
  return useSyncExternalStore(onThemeChange, getTheme, () => "dark");
}

// Resolve a design token to its current value, for canvas and inline effects that cannot use var().
export function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// "#RRGGBB" or "rgb(...)" token to "r,g,b"
export function tokenRgb(name) {
  const v = readToken(name);
  if (v.startsWith("#")) {
    const h = v.slice(1);
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }
  const m = v.match(/\d+(\.\d+)?/g);
  return m ? m.slice(0, 3).join(",") : "242,241,236";
}

// Peak opacity multiplier for full-screen washes and ambient glows (1 in dark, lower in light).
export function flashOpacity() {
  const v = parseFloat(readToken("--flash-opacity"));
  return Number.isFinite(v) ? v : 1;
}
