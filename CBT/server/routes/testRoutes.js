const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Test = require("../models/Test");
const Result = require("../models/Result");
const { extractQuestions } = require("../utils/aiExtractor");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === ".pdf");
  },
});

router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const { title, description, marksForCorrect, negativeMarks, timerMinutes } =
      req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const extracted = await extractQuestions(pdfData.text || "");
    if (!Array.isArray(extracted.questions) || extracted.questions.length === 0) {
      return res.status(400).json({
        message:
          "No valid MCQ questions could be extracted from this PDF. Please upload a clearer MCQ PDF.",
        extractionSource: extracted.source || "none",
        attemptedOpenAI: Boolean(extracted.attemptedOpenAI),
        attemptedGemini: Boolean(extracted.attemptedGemini),
      });
    }

    const test = new Test({
      title: title || "PDF CBT Test",
      description: description || "Generated from uploaded PDF",
      questions: extracted.questions,
      marksForCorrect: Number(marksForCorrect) || 1,
      negativeMarks: Number(negativeMarks) || 0,
      timerMinutes: Number(timerMinutes) || 10,
      published: false,
    });

    await test.save();

    res.json({
      testId: test._id,
      test,
      extractionSource: extracted.source || "none",
      attemptedOpenAI: Boolean(extracted.attemptedOpenAI),
      attemptedGemini: Boolean(extracted.attemptedGemini),
    });
  } catch (error) {
    console.error("Upload PDF error:", error);
    res.status(500).json({
      message: "Failed to upload and parse PDF",
      error: error.message,
    });
  }
});

router.put("/test/:id/questions", async (req, res) => {
  try {
    const { questions, title, description, marksForCorrect, negativeMarks, timerMinutes, published } =
      req.body;

    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (Array.isArray(questions) && questions.length > 0) {
      test.questions = questions.map((item) => ({
        question: item.question,
        options: {
          A: item.options?.A || "",
          B: item.options?.B || "",
          C: item.options?.C || "",
          D: item.options?.D || "",
        },
        correct: ["A", "B", "C", "D"].includes(item.correct) ? item.correct : "A",
      }));
    }

    if (typeof title === "string") test.title = title;
    if (typeof description === "string") test.description = description;
    if (marksForCorrect !== undefined) test.marksForCorrect = Number(marksForCorrect) || 1;
    if (negativeMarks !== undefined) test.negativeMarks = Number(negativeMarks) || 0;
    if (timerMinutes !== undefined) test.timerMinutes = Number(timerMinutes) || 10;
    if (typeof published === "boolean") test.published = published;

    await test.save();
    res.json(test);
  } catch (error) {
    console.error("Update test questions error:", error);
    res
      .status(500)
      .json({ message: "Failed to update test", error: error.message });
  }
});

router.get("/test/:id", async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    res.json(test);
  } catch (error) {
    console.error("Get test error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch test", error: error.message });
  }
});

router.post("/submit-test", async (req, res) => {
  try {
    const { testId, answers, timeTakenSeconds } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });
    if (!test.published) {
      return res.status(400).json({ message: "Test is not published yet" });
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let score = 0;
    const answerMap = answers || {};

    test.questions.forEach((question) => {
      const questionId = question._id?.toString();
      const selected = answerMap[questionId];
      if (!selected) {
        unansweredCount += 1;
        return;
      }
      if (selected === question.correct) {
        correctCount += 1;
        score += test.marksForCorrect;
      } else {
        incorrectCount += 1;
        score -= test.negativeMarks;
      }
    });

    const totalQuestions = test.questions.length;
    const accuracy =
      totalQuestions > 0
        ? Number(((correctCount / totalQuestions) * 100).toFixed(2))
        : 0;

    const result = new Result({
      test: test._id,
      answers: answerMap,
      score,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
    });

    await result.save();

    const questionsWithIds = test.questions.map((question) => ({
      qId: question._id?.toString(),
      question: question.question,
      options: question.options,
      correct: question.correct,
    }));

    res.json({
      score,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy,
      timeTakenSeconds: result.timeTakenSeconds,
      answers: answerMap,
      questions: questionsWithIds,
    });
  } catch (error) {
    console.error("Submit test error:", error);
    res
      .status(500)
      .json({ message: "Failed to submit test", error: error.message });
  }
});

module.exports = router;
