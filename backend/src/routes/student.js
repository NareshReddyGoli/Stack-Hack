const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Student = require('../models/Student');

const router = express.Router();
router.use(requireAuth);

// Get my timetable (student)
router.get('/my-timetable', async (req, res) => {
  try {
    if (req.user?.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    // Fetch the latest profile to get section/year
    const student = await Student.findById(req.user.sub).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { section, year } = student;
    if (!section) return res.status(400).json({ message: 'Profile incomplete: section missing' });
    
    console.log(`Student ${student.registration_no} requesting timetable for section: ${section}`);
    
    // choose latest published timetable containing this section
    const tt = await Timetable.findOne({ status: 'published', 'sections.sectionName': section }).sort({ createdAt: -1 }).lean();
    
    console.log(`Found timetable: ${tt ? tt._id : 'none'} for section: ${section}`);
    if (tt) {
      console.log(`Timetable status: ${tt.status}, sections: ${tt.sections?.map(s => s.sectionName).join(', ')}`);
    }
    
    if (!tt) return res.json({ entries: [] });
    const sec = (tt.sections || []).find((s) => s.sectionName === section) || { schedule: [] };
    
    console.log(`Returning ${sec.schedule?.length || 0} schedule entries for section ${section}`);
    
    res.json({ timetableId: tt._id, section: section, year: tt.year || year, entries: (sec.schedule || []) });
  } catch (e) {
    console.error('Student timetable fetch error:', e);
    res.status(500).json({ message: e.message || 'Failed to fetch timetable' });
  }
});

module.exports = router;

// Allow student to update their profile except registration_no
router.patch('/profile', async (req, res) => {
  try {
    if (req.user?.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
    const { name, email, year, section, branch } = req.body || {};
    const update = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof email === 'string') update.email = email.trim().toLowerCase();
    if (typeof year !== 'undefined') update.year = Number(year);
    if (typeof section === 'string') update.section = section.trim();
    if (typeof branch === 'string') update.branch = branch.trim();
    if (Object.keys(update).length === 0) return res.status(400).json({ message: 'Nothing to update' });
    await Student.findByIdAndUpdate(req.user.sub, update);
    return res.json({ message: 'Profile updated' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});


