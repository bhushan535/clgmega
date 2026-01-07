// backend/server.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Redis = require('redis');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ dest: 'uploads/tmp/' }); // or storage config

// utils / socket
// const { setIo } = require('./src/utils/socket');

// controllers
const authController = require('./src/controllers/auth.controller');
const sessionController = require('./src/controllers/session.controller');
const examController = require('./src/controllers/exam.controller');
const internalController = require('./src/controllers/internal.controller');
const eventsController = require('./src/controllers/events.controller');
const teacherController = require('./src/controllers/teacher.controller');
const resultsController = require('./src/controllers/results.controller');
const analyticsController = require('./src/controllers/analytics.controller');
const classController = require('./src/controllers/class.controller');
const questionController = require('./src/controllers/question.controller');
const studentController = require("./src/controllers/student.controller");

// models
const FrameModel = require('./src/models/frame.model');
const EventModel = require('./src/models/event.model');
const Session = require('./src/models/session.model');

const { authMiddleware, verifyToken } = require('./src/utils/jwtAuth');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- static folders ----------
const framesStaticPath = path.join(__dirname, 'frames');
if (!fs.existsSync(framesStaticPath)) fs.mkdirSync(framesStaticPath, { recursive: true });
app.use('/frames', express.static(framesStaticPath));

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// frame dir
const FRAME_DIR = process.env.FRAME_SAVE_DIR || path.join(__dirname, 'frames');
if (!fs.existsSync(FRAME_DIR)) fs.mkdirSync(FRAME_DIR, { recursive: true });

// multer temp upload dir
// const upload = multer({ dest: path.join(uploadsPath, 'tmp') });

// ---------------- HTTP routes ----------------
// health
app.get('/', (req, res) => res.send('clgmega backend up'));

// auth routes
app.post(
  '/auth/register',
  authController.registerValidators,
  authController.register
);

app.post(
  '/auth/login',
  authController.loginValidators,
  authController.login
);
app.post('/auth/login-enroll', express.json(), authController.loginWithEnrollment);

// session routes (protected)
app.get('/sessions/:sessionId/questions', authMiddleware, sessionController.getSessionQuestions);
app.post('/sessions/:sessionId/answer', authMiddleware, express.json(), sessionController.saveAnswer);
app.post('/sessions/:sessionId/submit', authMiddleware, sessionController.submitSession);

// exam routes (protected)
app.post(
  '/exams',
  authMiddleware,
  examController.createExamValidators,
  examController.createExam
);

app.delete(
  "/exams/:examId",
  authMiddleware,
  examController.deleteExam
);

// app.post('/exams/:examId/questions', authMiddleware, questionController.addQuestionToExam);

app.post('/exams/:examId/questions', authMiddleware, upload.single('image'), examController.addQuestion);

// Teacher assign exam to classes
app.post('/exams/:examId/assign', authMiddleware, async (req, res) => {
  // only teacher (creator) allowed inside controller check too
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return examController.assignExamToClasses(req, res);
});

app.get(
  "/student/exams",
  authMiddleware,
  studentController.getAssignedExams
);

app.post(
  "/student/exams/:examId/start",
  authMiddleware,
  sessionController.startExam
);

app.post(
  "/student/exams/:examId/submit",
  authMiddleware,
  examController.submitStudentExam
);



// Teacher list events (protected, teacher only)
app.get('/teacher/events', authMiddleware, async (req, res, next) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return eventsController.listEvents(req, res);
});

app.get(
  "/teacher/exams",
  authMiddleware,
  examController.listExams
);

app.put(
  "/questions/:questionId",
  authMiddleware,
  questionController.updateQuestion
);


// teacher results (list)
app.delete(
  "/questions/:questionId",
  authMiddleware,
  questionController.deleteQuestion
);
app.get('/teacher/exams/:examId/results', authMiddleware, async (req, res) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
  return resultsController.examResults(req, res);
});
app.get('/teacher/exams/:examId/analytics', authMiddleware, async (req, res) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
  return analyticsController.examAnalytics(req, res);
});

// export CSV
app.get('/teacher/exams/:examId/results/export', authMiddleware, async (req, res) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
  return resultsController.exportCsv(req, res);
});

