const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Faculty = require('../models/Faculty');
const FacultyRoutine = require('../models/FacultyRoutine');
const AvailableRoom = require('../models/AvailableRoom');
const Timetable = require('../models/Timetable');
const FacultyUnavailability = require('../models/FacultyUnavailability');
const Notification = require('../models/Notification');

const router = express.Router();
router.use(requireAuth);

// Get my routine (faculty)
router.get('/my-routine', async (req, res) => {
  try {
    if (req.user?.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });
    
    const faculty = await Faculty.findById(req.user.sub).lean();
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    // Try to find routine by all possible faculty identifiers
    const routine = await FacultyRoutine.findOne({
      $or: [
        { facultyId: faculty._id },
        { facultyId: faculty.teacherId },
        { facultyEmail: faculty.email },
        // Also try the raw strings as they might appear in generated files
        { facultyId: String(faculty._id) },
        { facultyId: String(faculty.teacherId) }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!routine) {
      console.log('No routine found for faculty:', {
        id: faculty._id,
        teacherId: faculty.teacherId,
        email: faculty.email
      });
      return res.json({ 
        entries: [],
        faculty: {
          teacherId: faculty.teacherId,
          email: faculty.email,
          name: faculty.name
        }
      });
    }

    // Transform entries to ensure consistent format
    const formattedEntries = (routine.entries || []).map(entry => ({
      day: entry.day,
      periodIndex: Number(entry.periodIndex),
      courseId: entry.courseCode,
      section: entry.section,
      roomId: entry.room,
      kind: entry.kind || 'lecture'
    }));

    return res.json({
      entries: formattedEntries,
      faculty: {
        teacherId: faculty.teacherId,
        email: faculty.email,
        name: faculty.name
      },
      timetableId: routine.timetableId
    });
  } catch (e) {
    console.error('Get faculty routine error:', e);
    res.status(500).json({ message: e.message || 'Failed to fetch routine' });
  }
});

// Get available rooms for latest published timetable
router.get('/available-rooms', async (_req, res) => {
  try {
    const tt = await Timetable.findOne({ status: 'published' }).sort({ createdAt: -1 }).lean();
    if (!tt) return res.json({ slots: [] });
    const ar = await AvailableRoom.findOne({ timetableId: tt._id }).sort({ createdAt: -1 }).lean();
    return res.json({ timetableId: tt._id, slots: ar?.slots || [] });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch available rooms' });
  }
});

// Faculty unavailability endpoints
// Get my unavailability entries
router.get('/unavailability', async (req, res) => {
  try {
    if (req.user?.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });
  const list = await FacultyUnavailability.find({ facultyId: req.user.sub }).sort({ createdAt: -1 }).lean();
  // return array directly to match frontend expectation
  return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to fetch unavailability' });
  }
});

// Create new unavailability
router.post('/unavailability', async (req, res) => {
  try {
    if (req.user?.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });
    const { date, reason } = req.body || {};
    if (!date) return res.status(400).json({ message: 'date required' });
    const doc = await FacultyUnavailability.create({ facultyId: req.user.sub, date: new Date(date), reason: reason || '' });
    // create a notification for admins
    await Notification.create({ role: 'admin', title: 'New faculty unavailability', message: `${req.user?.name || req.user?.sub} marked unavailability for ${new Date(date).toDateString()}` });
    return res.status(201).json({ message: 'Unavailability marked successfully', unavailability: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to mark unavailability' });
  }
});

// Delete an unavailability entry (faculty can delete their own)
router.delete('/unavailability/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });
    const doc = await FacultyUnavailability.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (String(doc.facultyId) !== String(req.user.sub)) return res.status(403).json({ message: 'Forbidden' });
    await FacultyUnavailability.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Unavailability deleted successfully' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to delete unavailability' });
  }
});

module.exports = router;

// Allow faculty to update their own profile (subjects, name, email, departments)
router.patch('/profile', async (req, res) => {
  try {
    if (req.user?.role !== 'faculty') return res.status(403).json({ message: 'Forbidden' });
    const { name, email, departments, subjects } = req.body || {};
    const update = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof email === 'string') update.email = email.trim();
    if (Array.isArray(departments)) update.departments = departments.map(d => String(d).trim()).filter(Boolean);
    if (Array.isArray(subjects)) update.subjects = subjects.map(s => String(s).trim()).filter(Boolean);
    // If subjects passed as comma-separated string, accept it too
    if (!Array.isArray(subjects) && typeof subjects === 'string') update.subjects = subjects.split(',').map(s => s.trim()).filter(Boolean);
    if (Object.keys(update).length === 0) return res.status(400).json({ message: 'Nothing to update' });
    await Faculty.findByIdAndUpdate(req.user.sub, update);
    return res.json({ message: 'Profile updated' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});


