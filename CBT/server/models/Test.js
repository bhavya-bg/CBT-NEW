const mongoose = require("mongoose");
const questionSchema = require("./Question");

const testSchema = new mongoose.Schema({
  title: { type: String, default: "PDF CBT Test" },
  description: { type: String, default: "Generated from uploaded PDF" },
  questions: { type: [questionSchema], default: [] },
  marksForCorrect: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  timerMinutes: { type: Number, default: 10 },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Test", testSchema);