// Review event (protected, teacher only)
app.post('/events/:id/review', authMiddleware, async (req, res, next) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return eventsController.reviewEvent(req, res);
});

// Teacher: list active sessions (teacher-only)
app.get('/teacher/sessions', authMiddleware, async (req, res) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return teacherController.listActiveSessions(req, res);
});

// ---------------- Class & Student management routes (teacher only) ----------------

// Create class
app.post('/classes', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' });
  return classController.createClass(req, res);
});

// List teacher classes
app.get('/teacher/classes', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' });
  return classController.listTeacherClasses(req, res);
});

// Add students (single or many)
app.post('/classes/:classId/students', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' });
  return classController.addStudents(req, res);
});

// List students in class
app.get('/classes/:classId/students', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' });
  return classController.listStudents(req, res);
});

// Delete student
app.delete('/classes/:classId/students/:studentId', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' });
  return classController.deleteStudent(req, res);
});
app.delete(
  "/classes/:classId",
  authMiddleware,
  classController.deleteClass
);

// Change student password
app.put('/classes/:classId/students/:studentId/password', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role !== 'teacher') return res.status(403).json({ error: 'forbidden' });
  return classController.changeStudentPassword(req, res);
});

// public exams
app.get('/exams', examController.listExams);
app.get('/exams/:examId', examController.getExam);

// start exam (student)
// app.post('/exams/:examId/start', authMiddleware, sessionController.startExam);

// internal testing route (simple)
app.post('/internal/emit-test', (req, res) => {
  const io = require('./src/utils/socket').getIo();
  io.emit('violation_event', req.body || { test: true, ts: new Date() });
  res.json({ ok: true });
});

