// results.controller.js
const Session = require('../models/session.model');
const User = require('../models/user.model');
const EventModel = require('../models/event.model');
const Exam = require('../models/exam.model');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

exports.examResults = async (req, res) => {
  try {
    const examId = req.params.examId;
    if (!mongoose.Types.ObjectId.isValid(examId)) return res.status(400).json({ error: 'Invalid examId' });

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // find sessions for this exam
    const sessions = await Session.find({ examId: examId }).lean();

    // for each session get user info and events count
    const out = [];
    for (const s of sessions) {
      const user = await User.findById(s.studentId).select('name email studentId').lean();
      const flagsCount = await EventModel.countDocuments({ sessionId: String(s._id) });
      const lastFlag = await EventModel.find({ sessionId: String(s._id) }).sort({ timestampEnd: -1 }).limit(1).lean();
      out.push({
        sessionId: String(s._id),
        studentId: user ? (user.studentId || user._id) : s.studentId,
        name: user ? user.name : 'Unknown',
        email: user ? user.email : null,
        score: s.score || 0,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        flagsCount,
        lastFlagTime: (lastFlag && lastFlag[0]) ? (lastFlag[0].timestampEnd || lastFlag[0].timestampStart) : null
      });
    }

    // sort by score desc
    out.sort((a,b) => (b.score || 0) - (a.score || 0));

    return res.json({ exam: { id: examId, title: exam.title }, results: out });
  } catch (err) {
    console.error('examResults', err);
    return res.status(500).json({ error: 'server error' });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const examId = req.params.examId;
    if (!mongoose.Types.ObjectId.isValid(examId)) return res.status(400).json({ error: 'Invalid examId' });

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const sessions = await Session.find({ examId: examId }).lean();
    const rows = [];
    for (const s of sessions) {
      const user = await User.findById(s.studentId).select('name email studentId').lean();
      const flagsCount = await EventModel.countDocuments({ sessionId: String(s._id) });
      const lastFlag = await EventModel.find({ sessionId: String(s._id) }).sort({ timestampEnd: -1 }).limit(1).lean();
      rows.push({
        sessionId: String(s._id),
        studentId: user ? (user.studentId || user._id) : s.studentId,
        name: user ? user.name : 'Unknown',
        email: user ? user.email : '',
        score: s.score || 0,
        startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : '',
        endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : '',
        flagsCount,
        lastFlagTime: (lastFlag && lastFlag[0]) ? (lastFlag[0].timestampEnd || lastFlag[0].timestampStart) : ''
      });
    }

    const fields = ['sessionId','studentId','name','email','score','startedAt','endedAt','flagsCount','lastFlagTime'];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.setHeader('Content-Disposition', `attachment; filename="exam_${examId}_results.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  } catch (err) {
    console.error('exportCsv', err);
    return res.status(500).json({ error: 'server error' });
  }
};
