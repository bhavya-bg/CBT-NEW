const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  A: { type: String, required: true },
  B: { type: String, required: true },
  C: { type: String, required: true },
  D: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: optionSchema, required: true },
  correct: { type: String, enum: ["A", "B", "C", "D"], required: true },
});

module.exports = questionSchema;
