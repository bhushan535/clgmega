// backend/src/models/user.model.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, index: true },
  passwordHash: { type: String },
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student"
  },
  studentId: { type: String, unique: true, sparse: true },

  // ✅ FINAL FIELD (IMPORTANT)
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    default: null
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

