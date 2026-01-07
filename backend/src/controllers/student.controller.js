// backend/src/controllers/student.controller.js

const Exam = require("../models/exam.model");

exports.getAssignedExams = async (req, res) => {
  try {
    // 1️⃣ Auth check
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    // 2️⃣ Student class check
    const classId = req.user.classId;
    if (!classId) {
      // student not assigned to any class
      return res.json({ exams: [] });
    }

    // 3️⃣ CORE LOGIC (THIS IS STEP-4.5)
    const exams = await Exam.find({
      status: "assigned",
      assignedClasses: classId
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ exams });

  } catch (err) {
    console.error("getStudentExams error", err);
    return res.status(500).json({ error: "Server error" });
  }
};
