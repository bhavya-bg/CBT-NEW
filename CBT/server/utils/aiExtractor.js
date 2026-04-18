const OpenAI = require("openai");

const questionSplitter = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const questions = [];
  let current = { question: "", options: { A: "", B: "", C: "", D: "" }, correct: "" };
  let optionLabel = "";

  for (const line of lines) {
    const questionMatch = line.match(/^\d+\.|^Q\.|^Question\s*\d+/i);
    const optionMatch = line.match(/^(A|B|C|D)[\)\.\-]\s*(.*)/i);
    const answerMatch = line.match(/^Answer\s*[:\-]\s*([ABCD])/i);

    if (questionMatch && !optionMatch) {
      if (current.question) {
        questions.push({ ...current });
      }
      current = {
        question: line.replace(/^\d+\.|^Q\.|^Question\s*\d+/i, "").trim(),
        options: { A: "", B: "", C: "", D: "" },
        correct: "",
      };
      optionLabel = "";
      continue;
    }

    if (optionMatch) {
      optionLabel = optionMatch[1].toUpperCase();
      current.options[optionLabel] = optionMatch[2].trim();
      continue;
    }

    if (answerMatch) {
      current.correct = answerMatch[1].toUpperCase();
      continue;
    }

    if (current.question && optionLabel) {
      current.options[optionLabel] = `${current.options[optionLabel]} ${line}`.trim();
    }
  }

  if (current.question) {
    questions.push({ ...current });
  }

  return questions.filter(
    (q) => q.question && q.options.A && q.options.B && q.options.C && q.options.D,
  );
};

const cleanJsonFromText = (rawText) => {
  const cleaned = (rawText || "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) return null;

  try {
    return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  } catch (error) {
    console.warn("AI JSON parse failed", error.message);
    return null;
  }
};

const normalizeQuestions = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      question: (item.question || "").trim(),
      options: {
        A: (item.options?.A || item.options?.a || "").trim(),
        B: (item.options?.B || item.options?.b || "").trim(),
        C: (item.options?.C || item.options?.c || "").trim(),
        D: (item.options?.D || item.options?.d || "").trim(),
      },
      correct: String(item.correct || "A").toUpperCase(),
    }))
    .filter(
      (q) =>
        q.question &&
        q.options.A &&
        q.options.B &&
        q.options.C &&
        q.options.D &&
        ["A", "B", "C", "D"].includes(q.correct),
    );

const createExtractionPrompt = (text) => `You are an MCQ extraction engine.

Extract ONLY MCQ questions present in the provided PDF text.
Do not invent or infer new questions/options.
If a question is incomplete (missing any option), skip it.
If correct answer is missing in text, set correct to "A".

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct": "A"
    }
  ]
}

PDF text:
${text}`;

const extractWithOpenAI = async (text) => {
  const openAIKey = process.env.OPENAI_API_KEY || process.env.openai_API_KEY;
  if (!openAIKey) return null;

  try {
    const client = new OpenAI({ 
      apiKey: openAIKey,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: createExtractionPrompt(text) }],
      temperature: 0,
    });
    
    const raw = response.choices[0]?.message?.content || "";
    const parsed = cleanJsonFromText(raw);
    const normalized = normalizeQuestions(parsed?.questions);
    if (normalized.length > 0) {
      return { questions: normalized, source: "openai" };
    }
  } catch (error) {
    console.warn("OpenAI extraction failed, falling back to Gemini/parser.", error.message);
  }

  return null;
};

const extractWithGemini = async (text) => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: createExtractionPrompt(text) }] }],
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errBody}`);
    }

    const data = await response.json();
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      "";

    const parsed = cleanJsonFromText(raw);
    const normalized = normalizeQuestions(parsed?.questions);
    if (normalized.length > 0) {
      return { questions: normalized, source: "gemini" };
    }
  } catch (error) {
    console.warn("Gemini extraction failed, falling back to local parser.", error.message);
  }

  return null;
};

const extractQuestions = async (text) => {
  const trimmedText = (text || "").trim();
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY || process.env.openai_API_KEY);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  if (!trimmedText) {
    return {
      questions: [],
      source: "none",
      attemptedOpenAI: hasOpenAIKey,
      attemptedGemini: hasGeminiKey,
    };
  }

  const openAIResult = await extractWithOpenAI(trimmedText);
  if (openAIResult?.questions?.length) {
    return {
      ...openAIResult,
      attemptedOpenAI: hasOpenAIKey,
      attemptedGemini: hasGeminiKey,
    };
  }

  const geminiResult = await extractWithGemini(trimmedText);
  if (geminiResult?.questions?.length) {
    return {
      ...geminiResult,
      attemptedOpenAI: hasOpenAIKey,
      attemptedGemini: hasGeminiKey,
    };
  }

  const questions = questionSplitter(trimmedText);
  if (questions.length > 0) {
    return {
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correct || "A",
      })),
      source: "parser",
      attemptedOpenAI: hasOpenAIKey,
      attemptedGemini: hasGeminiKey,
    };
  }

  return {
    questions: [],
    source: "none",
    attemptedOpenAI: hasOpenAIKey,
    attemptedGemini: hasGeminiKey,
  };
};

module.exports = { extractQuestions };
