const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const SUBJECTS = {
  maths: "Mathematics",
  english_lang: "English Language",
  english_lit: "English Literature",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  geography: "Geography",
  history: "History",
  computer_science: "Computer Science",
  english: "English",
  french: "French",
  spanish: "Spanish",
  business: "Business",
  combined_science: "Combined Science",
  edexcel_maths: "Mathematics",
  edexcel_chemistry: "Chemistry",
  edexcel_physics: "Physics",
  edexcel_geography: "Geography",
  pe: "Physical Education",
  psychology: "Psychology",
  arabic: "Arabic",
};

const SCIENCE_SUBJECTS = new Set(["Biology", "Chemistry", "Physics", "Combined Science"]);

// Only accept the documented spec fields, and only as plain strings / string arrays.
function normaliseSpec(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.label !== "string" || !raw.label.trim()) return null;
  const str = (v) => (typeof v === "string" ? v.trim() : "");
  return {
    code: str(raw.code),
    label: str(raw.label),
    tier: str(raw.tier),
    papers: str(raw.papers),
    notes: str(raw.notes),
    commandWords: Array.isArray(raw.commandWords)
      ? raw.commandWords.filter((w) => typeof w === "string" && w.trim()).map((w) => w.trim())
      : [],
  };
}

function specContext(spec) {
  const parts = [spec.papers, spec.notes].filter(Boolean).join(" ");
  return parts ? `\nExam context: ${parts}\n` : "";
}

function markShapeRule(subjectName) {
  if (SCIENCE_SUBJECTS.has(subjectName)) {
    return "\n5. Mark allocations that follow the real paper shape: 1 to 6 marks for structured items, with at least one 6-mark extended response in the set";
  }
  if (subjectName === "Geography") {
    return "\n5. Mark allocations that follow the real paper shape: 1 to 6 marks for structured items, with at least one 8-mark \"Evaluate\" or \"Assess\" extended response in the set";
  }
  return "";
}

function buildPrompt(subjectName, topic, tier, board, branch, spec, subjectKey) {
  // For combined science with a branch, show e.g. "Combined Science: Biology"
  const displaySubject = branch
    ? `${subjectName}: ${branch.charAt(0).toUpperCase() + branch.slice(1)}`
    : subjectName;

  if (spec) {
    const commandWords = spec.commandWords.length
      ? spec.commandWords.join(", ")
      : "Calculate, Explain, Describe, Evaluate, Compare";
    return `You are a ${spec.label} exam question expert. Your job is to generate the 8 most likely exam questions for the upcoming ${spec.label} exam, specifically on the topic "${topic}"${tier ? ` at ${tier} tier` : ""}.
${specContext(spec)}
Base these on patterns from the last 5 years of ${spec.label} past papers. Focus on:
- Questions that appear most frequently on this specification's papers
- Command words drawn from this list: ${commandWords}
- Topics that are statistically most examined
- The exact style and mark allocation of real ${spec.label} papers

For each question, provide:
1. The question exactly as it might appear on the paper
2. The mark allocation
3. A model answer that would achieve full marks
4. An examiner tip for maximizing marks${markShapeRule(subjectName)}

Respond ONLY with valid JSON in this exact format, no markdown, no backticks:
[
  {
    "id": 1,
    "question": "...",
    "marks": 4,
    "command_word": "Explain",
    "frequency": "Very High",
    "model_answer": "...",
    "examiner_tip": "..."
  }
]`;
  }

  const isCambridge = board === "Cambridge IGCSE";
  // Legacy Edexcel Maths note: only when no spec is supplied and the subject really is 4MA1.
  const isEdexcelMaths = board === "Edexcel IGCSE" && subjectKey === "edexcel_maths";
  const examLabel = isEdexcelMaths
    ? "Pearson Edexcel IGCSE Mathematics Specification A (4MA1) Higher Tier"
    : isCambridge ? "Cambridge IGCSE" : "GCSE";
  const paperSource = isEdexcelMaths
    ? "Pearson Edexcel IGCSE Maths Spec A (4MA1) past papers"
    : isCambridge
    ? "Cambridge IGCSE past papers"
    : "AQA, Edexcel, and OCR past papers";

  const edexcelNote = isEdexcelMaths
    ? `\nIMPORTANT: This is Edexcel IGCSE Maths, NOT Cambridge IGCSE. Both Paper 1H and Paper 2H are calculator-allowed (2 hours each), but questions still test non-calculator skills — students must show full working. Questions should reflect Edexcel past paper style, not Cambridge.\n`
    : "";

  return `You are a ${examLabel} exam question expert. Your job is to generate the 8 most likely exam questions for the upcoming ${isEdexcelMaths ? "Edexcel IGCSE" : examLabel} ${displaySubject} exam, specifically on the topic "${topic}"${tier ? ` at ${tier} tier` : ""}.
${edexcelNote}
Base these on patterns from the last 5 years of ${paperSource}. Focus on:
- Questions that appear most frequently across exam boards
- Common command words (Calculate, Explain, Describe, Evaluate, Compare)
- Topics that are statistically most examined
- The exact style and mark allocation of real ${examLabel} papers

For each question, provide:
1. The question exactly as it might appear on the paper
2. The mark allocation
3. A model answer that would achieve full marks
4. An examiner tip for maximizing marks

Respond ONLY with valid JSON in this exact format, no markdown, no backticks:
[
  {
    "id": 1,
    "question": "...",
    "marks": 4,
    "command_word": "Explain",
    "frequency": "Very High",
    "model_answer": "...",
    "examiner_tip": "..."
  }
]`;
}

