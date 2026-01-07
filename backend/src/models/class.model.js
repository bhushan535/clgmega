const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, index: true }, // teacher-defined code
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // teacher
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
