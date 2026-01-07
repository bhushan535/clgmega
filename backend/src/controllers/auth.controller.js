// auth.controller.js
const { body, validationResult } = require('express-validator');
const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwtAuth');

exports.registerValidators = [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, email, password, role, studentId } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: role || 'student', studentId });
    const token = generateToken(user);
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.loginValidators = [
  body('email').isEmail(),
  body('password').exists()
];

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Student login using enrollment number instead of email
 * POST /auth/login-enroll
 * body: { enrollment, password }
 */
exports.loginWithEnrollment = async (req, res) => {
  try {
    const { enrollment, password } = req.body;
    if (!enrollment || !password) {
      return res.status(400).json({ error: 'enrollment & password required' });
    }

    // Find by studentId
    const user = await User.findOne({ studentId: enrollment });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({
      user: { id: user._id, name: user.name, role: user.role },
      token
    });
  } catch (err) {
    console.error('loginWithEnrollment', err);
    return res.status(500).json({ error: 'server error' });
  }
};
