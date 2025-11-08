const express = require('express');
const bcrypt = require('bcrypt');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { signJwt, cookieOptions } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/student-signup
router.post('/student-signup', async (req, res) => {
  try {
    const { name, registration_no, year, section, branch, email, password, confirm_password } = req.body || {};
    if (!name || !registration_no || !year || !section || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Student.findOne({ $or: [ { registration_no }, email ? { email: email.toLowerCase() } : null ].filter(Boolean) });
    if (existing) {
      return res.status(409).json({ message: 'Student with same registration no or email already exists' });
    }

    const saltRounds = 12;
    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    const passwordHash = await bcrypt.hash(password, saltRounds);
    await Student.create({ name, registration_no, email: email?.toLowerCase(), year, section, branch, passwordHash });

    return res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { registration_no, email, password, teacher_id } = req.body || {};
    if (!password || (!registration_no && !email && !teacher_id)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let role = null;
    let user = null;
    let hash = null;
    let jwtPayload = null;

    if (registration_no) {
      // Student login
      const s = await Student.findOne({ registration_no });
      if (!s) return res.status(401).json({ message: 'Invalid credentials' });
      user = { id: s._id.toString(), name: s.name, registration_no: s.registration_no };
      role = 'student';
      hash = s.passwordHash;
      jwtPayload = { sub: s._id.toString(), role, kind: 'student' };
    } else if (teacher_id) {
      // Faculty/Admin login by teacherId
      const f = await Faculty.findOne({ teacherId: teacher_id });
      if (!f) return res.status(401).json({ message: 'Invalid credentials' });
      user = { id: f._id.toString(), name: f.name, email: f.email };
      role = f.role || 'faculty';
      hash = f.passwordHash;
      jwtPayload = { sub: f._id.toString(), role, kind: 'faculty' };
    } else {
      // Faculty/Admin login by email
      const f = await Faculty.findOne({ email });
      if (!f) return res.status(401).json({ message: 'Invalid credentials' });
      user = { id: f._id.toString(), name: f.name, email: f.email };
      role = f.role || 'faculty';
      hash = f.passwordHash;
      jwtPayload = { sub: f._id.toString(), role, kind: 'faculty' };
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // Ensure JWT secret exists or fail gracefully with a clear message
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server not configured for login. Contact administrator.' });
    }
    const token = signJwt(jwtPayload);
    res.cookie('token', token, cookieOptions());
    return res.json({ role, user });
  } catch (_err) {
    // eslint-disable-next-line no-console
    console.error('Login error:', _err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { role, sub, kind } = req.user || {};
    if (!sub) return res.status(401).json({ message: 'Unauthorized' });
    if (role === 'student' || kind === 'student') {
      const s = await Student.findById(sub).lean();
      if (!s) return res.status(404).json({ message: 'Not found' });
      return res.json({ role: 'student', user: { id: s._id, name: s.name, registration_no: s.registration_no, email: s.email, year: s.year, section: s.section, branch: s.branch } });
    }
  const f = await Faculty.findById(sub).lean();
  if (!f) return res.status(404).json({ message: 'Not found' });
  // Include subjects in the returned profile so front-end can display/edit them
  return res.json({ role: f.role || 'faculty', user: { id: f._id, name: f.name, email: f.email, departments: f.departments, role: f.role, subjects: f.subjects || [] } });
  } catch (_err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  return res.json({ message: 'Logged out' });
});

// Optional: Forgot/reset placeholders
router.post('/forgot-password', (_req, res) => {
  return res.json({ message: 'If this were implemented, a reset email would be sent.' });
});

router.post('/reset-password', (_req, res) => {
  return res.json({ message: 'If this were implemented, your password would be reset.' });
});

module.exports = router;


