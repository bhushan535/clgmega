// events.controller.js
const EventModel = require('../models/event.model');
const Session = require('../models/session.model');
const mongoose = require('mongoose');

/**
 * GET /teacher/events?examId=&limit=
 * Returns recent events (optionally filter by examId or sessionId)
 * Requires teacher auth (we will enforce in route)
 */
exports.listEvents = async (req, res) => {
  try {
    const { examId, sessionId, limit = 50 } = req.query;
    const q = {};
    if (sessionId) q.sessionId = sessionId;
    if (examId) {
      // need to map examId -> sessions -> events; simplest: find sessions for exam then events
      const sessions = await Session.find({ examId }).select('_id').lean();
      const sids = sessions.map(s => String(s._id));
      q.sessionId = { $in: sids };
    }

    const events = await EventModel.find(q).sort({ createdAt: -1 }).limit(parseInt(limit, 10)).lean();
    return res.json({ events });
  } catch (err) {
    console.error('listEvents', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * POST /events/:id/review
 * Body: { decision: 'accepted'|'rejected', notes?: string }
 * Only teachers should call this
 */
exports.reviewEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { decision, notes } = req.body;
    if (!eventId || !decision) return res.status(400).json({ error: 'Missing event id or decision' });
    if (!['accepted','rejected'].includes(decision)) return res.status(400).json({ error: 'Invalid decision' });

    const ev = await EventModel.findById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    ev.reviewed = true;
    ev.reviewDecision = decision;
    if (notes) ev.notes = notes;
    ev.reviewedBy = req.user._id;
    await ev.save();

    // Optionally emit update to teacher sockets (so other teachers see live update)
    try {
      const { getIo } = require('../utils/socket');
      const io = getIo();
      io.emit('event_reviewed', { eventId, decision, reviewedBy: req.user._id });
    } catch (emitErr) {
      // ignore emit errors
      console.warn('emit event_reviewed failed', emitErr);
    }

    return res.json({ status: 'ok', event: ev });
  } catch (err) {
    console.error('reviewEvent', err);
    return res.status(500).json({ error: 'server error' });
  }
};
