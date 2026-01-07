// teacher.controller.js
const Session = require('../models/session.model');

exports.listActiveSessions = async (req, res) => {
  try {
    // find sessions that are still in_progress and not expired
    const now = new Date();
    const sessions = await Session.find({
      status: 'in_progress',
      endsAt: { $gt: now }
    }).sort({ startedAt: -1 }).limit(200).lean();

    // return minimal info
    const out = sessions.map(s => ({
      sessionId: s._id,
      examId: s.examId,
      studentId: s.studentId,
      startedAt: s.startedAt,
      endsAt: s.endsAt,
      currentIndex: s.currentIndex
    }));

    return res.json({ sessions: out });
  } catch (err) {
    console.error('listActiveSessions', err);
    return res.status(500).json({ error: 'server error' });
  }
};
