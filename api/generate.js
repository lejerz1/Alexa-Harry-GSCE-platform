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
};

function buildPrompt(subjectName, topic, tier, board, branch) {
  const isCambridge = board === "Cambridge IGCSE";
  const examLabel = isCambridge ? "Cambridge IGCSE" : "GCSE";
  const paperSource = isCambridge
    ? "Cambridge IGCSE past papers"
    : "AQA, Edexcel, and OCR past papers";

  // For combined science with a branch, show e.g. "Combined Science: Biology"
  const displaySubject = branch
    ? `${subjectName}: ${branch.charAt(0).toUpperCase() + branch.slice(1)}`
    : subjectName;

  return `You are a ${examLabel} exam question expert. Your job is to generate the 8 most likely exam questions for the upcoming ${examLabel} ${displaySubject} exam, specifically on the topic "${topic}"${tier ? ` at ${tier} tier` : ""}.

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

function buildPracticePrompt(subjectName, topic, originalQuestion, marks, commandWord, board, branch) {
  const isCambridge = board === "Cambridge IGCSE";
  const examLabel = isCambridge ? "Cambridge IGCSE" : "GCSE";

  const displaySubject = branch
    ? `${subjectName}: ${branch.charAt(0).toUpperCase() + branch.slice(1)}`
    : subjectName;

  return `You are a ${examLabel} exam question expert. Generate exactly 1 new practice question for ${examLabel} ${displaySubject} on the topic "${topic}".

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subject, topic, tier, board, branch, mode, originalQuestion, marks, commandWord } = req.body;

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
    ? buildPracticePrompt(subjectName, topic, originalQuestion, marks, commandWord, board || "GCSE", branch || null)
    : buildPrompt(subjectName, topic, subjectName === "Mathematics" ? tier : null, board || "GCSE", branch || null);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
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
    const text = data.content
      .map((i) => i.text || "")
      .filter(Boolean)
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    return res.status(200).json(questions);
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate questions" });
  }
}
