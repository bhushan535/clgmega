// backend/src/controllers/exam.controller.js

const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const Exam = require('../models/exam.model');
const Question = require('../models/question.model');
const ClassModel = require('../models/class.model');
const mongoose = require('mongoose');    // <--- REQUIRED (fixes your error)

const Session = require('../models/session.model');

/**
 * Validators
 */
exports.createExamValidators = [
  body('title').notEmpty(),
  body('course').optional()
];

/**
 * Create exam
 * POST /exams
 */
// backend/src/controllers/exam.controller.js (replace or update createExam)


// STEP-4.2 — CREATE EXAM (DRAFT ONLY)
exports.createExam = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teacher can create exams" });
    }

    const { title, course, duration } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title required" });
    }

    const exam = await Exam.create({
      title,
      course: course || "",
      duration: duration ? Number(duration) : 30,
      createdBy: req.user._id,
      status: "draft",          // 🔥 VERY IMPORTANT
      assignedClasses: []       // nothing assigned yet
    });

    return res.json({ exam });
  } catch (err) {
    console.error("createExam", err);
    return res.status(500).json({ error: "Server error" });
  }
};



/**
 * Add question to exam
 * POST /exams/:examId/questions  (use multer upload.single('image') before this)
 */
exports.addQuestion = async (req, res) => {
  try {
    const examId = req.params.examId;

    // 1️⃣ validate exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const {
      type = "mcq_single",
      stem,
      options,
      correct,
      marks = 1,
      negativeMarks = 0
    } = req.body;

    if (!stem) {
      return res.status(400).json({ error: "Question text required" });
    }

    // 2️⃣ parse options & correct
    const opts = typeof options === "string" ? JSON.parse(options) : options;
    const correctArr = typeof correct === "string" ? JSON.parse(correct) : correct;

    let imageUrl = null;
    if (req.file) {
      const uploadsDir = path.join(__dirname, "..", "..", "uploads", "questions");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const dest = path.join(
        uploadsDir,
        `${Date.now()}_${req.file.originalname}`
      );
      fs.renameSync(req.file.path, dest);
      imageUrl = `/uploads/questions/${path.basename(dest)}`;
    }

    const question = await Question.create({
      examId,
      type,
      stem,
      imageUrl,
      options: opts,
      correct: correctArr,
      marks,
      negativeMarks
    });

    return res.json({ question });
  } catch (err) {
    console.error("addQuestion ERROR", err);
    return res.status(500).json({ error: "server error" });
  }
};


/**
 * List exams
 * GET /exams
 */
exports.listExams = async (req, res) => {
    console.log("LIST EXAMS USER:", req.user); // 👈 ADD THIS

  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teacher allowed" });
    }

    const exams = await Exam.find({
      createdBy: req.user._id
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ exams });
  } catch (err) {
    console.error("listExams", err);
    return res.status(500).json({ error: "server error" });
  }
};

/**
 * Get single exam (optionally include questions)
 * GET /exams/:examId?include=questions
 */
exports.getExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const includeQuestions = req.query.include === 'questions';
    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (includeQuestions) {
      const questions = await Question.find({ examId }).lean();
      exam.questions = questions;
    }

    return res.json({ exam });
  } catch (err) {
    console.error('getExam', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * Teacher assigns exam to one or more classes
 * POST /exams/:examId/assign  { classIds: [...] }
 */
exports.assignExamToClasses = async (req, res) => {
  try {
    const examId = req.params.examId;
    const { classIds } = req.body;

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({ error: "classIds required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // only creator or admin
    if (
      String(exam.createdBy) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Only creator can assign exam" });
    }

    // validate classes belong to teacher
    const classes = await ClassModel.find({
      _id: { $in: classIds },
      createdBy: req.user._id
    }).select("_id");

    const validIds = classes.map(c => String(c._id));
    if (validIds.length === 0) {
      return res.status(400).json({ error: "No valid classes found" });
    }

    // merge assigned classes (unique)
    const existing = (exam.assignedClasses || []).map(String);
    const toAdd = validIds.filter(id => !existing.includes(id));

    exam.assignedClasses = [...existing, ...toAdd];
    exam.status = "assigned";                 // ✅ REQUIRED

    // optional audit trail
    exam.assignedAt = exam.assignedAt || [];
    const now = new Date();
    toAdd.forEach(cid => {
      exam.assignedAt.push({ classId: cid, at: now });
    });

    await exam.save();

    // ✅ IMPORTANT: return full updated exam
    return res.json({ exam });
  } catch (err) {
    console.error("assignExamToClasses", err);
    return res.status(500).json({ error: "server error" });
  }
};


/**
 * Student: get exams assigned to student's class
 * GET /student/exams
 */
exports.getStudentExams = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students can fetch exams" });
    }

    // ✅ use classId (NOT classRef)
    const classId = req.user.classId;

    if (!classId) {
      return res.json({ exams: [] });
    }

    // ✅ only assigned exams
    const exams = await Exam.find({
      status: "assigned",
      assignedClasses: classId
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ exams });
  } catch (err) {
    console.error("getStudentExams", err);
    return res.status(500).json({ error: "server error" });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teacher allowed" });
    }

    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ error: "Not found" });

    if (String(exam.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not your exam" });
    }

    await Question.deleteMany({ examId: exam._id });
    await Exam.deleteOne({ _id: exam._id });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
};

exports.submitStudentExam = async (req, res) => {
  try {
    console.log("SUBMIT EXAM HIT");
    console.log("USER:", req.user);
    console.log("EXAM ID:", req.params.examId);
    console.log("ANSWERS:", req.body.answers);

    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Only students allowed" });
    }

    const { examId } = req.params;
    const { answers } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      console.log("EXAM NOT FOUND");
      return res.status(404).json({ error: "Exam not found" });
    }

    await Session.create({
      examId,
      studentId: req.user._id,
      answers,
      submittedAt: new Date()
    });

    console.log("SESSION SAVED");

    return res.json({ success: true });
  } catch (err) {
    console.error("submitStudentExam ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
};




// // STEP-4.3 — ASSIGN EXAM TO CLASSES
// exports.assignExamToClasses = async (req, res) => {
//   try {
//     if (req.user.role !== "teacher") {
//       return res.status(403).json({ error: "Only teacher can assign exams" });
//     }

//     const { examId } = req.params;
//     const { classIds } = req.body;

//     if (!Array.isArray(classIds) || classIds.length === 0) {
//       return res.status(400).json({ error: "classIds required" });
//     }

//     const exam = await Exam.findById(examId);
//     if (!exam) return res.status(404).json({ error: "Exam not found" });

//     if (String(exam.createdBy) !== String(req.user._id)) {
//       return res.status(403).json({ error: "Not your exam" });
//     }

//     // 🔑 IMPORTANT FIX: cast to ObjectId
//     exam.assignedClasses = classIds.map(id => new mongoose.Types.ObjectId(id));
//     exam.status = "assigned";

//     await exam.save();

//     return res.json({
//       message: "Exam assigned successfully",
//       exam
//     });
//   } catch (err) {
//     console.error("assignExamToClasses error", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };