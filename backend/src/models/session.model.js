// session.model.js
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  selected: { type: [String] }, // array of option ids
  answeredAt: { type: Date, default: Date.now },
  timeTakenSec: { type: Number, default: 0 }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionOrder: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  currentIndex: { type: Number, default: 0 },
  answers: { type: [AnswerSchema], default: [] },
  startedAt: { type: Date, default: Date.now },
  endsAt: { type: Date },
  status: { type: String, enum: ['in_progress','completed','abandoned'], default: 'in_progress' },
  uploadToken: { type: String } // optional
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
