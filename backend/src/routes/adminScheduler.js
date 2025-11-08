const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { runSolver } = require('../services/pythonSchedulerClient');
const Timetable = require('../models/Timetable');
const GeneratedCsv = require('../models/GeneratedCsv');
const FacultyRoutine = require('../models/FacultyRoutine');
const AvailableRoom = require('../models/AvailableRoom');
const AvailableFaculty = require('../models/AvailableFaculty');
const Faculty = require('../models/Faculty');
const Notification = require('../models/Notification');
const Student = require('../models/Student');

const router = express.Router();
router.use(requireAdmin);

router.post('/python-scheduler/run', async (req, res) => {
  const { files, timeLimit = 90, optimizeGaps = false } = req.body || {};
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: 'files required' });
  }

  try {
    const solver = await runSolver({ files, timeLimit, optimizeGaps });
    if (solver.status === 'FEASIBILITY_ERROR') {
      return res.status(400).json(solver);
    }

    const sectionsPayload = Object.entries(solver.sections || {});
    const sectionsForDoc = sectionsPayload.map(([sectionName, entries]) => ({
      sectionName,
      schedule: entries.map((entry) => ({
        day: entry.dayName,
        periodIndex: entry.periodIndex,
        courseId: entry.courseId,
        facultyId: entry.facultyId,
        roomId: entry.roomId,
        kind: entry.kind,
        locked: false,
      })),
    }));

    const timetableDoc = await Timetable.create({
      generatedAt: new Date(),
      generatedBy: req.user?.sub || 'admin',
      status: 'draft',
      timingTemplateIds: {},
      generatedForYears: [],
      department: 'python-scheduler',
      sections: sectionsForDoc,
    });

    // persist faculty routines
    const facDocs = [];
    for (const [facKey, rows] of Object.entries(solver.faculty || {})) {
      // try to map key to an existing faculty by teacherId or email
      const fac = await Faculty.findOne({ $or: [{ teacherId: facKey }, { email: facKey }] }).lean();
      facDocs.push({
        facultyId: fac?.id || facKey,
        facultyEmail: fac?.email,
        sourceDataset: 'python-scheduler',
        entries: rows.map((r) => ({ day: r.dayName, periodIndex: r.periodIndex, courseCode: r.courseId, section: r.sectionId, room: r.roomId })),
      });
    }
    if (facDocs.length) await FacultyRoutine.insertMany(facDocs);

    // persist available rooms
    if (Array.isArray(solver.availableRooms) && solver.availableRooms.length) {
      await AvailableRoom.create({
        timetableId: timetableDoc._id,
        slots: solver.availableRooms.map((s) => ({ day: s.dayName, dayIndex: s.dayIndex, periodIndex: s.periodIndex, rooms: s.rooms || [] })),
      });
    }

    // persist available faculty (if provided by solver)
    if (Array.isArray(solver.availableFaculty) && solver.availableFaculty.length) {
      await AvailableFaculty.create({
        timetableId: timetableDoc._id,
        slots: solver.availableFaculty.map((s) => ({ day: s.dayName, dayIndex: s.dayIndex, periodIndex: s.periodIndex, faculty: s.faculty || [] })),
      });
    }

    const students = await Student.find().select('_id').lean();
    if (students.length) {
      const notifications = await Notification.insertMany(
        students.map((s) => ({
          userId: String(s._id),
          role: 'student',
          title: 'New Timetable Available',
          message: 'A new timetable has been generated and is available for review.',
        }))
      );
      
      // Emit real-time notifications
      const io = req.app.get('io');
      if (io) {
        // Emit to all student role rooms
        io.to('role:student').emit('newNotification', {
          notification: {
            title: 'New Timetable Available',
            message: 'A new timetable has been generated and is available for review.',
            createdAt: new Date()
          }
        });
      }
    }

    res.json({ solver, timetableId: timetableDoc._id });
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('PYTHON_400')) return res.status(400).json({ message: msg });
    if (msg.includes('PYTHON_422')) return res.status(400).json({ message: msg });
    if (msg.includes('PYTHON_404')) return res.status(502).json({ message: 'Python API not found' });
    if (msg.includes('fetch') || msg.includes('network')) return res.status(502).json({ message: 'Python API unreachable' });
    res.status(500).json({ message: msg || 'Scheduler error' });
  }
});

router.get('/python-scheduler/health', async (_req, res) => {
  try {
    const url = (process.env.PYTHON_SCHEDULER_URL || 'http://localhost:8000') + '/health';
    const r = await fetch(url);
    const ok = r.ok; const body = await r.text();
    res.json({ ok, body });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
});

router.post('/python-scheduler/publish', async (req, res) => {
  try {
    const { timetableId, sectionGrids = {}, facultyGrids = {} } = req.body || {};
    if (!timetableId) return res.status(400).json({ message: 'timetableId required' });
    const tt = await Timetable.findById(timetableId);
    if (!tt) return res.status(404).json({ message: 'Timetable not found' });

    // Convert grid objects into CSV text and store
    const docs = [];
    for (const [name, grid] of Object.entries(sectionGrids)) {
      const csv = gridArrayToCsv(grid);
      docs.push({ timetableId, kind: 'section', name, filename: `section_${name}.csv`, csvText: csv });
    }
    for (const [name, grid] of Object.entries(facultyGrids)) {
      const csv = gridArrayToCsv(grid);
      docs.push({ timetableId, kind: 'faculty', name, filename: `faculty_${name}.csv`, csvText: csv });
    }
    if (docs.length) await GeneratedCsv.insertMany(docs);
    tt.status = 'published';
    await tt.save();
    
    // Emit notifications to students about the published timetable
    const io = req.app.get('io');
    if (io) {
      // Notify all students about the new published timetable
      const students = await Student.find().select('_id').lean();
      if (students.length) {
        await Notification.insertMany(
          students.map((s) => ({
            userId: String(s._id),
            role: 'student',
            title: 'New Timetable Available',
            message: 'A new timetable has been published and is now available for viewing.',
          }))
        );
        
        // Emit to all student role rooms
        io.to('role:student').emit('newNotification', {
          notification: {
            title: 'New Timetable Available',
            message: 'A new timetable has been published and is now available for viewing.',
            createdAt: new Date()
          }
        });
        
        // Also emit a schedule update event
        io.to('role:student').emit('scheduleUpdate', {
          type: 'timetable_published',
          timetableId: timetableId,
          timestamp: new Date()
        });
      }
    }
    
    res.json({ message: 'Published', stored: docs.length });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Publish failed' });
  }
});

function gridArrayToCsv(grid) {
  // grid expected as array of records with index column on first key (reset_index in Python)
  if (!Array.isArray(grid) || grid.length === 0) return '';
  const columns = Object.keys(grid[0]);
  const lines = [];
  lines.push(columns.join(','));
  for (const row of grid) {
    const vals = columns.map((c) => {
      const v = row[c] == null ? '' : String(row[c]);
      if (v.includes(',') || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"';
      return v;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

module.exports = router;


