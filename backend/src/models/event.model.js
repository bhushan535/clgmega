// event.model.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  frameId: { type: String, required: true, index: true },
  type: { type: String, required: true }, // 'no_face', 'multi_person', etc.
  severity: { type: String, enum: ['low','medium','high'], default: 'low' },
  timestampStart: { type: Date, default: Date.now },
  timestampEnd: { type: Date },
  framePath: { type: String },
  modelConfidence: { type: Number },
  reviewed: { type: Boolean, default: false },
  reviewDecision: { type: String, enum: ['accepted','rejected','pending'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
