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
};

function buildPrompt(subjectName, topic, tier) {
  return `You are a GCSE exam question expert. Your job is to generate the 8 most likely exam questions for the upcoming GCSE ${subjectName} exam, specifically on the topic "${topic}"${tier ? ` at ${tier} tier` : ""}.

Base these on patterns from the last 5 years of AQA, Edexcel, and OCR past papers. Focus on:
- Questions that appear most frequently across exam boards
- Common command words (Calculate, Explain, Describe, Evaluate, Compare)
- Topics that are statistically most examined
- The exact style and mark allocation of real GCSE papers

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subject, topic, tier } = req.body;

  const subjectName = SUBJECTS[subject];
  if (!subjectName || !topic) {
    return res.status(400).json({ error: "Missing subject or topic" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

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
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: buildPrompt(
              subjectName,
              topic,
              subjectName === "Mathematics" ? tier : null
            ),
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
