// analytics.controller.js
const Session = require('../models/session.model');
const EventModel = require('../models/event.model');
const User = require('../models/user.model');
const Exam = require('../models/exam.model');
const mongoose = require('mongoose');

function median(values) {
  if (!values.length) return 0;
  values.sort((a,b) => a-b);
  const mid = Math.floor(values.length/2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid-1] + values[mid]) / 2;
}

exports.examAnalytics = async (req, res) => {
  try {
    const examId = req.params.examId;
    if (!mongoose.Types.ObjectId.isValid(examId)) return res.status(400).json({ error: 'Invalid examId' });

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Get sessions for exam
    const sessions = await Session.find({ examId: examId }).lean();

    // compute scores
    const scores = sessions.map(s => (typeof s.score === 'number' ? s.score : 0));
    const avgScore = scores.length ? (scores.reduce((a,b)=>a+b,0) / scores.length) : 0;
    const med = median(scores);
    const minScore = scores.length ? Math.min(...scores) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;

    // buckets (0-10,11-20,... upto 100) — adapt depending on max marks, here generic 10-buckets
    const buckets = Array.from({length:10}, (_,i) => ({ range: `${i*10}-${i*10+9}`, count: 0 }));
    scores.forEach(s => {
      const idx = Math.min(9, Math.floor((s/100) * 10)); // if scores are out of 100 normalize; fallback
      buckets[idx].count += 1;
    });

    // flags over time: last 14 days (date string YYYY-MM-DD)
    const days = 14;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days-1));
    // aggregate events per day
    const match = { sessionId: { $in: sessions.map(s => String(s._id)) } };
    const pipeline = [
      { $match: match },
      { $addFields: { day: { $dateToString: { format: "%Y-%m-%d", date: "$timestampEnd" } } } },
      { $group: { _id: "$day", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ];
    const agg = await EventModel.aggregate(pipeline);

    // build array for full range
    const flagsOverTimeMap = {};
    agg.forEach(a => { flagsOverTimeMap[a._id] = a.count; });
    const flagsOverTime = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      flagsOverTime.push({ date: key, count: flagsOverTimeMap[key] || 0 });
    }

    // top flagged students
    const flagsPipeline = [
      { $match: match },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];
    const top = await EventModel.aggregate(flagsPipeline);
    // enrich with user info
    const topFlaggedStudents = [];
    for (const t of top) {
      const u = await User.findById(t._id).select('name email studentId').lean();
      topFlaggedStudents.push({
        studentId: t._id,
        name: u ? u.name : 'Unknown',
        email: u ? u.email : '',
        flags: t.count
      });
    }

    return res.json({
      exam: { id: examId, title: exam.title },
      summary: { avgScore, median: med, minScore, maxScore, totalStudents: sessions.length },
      scoreBuckets: buckets,
      flagsOverTime,
      topFlaggedStudents
    });
  } catch (err) {
    console.error('examAnalytics', err);
    return res.status(500).json({ error: 'server error' });
  }
};
