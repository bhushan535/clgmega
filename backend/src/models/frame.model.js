// frame.model.js
const mongoose = require('mongoose');

const FrameSchema = new mongoose.Schema({
  frameId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  filePath: { type: String, required: true },
  status: { type: String, enum: ['saved','processing','processed','error'], default: 'saved' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Frame', FrameSchema);
