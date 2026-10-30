// WCAG 2.x contrast check for the light theme tokens.
// Usage: node scripts/verify-contrast.mjs
// Token values are hard-coded here on purpose (they mirror :root[data-theme="light"] in src/index.css);
// keep them in step when the CSS changes. Subject and user accents come from src/userConfig.js.
import { SUBJECT_PALETTE, USER_PROFILES } from "../src/userConfig.js";

const INK = "#15161C"; // --accent-ink = color-mix(in srgb, var(--accent) 62%, #15161C)
const INK_MIX = 0.62;

const BG = {
  "--bg-0": "#F7F6F2",
  "--bg-1": "#FFFFFF",
  "--bg-2": "#F0EFEA",
};

// [token, value, alpha, minimum ratio, role]
const TEXT = [
  ["--text", INK, 1, 4.5, "body text"],
  ["--text-2", INK, 0.68, 4.5, "body text"],
  ["--text-3", INK, 0.48, 3.0, "labels, 12px+ at weight 500+"],
  ["--ok", "#147A3A", 1, 4.5, "text and 16% tints"],
  ["--warn", "#AC4F08", 1, 4.5, "text and 16% tints"],
  ["--bad", "#B91C1C", 1, 4.5, "text and 16% tints"],
];

const hex = (h) => {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? [...s].map((c) => c + c).join("") : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t)); // t of a, rest b, in sRGB
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg, bg) => {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};
const fmt = (r) => r.toFixed(2).padStart(6);
const pad = (s, n) => String(s).padEnd(n);

let failures = 0;
const mark = (r, min) => {
  if (r >= min) return "pass";
  failures++;
  return "FAIL";
};

console.log("Light theme text tokens (alpha composited over each background)\n");
console.log(pad("token", 10), pad("value", 22), ...Object.keys(BG).map((k) => pad(k, 14)), "min   role");
for (const [name, value, alpha, min, role] of TEXT) {
  const cells = Object.values(BG).map((bg) => {
    const fg = mix(hex(value), hex(bg), alpha);
    const r = ratio(fg, hex(bg));
    return pad(`${fmt(r)} ${mark(r, min)}`, 14);
  });
  const shown = alpha < 1 ? `${value} @ ${alpha}` : value;
  console.log(pad(name, 10), pad(shown, 22), ...cells, `${min.toFixed(1)}   ${role}`);
}

// Status colours also sit as label text on their own tint: the chosen self-assessment button
// (16% over --bg-2, 14px weight 600) and the quiz nav dots (22% over --bg-1, 12px weight 600).
// Both are labels, so the 3:1 minimum applies.
console.log("\nStatus colour as label text on its own tint (min 3.0)\n");
for (const [name, value] of TEXT.filter(([n]) => ["--ok", "--warn", "--bad"].includes(n))) {
  const cells = [[0.16, "--bg-2"], [0.22, "--bg-1"]].map(([t, bg]) => {
    const tint = mix(hex(value), hex(BG[bg]), t);
    const r = ratio(hex(value), tint);
    return `${Math.round(t * 100)}% over ${bg} ${toHex(tint)} ${fmt(r)} ${mark(r, 3.0)}`;
  });
  console.log(pad(name, 10), pad(value, 9), cells.join("   "));
}

// --accent-ink is used for subject names, spec chips, breadcrumbs, labels and ring strokes.
// Treated as label text: 3:1 minimum, 4.5:1 reported for reference.
const accents = [
  ...Object.entries(SUBJECT_PALETTE).map(([k, v]) => [`subject:${k}`, v]),
  ...Object.entries(USER_PROFILES).map(([k, p]) => [`user:${k}`, p.accent]).filter(([, v]) => v),
];
console.log("\n--accent-ink on --bg-1 (#FFFFFF): label minimum 3.0, body 4.5 for reference\n");
console.log(pad("source", 26), pad("accent", 9), pad("ink", 9), "ratio   3.0    4.5");
const bg1 = hex(BG["--bg-1"]);
for (const [name, value] of accents) {
  const ink = mix(hex(value), hex(INK), INK_MIX);
  const r = ratio(ink, bg1);
  console.log(pad(name, 26), pad(value, 9), pad(toHex(ink), 9), fmt(r), "", pad(mark(r, 3.0), 6), r >= 4.5 ? "pass" : "below");
}

console.log(failures ? `\n${failures} failure(s)` : "\nAll required minimums met.");
process.exit(failures ? 1 : 0);
