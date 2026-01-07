// question.model.js
const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // e.g. 'A'
  text: { type: String, required: true },
  imageUrl: { type: String } // optional per option
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  type: { type: String, enum: ['mcq_single','mcq_multi','image_mcq'], default: 'mcq_single' },
  stem: { type: String, required: true },
  imageUrl: { type: String },
  options: { type: [OptionSchema], required: true },
  correct: { type: [String], required: true }, // array of option ids
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
