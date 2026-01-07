const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    course: String,
    duration: { type: Number, default: 30 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["draft", "assigned"],
      default: "draft"
    },

    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);


// // backend/src/models/exam.model.js
// const mongoose = require('mongoose');

// const ExamSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   course: { type: String },
//   startTime: { type: Date },
//   endTime: { type: Date },
//   duration: { type: Number }, // minutes
//   config: { type: Object, default: {} },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

//   // ================================
//   // NEW FIELDS FOR CLASS ASSIGNMENT
//   // ================================

//   // Classes to which this exam is assigned
//   assignedClasses: [
//     { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
//   ],

//   // Optional tracking of assignment timestamps
//   assignedAt: [
//     {
//       classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
//       at: { type: Date, default: Date.now }
//     }
//   ]

// }, { timestamps: true });

// module.exports = mongoose.model('Exam', ExamSchema);
