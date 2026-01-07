// backend/src/controllers/class.controller.js
const ClassModel = require('../models/class.model');
const User = require('../models/user.model');
const { hashPassword } = require('../utils/hash'); // bcrypt helper
const mongoose = require('mongoose');
const Exam = require('../models/exam.model');

/**
 * POST /classes
 * body: { name, code, description }
 * teacher-only
 */
exports.createClass = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name and code required' });

    // ensure code unique for this teacher
    const existing = await ClassModel.findOne({ code, createdBy: req.user._id });
    if (existing) return res.status(400).json({ error: 'You already have a class with this code' });

    const cls = await ClassModel.create({ name, code, description, createdBy: req.user._id });
    return res.json({ class: cls });
  } catch (err) {
    console.error('createClass', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * GET /teacher/classes
 * returns teacher's classes
 */
exports.listTeacherClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ classes });
  } catch (err) {
    console.error('listTeacherClasses', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * POST /classes/:classId/students
 * body: { students: [{ name, enrollment, password, email? }, ...] } OR single student fields
 * Creates user accounts with role 'student' and studentId = enrollment
 */
exports.addStudents = async (req, res) => {
  try {
    const classId = req.params.classId;
    if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(400).json({ error: 'invalid classId' });

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ error: 'class not found' });
    if (String(cls.createdBy) !== String(req.user._id)) return res.status(403).json({ error: 'forbidden' });

    let payloadStudents = [];
    if (req.body.students && Array.isArray(req.body.students)) {
      payloadStudents = req.body.students;
    } else {
      // allow single student fields
      const { name, enrollment, password, email } = req.body;
      if (!enrollment || !password) return res.status(400).json({ error: 'enrollment and password required' });
      payloadStudents = [{ name: name || enrollment, enrollment, password, email }];
    }

    const created = [];
    for (const s of payloadStudents) {
  const enrollment = (s.enrollment || s.studentId || '').toString();
  const password = s.password;
  const email = s.email || `${enrollment}@noemail.local`;

  if (!enrollment || !password) continue;

  // 🔍 check student already exists
  const exists = await User.findOne({
    $or: [
      { studentId: enrollment },
      { email }
    ]
  });

  // ✅ student already exists → JUST assign class
  if (exists) {
    exists.classId = classId;
    await exists.save();

    created.push({
      enrollment,
      status: 'assigned-to-class',
      id: exists._id
    });
    continue;
  }

  // 🆕 student does not exist → create new
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name: s.name || enrollment,
    email,
    passwordHash,
    role: 'student',
    studentId: enrollment,
    classId: classId
  });

  created.push({
    enrollment,
    status: 'created',
    id: user._id
  });
}


    return res.json({ created });
  } catch (err) {
    console.error('addStudents', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * GET /classes/:classId/students
 */
exports.listStudents = async (req, res) => {
  try {
    const classId = req.params.classId;
    if (!mongoose.Types.ObjectId.isValid(classId)) return res.status(400).json({ error: 'invalid classId' });

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ error: 'class not found' });
    if (String(cls.createdBy) !== String(req.user._id)) return res.status(403).json({ error: 'forbidden' });

    const students = await User.find({ role: 'student', classId: classId }).select('-passwordHash').lean();
    return res.json({ students });
  } catch (err) {
    console.error('listStudents', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * DELETE student
 * DELETE /classes/:classId/students/:studentId
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ error: 'invalid id' });

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ error: 'class not found' });
    if (String(cls.createdBy) !== String(req.user._id)) return res.status(403).json({ error: 'forbidden' });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'student not found' });
    if (String(student.classId) !== String(classId)) return res.status(400).json({ error: 'student not in this class' });

    await User.findByIdAndDelete(studentId);
    return res.json({ status: 'deleted' });
  } catch (err) {
    console.error('deleteStudent', err);
    return res.status(500).json({ error: 'server error' });
  }
};

/**
 * PUT change student password
 * PUT /classes/:classId/students/:studentId/password
 * body: { password }
 */
exports.changeStudentPassword = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'password required' });

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ error: 'class not found' });
    if (String(cls.createdBy) !== String(req.user._id)) return res.status(403).json({ error: 'forbidden' });

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'student not found' });
    if (String(student.classId) !== String(classId)) return res.status(400).json({ error: 'student not in this class' });

    student.passwordHash = await hashPassword(password);
    await student.save();
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('changeStudentPassword', err);
    return res.status(500).json({ error: 'server error' });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teacher allowed" });
    }

    const cls = await ClassModel.findById(req.params.classId);
    if (!cls) return res.status(404).json({ error: "Class not found" });

    if (String(cls.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not your class" });
    }

    // unassign exams
    await Exam.updateMany(
      { assignedClasses: cls._id },
      { $pull: { assignedClasses: cls._id } }
    );

    await ClassModel.deleteOne({ _id: cls._id });

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteClass", err);
    res.status(500).json({ error: "server error" });
  }
};