function buildPracticePrompt(subjectName, topic, originalQuestion, marks, commandWord, board, branch, spec, subjectKey) {
  const displaySubject = branch
    ? `${subjectName}: ${branch.charAt(0).toUpperCase() + branch.slice(1)}`
    : subjectName;

  let examLabel;
  let leadLabel;
  let note;
  if (spec) {
    examLabel = spec.label;
    leadLabel = spec.label;
    const words = spec.commandWords.length ? ` Command words on this paper include: ${spec.commandWords.join(", ")}.` : "";
    note = `${specContext(spec).replace(/\n/g, " ").trimEnd()}${words}`;
  } else {
    const isCambridge = board === "Cambridge IGCSE";
    const isEdexcelMaths = board === "Edexcel IGCSE" && subjectKey === "edexcel_maths";
    examLabel = isEdexcelMaths
      ? "Pearson Edexcel IGCSE Mathematics Specification A (4MA1) Higher Tier"
      : isCambridge ? "Cambridge IGCSE" : "GCSE";
    leadLabel = `${isEdexcelMaths ? "Edexcel IGCSE" : examLabel} ${displaySubject}`;
    note = isEdexcelMaths
      ? ` Both papers are calculator-allowed but students must show full working. Use Edexcel past paper style, not Cambridge.`
      : "";
  }

  return `You are a ${examLabel} exam question expert. Generate exactly 1 new practice question for ${leadLabel} on the topic "${topic}".${note}

The question must:
- Be worth ${marks} marks
- Use the command word "${commandWord}"
- Cover the same topic area but use different numbers, context, or scenario than this original question: "${originalQuestion}"
- Match the exact style of real ${examLabel} papers

Respond ONLY with valid JSON in this exact format, no markdown, no backticks:
[
  {
    "id": 1,
    "question": "...",
    "marks": ${marks},
    "command_word": "${commandWord}",
    "frequency": "Practice",
    "model_answer": "...",
    "examiner_tip": "..."
  }
]`;
}

function parseQuestions(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("No JSON array in model output");
  const parsed = JSON.parse(clean.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Model output is not an array");
  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subject, topic, tier, board, branch, mode, originalQuestion, marks, commandWord } = req.body || {};
  const spec = normaliseSpec(req.body?.spec);

  const subjectName = SUBJECTS[subject];
  if (!subjectName || !topic) {
    return res.status(400).json({ error: "Missing subject or topic" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const isPractice = mode === "practice";

  if (isPractice && (!originalQuestion || !marks || !commandWord)) {
    return res.status(400).json({ error: "Missing practice question parameters" });
  }

  const prompt = isPractice
    ? buildPracticePrompt(subjectName, topic, originalQuestion, marks, commandWord, board || "GCSE", branch || null, spec, subject)
    : buildPrompt(subjectName, topic, subjectName === "Mathematics" ? tier : null, board || "GCSE", branch || null, spec, subject);

  let text;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: isPractice ? 1000 : 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    text = (data.content || [])
      .map((i) => i.text || "")
      .filter(Boolean)
      .join("");
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate questions" });
  }

  try {
    return res.status(200).json(parseQuestions(text));
  } catch (e) {
    return res.status(502).json({ error: "Model returned invalid JSON" });
  }
}
