// Calls api/generate.js directly (no Vercel) for the three new Edexcel IGCSE subjects.
// Usage: node scripts/verify-generate.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Load .env manually
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const { default: handler } = await import("../api/generate.js");
const { EDEXCEL_IGCSE_SUBJECTS } = await import("../src/userConfig.js");

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const CASES = [
  ["edexcel_chemistry", "Electrolysis"],
  ["edexcel_physics", "Movement & position"],
  ["edexcel_geography", "Coastal environments"],
];
const FIELDS = ["question", "marks", "command_word", "model_answer", "examiner_tip"];

let failures = 0;
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is missing from .env; cannot run live checks.");
  process.exit(2);
}

for (const [subject, topic] of CASES) {
  const req = {
    method: "POST",
    body: { subject, topic, board: "Edexcel IGCSE", spec: EDEXCEL_IGCSE_SUBJECTS[subject].spec },
  };
  const res = mockRes();
  const t0 = Date.now();
  await handler(req, res);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const data = res.body;
  const problems = [];
  if (res.statusCode !== 200) problems.push(`status ${res.statusCode}: ${JSON.stringify(data).slice(0, 300)}`);
  else if (!Array.isArray(data)) problems.push("response is not an array");
  else {
    if (data.length !== 8) problems.push(`expected 8 questions, got ${data.length}`);
    data.forEach((q, i) => {
      const missing = FIELDS.filter((f) => q[f] === undefined || q[f] === null || q[f] === "");
      if (missing.length) problems.push(`Q${i + 1} missing ${missing.join(", ")}`);
    });
  }
  console.log(`\n── ${subject} / ${topic} (${secs}s) ──`);
  if (problems.length) {
    failures++;
    console.log("FAIL:\n  " + problems.join("\n  "));
  } else {
    console.log(`PASS: 8 questions, marks [${data.map((q) => q.marks).join(", ")}]`);
    console.log(`Q1 [${data[0].marks} marks, ${data[0].command_word}]: ${data[0].question}`);
  }
}

process.exit(failures ? 1 : 0);