// recent events API (readonly)
app.get('/api/events/recent', async (req, res) => {
  try {
    const events = await EventModel.find({}).sort({ timestampStart: -1 }).limit(20);
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ---------------- server + socket.io ----------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// make io available to other modules
// setIo(io);

// Redis client (will connect during init)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = Redis.createClient({ url: redisUrl });
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// helper: save base64 image to disk
function saveBase64ToFile(base64data, sessionId, studentId) {
  const frameId = uuidv4();
  const matches = base64data.match(/^data:image\/\w+;base64,(.*)$/);
  const b64 = matches ? matches[1] : base64data;
  const buffer = Buffer.from(b64, 'base64');
  const fname = `${sessionId || 'sess'}_${studentId || 'stu'}_${Date.now()}_${frameId}.jpg`;
  const filePath = path.join(FRAME_DIR, fname);
  fs.writeFileSync(filePath, buffer);
  return { frameId, filePath };
}

// -------- socket handlers --------
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // --- Authenticate socket (token can be provided in handshake auth.token) ---
  try {
    const token = socket.handshake && (socket.handshake.auth && socket.handshake.auth.token);
    if (!token) {
      console.log('Socket connected without token:', socket.id);
      socket.user = null;
    } else {
      try {
        const payload = verifyToken(token); // returns payload or null
        if (!payload) {
          console.log('Socket invalid token, disconnecting', socket.id);
          socket.disconnect(true);
          return;
        }
        socket.user = { id: payload.id, role: payload.role, email: payload.email };
        console.log('Socket connected user:', socket.user, socket.id);

        if (socket.user.role === 'teacher') {
          socket.join('teachers');
          console.log('Socket joined teachers room', socket.id);
        }
      } catch (err) {
        console.log('Socket token verification failed', err);
        socket.disconnect(true);
        return;
      }
    }
  } catch (err) {
    console.error('Socket auth error', err);
    socket.user = null;
  }

  // students/clients can join a particular session room to receive session-specific events
  socket.on('join_session', (payload) => {
    try {
      const { sessionId } = payload || {};
      if (!sessionId) return;
      const room = `session_${sessionId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    } catch (err) {
      console.error('join_session error', err);
    }
  });

  // teachers can request to watch a particular session (join watch room)
  socket.on('watch_session', (payload) => {
    try {
      const { sessionId } = payload || {};
      if (!sessionId) return;
      // only allow teacher/admin to watch
      if (!socket.user || (socket.user.role !== 'teacher' && socket.user.role !== 'admin')) {
        console.warn('Non-teacher tried to watch session', socket.id);
        return;
      }
      const room = `watch_session_${sessionId}`;
      socket.join(room);
      console.log(`Teacher socket ${socket.id} joined watch room ${room}`);
    } catch (err) {
      console.error('watch_session error', err);
    }
  });

  // frame handler (with uploadToken verification)
  socket.on('frame', async (payload) => {
    try {
      // minimal validation
      const { sessionId = 'unknown', studentId = 'unknown', timestamp, imageBase64, uploadToken } = payload || {};

      if (!imageBase64) {
        socket.emit('frame_ack', { status: 'error', error: 'imageBase64 missing' });
        return;
      }

      // verify sessionId and uploadToken presence
      if (!sessionId || !uploadToken) {
        socket.emit('frame_ack', { status: 'error', error: 'sessionId or uploadToken missing' });
        return;
      }

      // fetch session from DB and check uploadToken
      let session;
      try {
        session = await Session.findById(sessionId).lean();
      } catch (e) {
        console.error('Failed to fetch session for frame', e);
        socket.emit('frame_ack', { status: 'error', error: 'session lookup failed' });
        return;
      }

      if (!session) {
        socket.emit('frame_ack', { status: 'error', error: 'invalid session' });
        return;
      }

      if (!session.uploadToken || String(session.uploadToken) !== String(uploadToken)) {
        socket.badUploadAttempts = (socket.badUploadAttempts || 0) + 1;
        socket.emit('frame_ack', { status: 'error', error: 'invalid upload token' });

        // safety: disconnect after 5 bad attempts
        if (socket.badUploadAttempts >= 5) {
          console.warn('Disconnecting socket due to repeated bad upload tokens', socket.id);
          socket.disconnect(true);
        }
        return;
      }

      // token ok -> proceed to save frame
      let saved;
      try {
        saved = saveBase64ToFile(imageBase64, sessionId, studentId);
      } catch (e) {
        console.error('Failed to save frame to disk:', e);
        socket.emit('frame_ack', { status: 'error', error: 'save_failed' });
        return;
      }

      const { frameId, filePath } = saved;

      // create Frame doc
      let frameDoc;
      try {
        frameDoc = await FrameModel.create({
          frameId,
          sessionId,
          studentId,
          filePath,
          status: 'saved',
          timestamp: timestamp ? new Date(timestamp) : new Date()
        });
      } catch (e) {
        console.error('Failed to create Frame doc:', e);
        socket.emit('frame_ack', { status: 'error', error: 'db_failed' });
        return;
      }

      // push job to Redis queue
      try {
        if (!redisClient.isOpen) {
          await redisClient.connect();
        }
        await redisClient.lPush('frame_queue', JSON.stringify({ frameId }));
      } catch (e) {
        console.error('Failed to push job to Redis:', e);
        try { await FrameModel.updateOne({ frameId }, { $set: { status: 'error' } }); } catch (ee) { }
        socket.emit('frame_ack', { status: 'error', error: 'queue_failed' });
        return;
      }

      // AFTER saving & queueing -> notify any teacher watching this session
      try {
        const frameBasename = path.basename(filePath);
        const publicFramePath = `/frames/${frameBasename}`;
        io.to(`watch_session_${sessionId}`).emit('student_frame', {
          frameId,
          framePath: publicFramePath,
          studentId,
          timestamp: timestamp || new Date().toISOString()
        });
      } catch (emitErr) {
        console.warn('emit to watch_session failed', emitErr);
      }

      socket.emit('frame_ack', { status: 'queued', frameId });
    } catch (err) {
      console.error('frame handling error', err);
      socket.emit('frame_ack', { status: 'error', error: String(err) });
    }
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});


// ---------------- internal event listener (secure) ----------------
app.post('/internal/event', express.json(), (req, res) => {
  try {
    const secret = req.headers['x-internal-secret'] || '';
    const expected = process.env.INTERNAL_SECRET || '';
    if (!secret || secret !== expected) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    // delegate to controller (which will emit via socket)
    return internalController.receiveEvent(req, res);
  } catch (err) {
    console.error('internal/event error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// ---------------- init (connect DBs & start server) ----------------
async function init() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clgmega_dev';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('Redis connected');

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
  } catch (err) {
    console.error('Init error:', err);
    process.exit(1);
  }
}

init();
