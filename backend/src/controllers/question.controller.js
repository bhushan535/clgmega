const Question = require('../models/question.model');
const Exam = require('../models/exam.model');
const mongoose = require('mongoose');

exports.addQuestionToExam = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ error: 'invalid examId' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'exam not found' });
    }

    // ensure teacher is creator
    if (!req.user || (String(exam.createdBy) !== String(req.user._id) && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // 🔥 MATCH FRONTEND PAYLOAD
    const {
      type = 'mcq_single',
      stem,
      options,
      correct,
      marks = 1,
      negativeMarks = 0
    } = req.body;

    if (!stem) {
      return res.status(400).json({ error: 'question text required' });
    }

    // parse JSON strings (FormData sends strings)
    const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    const parsedCorrect = typeof correct === 'string' ? JSON.parse(correct) : correct;

    const qdoc = await Question.create({
      examId,
      type,
      stem,
      options: parsedOptions,
      correct: parsedCorrect,
      marks,
      negativeMarks,
      createdBy: req.user._id
    });

    return res.json({ status: 'ok', question: qdoc });
  } catch (err) {
    console.error('addQuestionToExam', err);
    return res.status(500).json({ error: 'server error' });
  }
};
exports.deleteQuestion = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teacher allowed" });
    }

    const { questionId } = req.params;

    const q = await Question.findById(questionId);
    if (!q) {
      return res.status(404).json({ error: "Question not found" });
    }

    await Question.deleteOne({ _id: questionId });

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteQuestion", err);
    return res.status(500).json({ error: "server error" });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teacher allowed" });
    }

    const { questionId } = req.params;
    const { stem, options, correct, marks, negativeMarks } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    question.stem = stem;
    question.options = options;
    question.correct = correct;
    question.marks = marks;
    question.negativeMarks = negativeMarks;

    await question.save();

    return res.json({ question });
  } catch (err) {
    console.error("updateQuestion", err);
    return res.status(500).json({ error: "server error" });
  }
};
