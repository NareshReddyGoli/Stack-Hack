const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Student = require('../models/Student');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const list = await Notification.find({ 
      userId: req.user.sub,
      role: req.user.role 
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
    res.json(list);
  } catch (e) {
    console.error('Get notifications error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/read', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.sub, read: false },
      { $set: { read: true } }
    );
    // Emit socket event
    const io = req.app.get('io');
    io.to(`user:${req.user.sub}`).emit('notificationsRead');
    res.json({ message: 'ok' });
  } catch (e) {
    console.error('Mark read error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark single notification as read
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub },
      { read: true }
    );
    // Emit socket event
    const io = req.app.get('io');
    io.to(`user:${req.user.sub}`).emit('notificationRead', req.params.id);
    return res.json({ message: 'Updated' });
  } catch (e) {
    console.error('Mark notification read error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/admin/broadcast', requireAdmin, async (req, res) => {
  const { title, message, year, section } = req.body || {};
  const q = {};
  if (year) q.year = Number(year);
  if (section) q.section = section;
  const students = await Student.find(q).lean();
  const docs = students.map(s => ({ userId: String(s._id), role: 'student', title, message }));
  if (docs.length) await Notification.insertMany(docs);
  res.json({ delivered: docs.length });
});

module.exports = router;


