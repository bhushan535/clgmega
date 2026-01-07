// session.controller.js
const Session = require('../models/session.model');
const Question = require('../models/question.model');
const Exam = require('../models/exam.model');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const uploadToken = uuidv4();

// helper shuffle
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// START EXAM (already provided earlier)
exports.startExam = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can start exams" });
    }

    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam || exam.status !== "assigned") {
      return res.status(404).json({ error: "Exam not available" });
    }

    if (
      !exam.assignedClasses
        .map(String)
        .includes(String(req.user.classId))
    ) {
      return res.status(403).json({ error: "Exam not assigned to your class" });
    }

    // 🚨 CLEAN OLD in_progress SESSION (keep your logic)
    await Session.updateMany(
      {
        examId,
        studentId: req.user._id,
        status: "in_progress"
      },
      {
        $set: { status: "abandoned", endedAt: new Date() }
      }
    );

    // ❌ block re-attempt only if completed
    const existing = await Session.findOne({
      examId,
      studentId: req.user._id,
      status: "completed"
    });

    if (existing) {
      return res.status(400).json({ error: "Exam already attempted" });
    }

    // ✅ FETCH QUESTIONS
    const questions = await Question.find({ examId }).select("_id");
    if (questions.length === 0) {
      return res.status(400).json({ error: "No questions in exam" });
    }

    // ✅ BUILD QUESTION ORDER
    const questionOrder = questions.map(q => q._id);

    // optional shuffle
    questionOrder.sort(() => Math.random() - 0.5);

    // ✅ CREATE SESSION (FIXED PART)
    const session = await Session.create({
      examId,
      studentId: req.user._id,
      classId: req.user.classId,
      questionOrder,
      currentIndex: 0,
      status: "in_progress",
      startedAt: new Date(),
      endsAt: new Date(Date.now() + exam.duration * 60 * 1000),
      uploadToken
    });

    return res.json({ session, exam });

  } catch (err) {
    console.error("startExam", err);
    return res.status(500).json({ error: "Server error" });
  }
};



// GET QUESTIONS FOR SESSION (populates question docs in saved order)
exports.getSessionQuestions = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // ensure requester is session owner or teacher? For now allow if token user id matches
    if (req.user.role === 'student' && String(req.user._id) !== String(session.studentId)) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // fetch questions in order
    const qIds = session.questionOrder || [];
    const questions = await Question.find({ _id: { $in: qIds } }).lean();

    // reorder to match qIds order
    const questionsMap = {};
    questions.forEach(q => { questionsMap[String(q._id)] = q; });
    const ordered = qIds.map(id => {
      const q = questionsMap[String(id)];
      if (!q) return null;
      // remove 'correct' field before sending to student
      const { correct, ...withoutCorrect } = q;
      return withoutCorrect;
    }).filter(Boolean);

    return res.json({ sessionId, questions: ordered, endsAt: session.endsAt, currentIndex: session.currentIndex });
  } catch (err) {
    console.error('getSessionQuestions', err); return res.status(500).json({ error: 'server error' });
  }
};

// SAVE ANSWER for one question (upsert in session.answers)
exports.saveAnswer = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { questionId, selected } = req.body; // selected: array of option ids
    if (!questionId || !selected) return res.status(400).json({ error: 'questionId and selected required' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (String(session.studentId) !== String(req.user._id)) return res.status(403).json({ error: 'Not allowed' });
    if (session.status !== 'in_progress') return res.status(400).json({ error: 'Session not active' });

    // upsert answer
    const idx = session.answers.findIndex(a => String(a.questionId) === String(questionId));
    const now = new Date();
    if (idx >= 0) {
      session.answers[idx].selected = selected;
      session.answers[idx].answeredAt = now;
    } else {
      session.answers.push({ questionId: mongoose.Types.ObjectId(questionId), selected, answeredAt: now });
    }
    await session.save();

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('saveAnswer', err); return res.status(500).json({ error: 'server error' });
  }
};

// SUBMIT session and grade MCQ
exports.submitSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (String(session.studentId) !== String(req.user._id)) return res.status(403).json({ error: 'Not allowed' });

    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: 'Session already submitted' });
    }

    // fetch questions and grading
    const qIds = session.questionOrder || [];
    const questions = await Question.find({ _id: { $in: qIds } }).lean();
    const qMap = {};
    questions.forEach(q => { qMap[String(q._id)] = q; });

    // compute score
    let score = 0;
    const answers = session.answers || [];
    for (const ans of answers) {
      const q = qMap[String(ans.questionId)];
      if (!q) continue;
      // compare arrays: correct is array of option ids
      const selected = (ans.selected || []).map(String).sort();
      const correct = (q.correct || []).map(String).sort();
      const fullMatch = JSON.stringify(selected) === JSON.stringify(correct);
      if (fullMatch) score += (q.marks || 0);
      else {
        // optional negative marks if any partial/incorrect
        if (q.negativeMarks) score -= q.negativeMarks;
      }
    }

    // mark session complete: use Session model update
await Session.findByIdAndUpdate(sessionId, { status: 'completed', endedAt: new Date(), uploadToken: null, $set: { score } });

    return res.json({ status: 'submitted', score });
  } catch (err) {
    console.error('submitSession', err); return res.status(500).json({ error: 'server error' });
  }
};
