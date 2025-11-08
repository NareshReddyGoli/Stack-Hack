const express = require('express');
const bcrypt = require('bcrypt');
const { requireAdmin } = require('../middleware/auth');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const TimingTemplate = require('../models/TimingTemplate');
const Timetable = require('../models/Timetable');
const { generateTimetable, cancelJob, getStatus } = require('../services/schedulerService');
const SchedulerJob = require('../models/SchedulerJob');
const FacultyUnavailability = require('../models/FacultyUnavailability');
const Notification = require('../models/Notification');
const FacultyRoutine = require('../models/FacultyRoutine');
const AvailableRoom = require('../models/AvailableRoom');
const AvailableFaculty = require('../models/AvailableFaculty');
const RoomAllocation = require('../models/RoomAllocation');
const UpdateLog = require('../models/UpdateLog');

const router = express.Router();

// All routes require admin
router.use(requireAdmin);

// Get updates endpoint
router.get('/updates', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    if (isNaN(days) || days < 1) {
      return res.status(400).json({ message: 'Invalid days parameter' });
    }

    const since = new Date();
    since.setDate(since.getDate() - days);
    
    console.log('Fetching updates since:', since);
    console.log('Days parameter:', days);
    
    const query = {
      createdAt: { $gte: since }
    };
    
    console.log('Update query:', JSON.stringify(query));
    
    const updates = await UpdateLog.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    console.log(`Found ${updates.length} updates`);
    
    return res.json(updates || []);
  } catch (e) {
    console.error('Get updates error:', e);
    console.error(e.stack);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? e.message : undefined 
    });
  }
});

// Delete update endpoint
router.delete('/updates/:id', async (req, res) => {
  try {
    const update = await UpdateLog.findById(req.params.id);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }
    
    await UpdateLog.findByIdAndDelete(req.params.id);
    
    return res.json({ message: 'Update deleted successfully' });
  } catch (e) {
    console.error('Delete update error:', e);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? e.message : undefined 
    });
  }
});

// Get routine for specific faculty
router.get('/faculty-routine/:facultyId', async (req, res) => {
  try {
    const routine = await FacultyRoutine.findOne({
      $or: [
        { facultyId: req.params.facultyId },
        { facultyEmail: req.params.facultyId }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!routine) {
      return res.json({
        facultyId: req.params.facultyId,
        entries: []
      });
    }

    return res.json(routine);
  } catch (e) {
    console.error('Get faculty routine error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Faculty management
router.post('/create-faculty', async (req, res) => {
  try {
    const { name, email, departments = [], role = 'faculty', password, teacherId, subjects = [] } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    const existing = await Faculty.findOne({ $or: [{ email }, teacherId ? { teacherId } : null].filter(Boolean) });
    if (existing) return res.status(409).json({ message: 'Faculty with email/teacherId already exists' });
    const passwordHash = await bcrypt.hash(password, 12);
    // Normalize subjects to array of trimmed non-empty strings
    const subjArray = Array.isArray(subjects) ? subjects.map(s => String(s).trim()).filter(Boolean) : (String(subjects || '').split(',').map(s => s.trim()).filter(Boolean));
    const doc = await Faculty.create({ name, email, teacherId, passwordHash, departments, role, subjects: subjArray, initialPasswordSet: false, createdByAdmin: true });
    return res.status(201).json({ id: doc._id });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/reset-faculty-password/:id', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ message: 'Password required' });
    const passwordHash = await bcrypt.hash(password, 12);
    await Faculty.findByIdAndUpdate(req.params.id, { passwordHash, initialPasswordSet: false });
    return res.json({ message: 'Password reset' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/faculties', async (_req, res) => {
  const list = await Faculty.find().lean();
  res.json(list);
});

router.delete('/faculty/:id', async (req, res) => {
  try {
    const fac = await Faculty.findById(req.params.id).lean();
    if (!fac) return res.status(404).json({ message: 'Not found' });
    if (fac.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin user' });
    await Faculty.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Timing templates CRUD
router.get('/timing-templates', async (_req, res) => {
  const list = await TimingTemplate.find().lean();
  res.json(list);
});

router.post('/timing-templates', async (req, res) => {
  const doc = await TimingTemplate.create(req.body || {});
  res.status(201).json(doc);
});

router.put('/timing-templates/:id', async (req, res) => {
  const doc = await TimingTemplate.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  res.json(doc);
});

router.delete('/timing-templates/:id', async (req, res) => {
  await TimingTemplate.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// Generate jobs
router.post('/generate', async (req, res) => {
  try {
    const jobId = await generateTimetable({ ...(req.body || {}), createdBy: req.user?.sub || 'admin' });
    res.json({ jobId });
  } catch (e) {
    res.status(500).json({ message: 'Failed to start job' });
  }
});

router.get('/generate/:jobId/status', async (req, res) => {
  const status = await getStatus(req.params.jobId);
  if (!status) return res.status(404).json({ message: 'Not found' });
  res.json(status);
});

router.post('/generate/:jobId/cancel', async (req, res) => {
  await cancelJob(req.params.jobId);
  res.json({ message: 'Cancellation requested' });
});

// Timetables
router.get('/timetables', async (req, res) => {
  const { status, department, year } = req.query || {};
  const q = {};
  if (status) q.status = status;
  if (department) q.department = department;
  if (year) q.year = Number(year);
  const list = await Timetable.find(q).lean();
  res.json(list);
});

router.get('/timetables/:id', async (req, res) => {
  const doc = await Timetable.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.post('/timetables/:id/publish', async (req, res) => {
  const doc = await Timetable.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
  try {
    // Notify all students and faculty that timetable got published
    const io = req.app.get('io');
    const Notification = require('../models/Notification');
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');

    const [students, facultyList] = await Promise.all([
      Student.find().select('_id').lean(),
      Faculty.find().select('_id').lean()
    ]);

    const notifDocs = [];
    const title = 'Timetable Published';
    const message = 'A timetable has been published. Please review your schedule.';

    for (const s of students) {
      notifDocs.push({ userId: String(s._id), role: 'student', title, message });
    }
    for (const f of facultyList) {
      notifDocs.push({ userId: String(f._id), role: 'faculty', title, message });
    }
    if (notifDocs.length) await Notification.insertMany(notifDocs);

    // Realtime broadcast (generic heads-up)
    if (io) {
      io.to('role:student').emit('newNotification', { notification: { title, message, createdAt: new Date() } });
      io.to('role:faculty').emit('newNotification', { notification: { title, message, createdAt: new Date() } });
      io.emit('timetableUpdate', { type: 'publish', details: { timetableId: doc?._id } });
    }
  } catch (e) {
    // best-effort notifications; don't fail publish
    console.warn('Publish notify failed:', e.message);
  }
  res.json(doc);
});

router.post('/timetables/:id/partial-regenerate', async (_req, res) => {
  // Placeholder – would call local repair in real scheduler
  res.json({ message: 'Partial regenerate requested' });
});

// Delete timetable and related data
router.delete('/timetables/:id', async (req, res) => {
  try {
    const tt = await Timetable.findById(req.params.id);
    if (!tt) return res.status(404).json({ message: 'Timetable not found' });
    
    // Delete related data
    await Promise.all([
      // Delete faculty routines generated from this timetable
      FacultyRoutine.deleteMany({ timetableId: tt._id }),
      // Delete available room data for this timetable
      AvailableRoom.deleteMany({ timetableId: tt._id }),
      // Delete available faculty data for this timetable
  AvailableFaculty.deleteMany({ timetableId: tt._id }),
      // Delete the timetable itself
      Timetable.findByIdAndDelete(tt._id)
    ]);
    
    return res.json({ message: 'Timetable and related data deleted successfully' });
  } catch (e) {
    console.error('Delete timetable error:', e);
    return res.status(500).json({ message: 'Failed to delete timetable' });
  }
});

router.put('/timetables/:id/lock-slot', async (req, res) => {
  const { sectionName, day, periodIndex, locked } = req.body || {};
  const tt = await Timetable.findById(req.params.id);
  if (!tt) return res.status(404).json({ message: 'Not found' });
  const section = tt.sections.find(s => s.sectionName === sectionName);
  if (!section) return res.status(404).json({ message: 'Section not found' });
  const slot = section.schedule.find(s => s.day === day && s.periodIndex === periodIndex);
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
  slot.locked = !!locked;
  await tt.save();
  res.json({ message: 'Updated' });
});

// Move/swap a slot assignment inside one section
router.put('/timetables/:id/move-slot', async (req, res) => {
  const { sectionName, from, to } = req.body || {};
  if (!sectionName || !from || !to) return res.status(400).json({ message: 'Invalid payload' });
  const tt = await Timetable.findById(req.params.id);
  if (!tt) return res.status(404).json({ message: 'Not found' });
  const section = tt.sections.find(s => s.sectionName === sectionName);
  if (!section) return res.status(404).json({ message: 'Section not found' });
  const fromSlot = section.schedule.find(s => s.day === from.day && s.periodIndex === from.periodIndex);
  const toSlot = section.schedule.find(s => s.day === to.day && s.periodIndex === to.periodIndex);
  if (!fromSlot || !toSlot) return res.status(404).json({ message: 'Slot not found' });
  if (toSlot.locked) return res.status(400).json({ message: 'Target slot is locked' });

  // Capture pre-swap for notifications
  const fromBefore = { day: from.day, periodIndex: from.periodIndex, facultyId: fromSlot.facultyId, roomId: fromSlot.roomId, courseId: fromSlot.courseId };
  const toBefore = { day: to.day, periodIndex: to.periodIndex, facultyId: toSlot.facultyId, roomId: toSlot.roomId, courseId: toSlot.courseId };

  // Swap core assignment fields
  const tmp = { courseId: fromSlot.courseId, facultyId: fromSlot.facultyId, roomId: fromSlot.roomId };
  fromSlot.courseId = toSlot.courseId;
  fromSlot.facultyId = toSlot.facultyId;
  fromSlot.roomId = toSlot.roomId;
  toSlot.courseId = tmp.courseId;
  toSlot.facultyId = tmp.facultyId;
  toSlot.roomId = tmp.roomId;
  await tt.save();

  // Create update log and notify stakeholders (best-effort)
  try {
    const UpdateLog = require('../models/UpdateLog');
    const Notification = require('../models/Notification');
    const Student = require('../models/Student');
    const io = req.app.get('io');

    const updateLog = await UpdateLog.create({
      timetableId: tt._id,
      date: new Date(),
      dayIndex: null,
      periodIndex: null,
      day: null,
      type: 'move',
      details: {
        section: sectionName,
        from: fromBefore,
        to: toBefore,
      },
      action: 'moved',
      createdBy: req.user?.sub
    });

    // Notify faculty involved (if any)
    const facMsgs = [
      { id: fromBefore.facultyId, title: 'Class Moved', message: `Your class for section ${sectionName} moved from ${fromBefore.day} P${fromBefore.periodIndex} to ${toBefore.day} P${toBefore.periodIndex}.` },
      { id: toBefore.facultyId, title: 'Class Moved', message: `Your class for section ${sectionName} moved from ${toBefore.day} P${toBefore.periodIndex} to ${fromBefore.day} P${fromBefore.periodIndex}.` },
    ];
    for (const m of facMsgs) {
      if (!m.id) continue;
      const doc = await Notification.create({ userId: String(m.id), role: 'faculty', title: m.title, message: m.message });
      io?.to(`user:${m.id}`).emit('newNotification', { notification: doc, updateLog });
    }

    // Notify students in the section
    const students = await Student.find({ section: sectionName }).select('_id').lean();
    for (const s of students) {
      const doc = await Notification.create({
        userId: String(s._id),
        role: 'student',
        title: 'Timetable Updated',
        message: `Section ${sectionName} schedule moved between ${fromBefore.day} P${fromBefore.periodIndex} and ${toBefore.day} P${toBefore.periodIndex}.`
      });
      io?.to(`user:${s._id}`).emit('newNotification', { notification: doc, updateLog });
    }

    // Also broadcast a generic timetable update
    io?.emit('timetableUpdate', { type: 'move', details: { section: sectionName, from: fromBefore, to: toBefore } });
  } catch (e) {
    console.warn('Move-slot notify failed:', e.message);
  }

  res.json({ message: 'Moved' });
});

// Analytics (placeholders/minimal)
router.get('/analytics/faculty-load', async (_req, res) => {
  res.json({ series: [] });
});
router.get('/analytics/room-utilization', async (_req, res) => {
  res.json({ utilization: [] });
});
router.get('/analytics/conflicts', async (_req, res) => {
  res.json({ conflicts: [] });
});

// Students listing by section/year
router.get('/students', async (req, res) => {
  const { year, section } = req.query || {};
  const q = {};
  if (year) q.year = Number(year);
  if (section) q.section = section;
  const list = await Student.find(q).lean();
  res.json(list);
});

// Logs
router.get('/logs', async (req, res) => {
  const { jobId, limit = 200 } = req.query || {};
  if (!jobId) return res.status(400).json({ message: 'jobId required' });
  const job = await SchedulerJob.findById(jobId).lean();
  if (!job) return res.status(404).json({ message: 'Not found' });
  const logs = (job.logs || []).slice(-Number(limit));
  res.json({ logs, status: job.status, startedAt: job.startedAt, finishedAt: job.finishedAt });
});

// Get available rooms (latest timetable regardless of status)
router.get('/available-rooms', async (req, res) => {
  try {
    const tt = await Timetable.findOne().sort({ createdAt: -1 }).lean();
    if (!tt) return res.json({ slots: [] });
    const ar = await AvailableRoom.findOne({ timetableId: tt._id }).sort({ createdAt: -1 }).lean();
    return res.json({ timetableId: tt._id, slots: ar?.slots || [] });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch available rooms' });
  }
});

// Get room allocations for a timetable
router.get('/room-allocations', async (req, res) => {
  try {
    const { timetableId } = req.query || {};
    if (!timetableId) return res.status(400).json({ message: 'timetableId required' });
    const list = await RoomAllocation.find({ timetableId }).sort({ createdAt: -1 }).lean();
    return res.json({ allocations: list });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch allocations' });
  }
});

// Allocate a room for class/event/exam (admin)
router.post('/allocate-room', async (req, res) => {
  try {
    const { timetableId, dayIndex, periodIndex, day, roomId, type, details } = req.body || {};
    if (!timetableId || roomId == null || type == null || (dayIndex == null && !day) || periodIndex == null) return res.status(400).json({ message: 'Missing required fields' });

    // ensure room is available for that slot
    const ar = await AvailableRoom.findOne({ timetableId });
    if (!ar) return res.status(400).json({ message: 'No available room data for timetable' });
    const arSlot = ar.slots.find(s => Number(s.dayIndex) === Number(dayIndex) && Number(s.periodIndex) === Number(periodIndex));
    if (!arSlot || !(arSlot.rooms || []).includes(roomId)) return res.status(400).json({ message: 'Room not available for selected slot' });

    // check conflicts: same room already allocated at same time
    const conflict = await RoomAllocation.findOne({ timetableId, dayIndex: Number(dayIndex), periodIndex: Number(periodIndex), roomId });
    if (conflict) return res.status(409).json({ message: 'Room already allocated for this slot' });

    const alloc = await RoomAllocation.create({ timetableId, day, dayIndex: Number(dayIndex), periodIndex: Number(periodIndex), roomId, type, details: details || {}, createdBy: req.user?.sub });

    // remove room from available rooms for that slot
    arSlot.rooms = (arSlot.rooms || []).filter(r => r !== roomId);
    await ar.save();

    // Send notifications and track updates based on allocation type
    const io = req.app.get('io');
    const UpdateLog = require('../models/UpdateLog');
    const Notification = require('../models/Notification');
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');
    const AvailableFaculty = require('../models/AvailableFaculty');

    // Create update log
    const updateLog = await UpdateLog.create({
      timetableId: timetableId,
      date: new Date(),
      dayIndex: Number(dayIndex),
      periodIndex: Number(periodIndex),
      day,
      type: type,
      details: {
        ...details,
        roomId,
        duration: details.duration || 1
      },
      action: 'allocated',
      createdBy: req.user?.sub
    });

    if (type === 'class') {
      // Get faculty details
      const faculty = await Faculty.findById(details.facultyId).lean();
      const facultyName = faculty?.name || details.facultyName || 'Unknown Faculty';

      // Update AvailableFaculty to mark faculty as unavailable for this slot
      const af = await AvailableFaculty.findOne({ timetableId });
      if (af) {
        const afSlot = af.slots.find(s => 
          Number(s.dayIndex) === Number(dayIndex) && 
          Number(s.periodIndex) === Number(periodIndex)
        );
        if (afSlot) {
          afSlot.faculty = (afSlot.faculty || []).filter(f => 
            String(f) !== String(details.facultyId)
          );
          await af.save();
        }
      }

      // Notify faculty
      const facultyNotification = await Notification.create({
        userId: details.facultyId,
        role: 'faculty',
        title: 'New Class Allocation',
        message: `You have been allocated to teach ${details.subject || 'a class'} for section ${details.section} in room ${roomId} during period ${periodIndex} on ${day}`
      });
      
      // Emit to specific faculty's socket room
      io.to(`user:${details.facultyId}`).emit('newNotification', {
        notification: facultyNotification,
        updateLog
      });

      // Also emit to faculty's role room
      io.to('role:faculty').emit('facultyUpdate', {
        facultyId: details.facultyId,
        type: 'allocation',
        details: {
          subject: details.subject,
          section: details.section,
          roomId,
          periodIndex,
          day
        }
      });

      // Notify students in the section
      const students = await Student.find({ section: details.section });
      for (const student of students) {
        const studentNotification = await Notification.create({
          userId: student._id,
          role: 'student',
          title: 'New Class Schedule',
          message: `${details.subject || 'A class'} with ${facultyName} has been scheduled in room ${roomId} during period ${periodIndex} on ${day}`
        });
        
        // Emit to specific student's socket room
        io.to(`user:${student._id}`).emit('newNotification', {
          notification: studentNotification,
          updateLog
        });
      }
      
      // Also emit to students' role room
      io.to('role:student').emit('scheduleUpdate', {
        section: details.section,
        type: 'newClass',
        details: {
          subject: details.subject,
          faculty: facultyName,
          roomId,
          periodIndex,
          day
        }
      });
    } else if (type === 'event') {
      // Create a general notification for the event
      const eventNotification = await Notification.create({
        role: 'admin',
        title: 'New Event Scheduled',
        message: `${details.eventName || details.description} has been scheduled in room ${roomId} during period ${periodIndex} on ${day} for ${details.duration || 1} hour(s)`
      });

      // Broadcast to all connected users
      io.emit('newEvent', {
        notification: eventNotification,
        updateLog
      });
    } else if (type === 'exam') {
      // Notify students in the affected sections
      for (const section of details.sections || []) {
        const students = await Student.find({ section });
        for (const student of students) {
          const examNotification = await Notification.create({
            userId: student._id,
            role: 'student',
            title: 'Exam Schedule Update',
            message: `${details.examType?.toUpperCase() || 'An'} exam has been scheduled in room ${roomId} during period ${periodIndex} on ${day}`
          });
          
          io.to(`user:${student._id}`).emit('newNotification', {
            notification: examNotification,
            updateLog
          });
        }
      }
    }

    // Notify admins about all allocations
    const adminNotification = await Notification.create({
      role: 'admin',
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Allocation`,
      message: `Room ${roomId} has been allocated for ${type} during period ${periodIndex} on ${day}`
    });

    io.to('role:admin').emit('newAllocation', {
      notification: adminNotification,
      updateLog,
      type,
      roomId,
      periodIndex,
      day,
      details
    });

    // Emit room status update to all users
    io.emit('roomStatusUpdate', {
      roomId,
      status: 'allocated',
      type,
      periodIndex,
      day,
      details: updateLog.details
    });

    // Emit faculty status update to all users
    if (type === 'class' && facultyId) {
      io.emit('facultyStatusUpdate', {
        facultyId,
        status: 'allocated',
        type,
        periodIndex,
        day,
        roomId,
        details: updateLog.details
      });
    }

    return res.status(201).json({ allocation: alloc });
  } catch (e) {
    console.error('Allocate room error', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete allocation
router.delete('/allocate-room/:id', async (req, res) => {
  try {
    const doc = await RoomAllocation.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const timetableId = doc.timetableId;
    const { roomId, dayIndex, periodIndex, type, details } = doc;
    
    // Delete the allocation
    await RoomAllocation.findByIdAndDelete(req.params.id);

    // add room back to available rooms for that slot if present
    const ar = await AvailableRoom.findOne({ timetableId });
    if (ar) {
      const arSlot = ar.slots.find(s => Number(s.dayIndex) === Number(dayIndex) && Number(s.periodIndex) === Number(periodIndex));
      if (arSlot) {
        arSlot.rooms = Array.from(new Set([...(arSlot.rooms || []), roomId]));
        await ar.save();
      }
    }

    // add faculty back to available faculty for that slot if present
    if (type === 'class' && details && details.facultyId) {
      const af = await AvailableFaculty.findOne({ timetableId });
      if (af) {
        const afSlot = af.slots.find(s => Number(s.dayIndex) === Number(dayIndex) && Number(s.periodIndex) === Number(periodIndex));
        if (afSlot) {
          afSlot.faculty = Array.from(new Set([...(afSlot.faculty || []), details.facultyId]));
          await af.save();
        }
      }
    }

    // Emit room status update for deallocation
    io.emit('roomStatusUpdate', {
      roomId,
      status: 'available',
      type,
      periodIndex,
      day,
      details: { message: 'Room deallocated' }
    });

    // Emit faculty status update for deallocation
    if (type === 'class' && details && details.facultyId) {
      io.emit('facultyStatusUpdate', {
        facultyId: details.facultyId,
        status: 'available',
        type,
        periodIndex,
        day,
        roomId,
        details: { message: 'Faculty deallocated' }
      });
    }

    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Check faculty availability for a timeslot
router.get('/check-faculty-availability', async (req, res) => {
  try {
    const { facultyId, dayIndex, periodIndex, duration } = req.query;
    if (!facultyId || dayIndex == null || periodIndex == null || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check existing RoomAllocation assignments
    const allocs = await RoomAllocation.find({
      type: 'class',
      'details.facultyId': facultyId,
      dayIndex: Number(dayIndex),
      periodIndex: Number(periodIndex)
    });

    // Also check timetable assignments
    const tt = await Timetable.findOne().sort({ createdAt: -1 });
    if (tt) {
      let hasConflict = false;
      for (const section of tt.sections) {
        const slot = section.schedule.find(s => 
          Number(s.dayIndex) === Number(dayIndex) && 
          Number(s.periodIndex) === Number(periodIndex) &&
          String(s.facultyId) === String(facultyId)
        );
        if (slot) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) {
        return res.json({ available: false });
      }
    }

    // Check faculty unavailability
    const unavail = await FacultyUnavailability.findOne({
      facultyId,
      status: 'approved',
      dayOfWeek: dayIndex // assuming dayIndex maps to day of week (0=Sunday)
    });

    return res.json({ 
      available: !unavail && allocs.length === 0,
      reason: unavail ? 'Faculty marked as unavailable' : 
              allocs.length > 0 ? 'Faculty already has an allocation' : null
    });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get available faculty (lecturers) per published timetable
router.get('/available-faculty', async (req, res) => {
  try {
    const tt = await Timetable.findOne().sort({ createdAt: -1 }).lean();
    if (!tt) return res.json({ slots: [] });
    const af = await AvailableFaculty.findOne({ timetableId: tt._id }).sort({ createdAt: -1 }).lean();
    const slots = af?.slots || [];
    // Resolve faculty identifiers to full objects (id, name, teacherId, email, subjects) where possible.
    const keys = new Set();
    for (const s of slots) {
      for (const f of (s.faculty || [])) {
        if (!f) continue;
        // Some solvers may store faculty as objects; normalize to a string key (prefer _id/id/teacherId/email)
        if (typeof f === 'object') {
          const fid = f._id || f.id || f.teacherId || f.email || JSON.stringify(f);
          keys.add(String(fid));
        } else {
          keys.add(String(f));
        }
      }
    }
    const keyList = Array.from(keys);

    const mongoose = require('mongoose');
    const objectIds = keyList.filter(k => mongoose.Types.ObjectId.isValid(k));
    const stringKeys = keyList.filter(k => !mongoose.Types.ObjectId.isValid(k));

    const q = { $or: [] };
    if (objectIds.length) q.$or.push({ _id: { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) } });
    if (stringKeys.length) q.$or.push({ teacherId: { $in: stringKeys } }, { email: { $in: stringKeys } }, { name: { $in: stringKeys } });

    let facultyDocs = [];
    if (q.$or.length) {
      facultyDocs = await Faculty.find(q).lean();
    }

    const mapByKey = new Map();
    for (const fdoc of facultyDocs) {
      if (fdoc._id) mapByKey.set(String(fdoc._id), fdoc);
      if (fdoc.teacherId) mapByKey.set(String(fdoc.teacherId), fdoc);
      if (fdoc.email) mapByKey.set(String(fdoc.email), fdoc);
      if (fdoc.name) mapByKey.set(String(fdoc.name), fdoc);
    }

    // Build slots with resolved faculty objects
    const slotsWithObjects = slots.map(s => ({
      day: s.day,
      dayIndex: s.dayIndex,
      periodIndex: s.periodIndex,
      faculty: (s.faculty || []).map((k) => {
        const str = String(k);
        const doc = mapByKey.get(str);
        if (doc) return { id: String(doc._id), teacherId: doc.teacherId || null, name: doc.name || null, email: doc.email || null, subjects: doc.subjects || [] };
        // Unknown key from solver — return minimal object with id/key and fallback name
        return { id: str, teacherId: null, name: str, email: null, subjects: [] };
      })
    }));

    return res.json({ timetableId: tt._id, slots: slotsWithObjects });
  } catch (e) {
    console.error('Available faculty fetch error:', e);
    console.error(e && e.stack);
    return res.status(500).json({ message: 'Failed to fetch available faculty', error: process.env.NODE_ENV === 'development' ? e.message : undefined });
  }
});

// Helper: emit a test notification to a user (admin-only)
// This endpoint exists to make QA/testing of socket delivery easy. It requires admin auth.
router.post('/debug/emit-notification', async (req, res) => {
  try {
    const { userId, role, title, message } = req.body || {};
    if (!userId || !title || !message) return res.status(400).json({ message: 'userId, title and message required' });
    const io = req.app.get('io');
    const notif = await Notification.create({ userId: String(userId), role: role || 'faculty', title, message });
    io.to(`user:${userId}`).emit('newNotification', { notification: notif });
    return res.json({ notification: notif });
  } catch (e) {
    console.error('Dev emit notification error:', e);
    return res.status(500).json({ message: 'Failed to emit notification', error: e.message });
  }
});

// Allocate a faculty to a specific timetable slot (admin)
router.post('/allocate-faculty', async (req, res) => {
  try {
    const { timetableId, sectionName, dayIndex, periodIndex, facultyId, roomId, subject } = req.body || {};
    if (!timetableId || !sectionName || dayIndex == null || periodIndex == null || !facultyId) 
      return res.status(400).json({ message: 'Missing required fields' });

    const tt = await Timetable.findById(timetableId);
    if (!tt) return res.status(404).json({ message: 'Timetable not found' });
    
    const section = tt.sections.find(s => s.sectionName === sectionName);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    
    let slot = section.schedule.find(s => Number(s.dayIndex) === Number(dayIndex) && Number(s.periodIndex) === Number(periodIndex));
    if (!slot) {
      slot = section.schedule.find(s => Number(s.periodIndex) === Number(periodIndex) && 
        (s.dayIndex == null || Number(s.dayIndex) === Number(dayIndex)));
      if (!slot) return res.status(404).json({ message: 'Slot not found' });
    }
    
    if (slot.locked) return res.status(400).json({ message: 'Slot is locked' });

    // Get faculty details for notifications
    const faculty = await Faculty.findById(facultyId).lean();
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    // Get the day name for notifications
    const dayName = slot.day || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];

    // Save old values for update tracking
    const oldFacultyId = slot.facultyId;
    const oldRoomId = slot.roomId;

    // Update the slot
    slot.facultyId = facultyId;
    if (roomId) {
      slot.roomId = roomId;
      
      // Update AvailableRoom if room changed
      if (oldRoomId !== roomId) {
        const ar = await AvailableRoom.findOne({ timetableId });
        if (ar) {
          const arSlot = ar.slots.find(s => 
            Number(s.dayIndex) === Number(dayIndex) && 
            Number(s.periodIndex) === Number(periodIndex)
          );
          if (arSlot) {
            // Remove new room and add back old room if it existed
            arSlot.rooms = Array.from(new Set([
              ...(arSlot.rooms || []).filter(r => r !== roomId),
              ...(oldRoomId ? [oldRoomId] : [])
            ]));
            await ar.save();
          }
        }
      }
    }
    
    // Save timetable changes
    await tt.save();

    // Update AvailableFaculty document
    const af = await AvailableFaculty.findOne({ timetableId });
    if (af) {
      const afSlot = af.slots.find(s => 
        Number(s.dayIndex) === Number(dayIndex) && 
        Number(s.periodIndex) === Number(periodIndex)
      );
      if (afSlot) {
        // Remove newly allocated faculty and add back old faculty if it existed
        afSlot.faculty = Array.from(new Set([
          ...(afSlot.faculty || []).filter(f => String(f) !== String(facultyId)),
          ...(oldFacultyId ? [String(oldFacultyId)] : [])
        ]));
        await af.save();
      }
    }

    // Create update log
    const io = req.app.get('io');
    const updateLog = await UpdateLog.create({
      timetableId,
      date: new Date(),
      dayIndex: Number(dayIndex),
      periodIndex: Number(periodIndex),
      day: dayName,
      type: 'class',
      details: {
        section: sectionName,
        facultyId,
        facultyName: faculty.name,
        subject: subject || slot.courseId || 'Unknown Subject',
        roomId: roomId || slot.roomId
      },
      action: 'allocated',
      createdBy: req.user?.sub
    });

    // Notify the faculty
    const facultyNotif = await Notification.create({
      userId: facultyId,
      role: 'faculty',
      title: 'New Class Assignment',
      message: `You have been assigned to teach ${subject || slot.courseId || 'a class'} for section ${sectionName} in room ${roomId || slot.roomId} during period ${periodIndex} on ${dayName}`
    });

    io.to(`user:${facultyId}`).emit('newNotification', {
      notification: facultyNotif,
      updateLog
    });

    // Notify students in the section
    const students = await Student.find({ section: sectionName });
    for (const student of students) {
      const studentNotif = await Notification.create({
        userId: student._id,
        role: 'student',
        title: 'New Faculty Assignment',
        message: `${faculty.name} has been assigned to teach ${subject || slot.courseId || 'your class'} in room ${roomId || slot.roomId} during period ${periodIndex} on ${dayName}`
      });

      io.to(`user:${student._id}`).emit('newNotification', {
        notification: studentNotif,
        updateLog
      });
    }

    // Broadcast updates
    io.to('role:faculty').emit('facultyUpdate', {
      type: 'allocation',
      facultyId,
      details: {
        section: sectionName,
        subject: subject || slot.courseId,
        roomId: roomId || slot.roomId,
        periodIndex,
        day: dayName
      }
    });

    io.emit('timetableUpdate', {
      type: 'faculty_allocation',
      details: {
        timetableId,
        section: sectionName,
        facultyId,
        facultyName: faculty.name,
        roomId: roomId || slot.roomId,
        periodIndex,
        day: dayName,
        subject: subject || slot.courseId
      }
    });

    return res.json({ 
      message: 'Allocated',
      updateLog 
    });
  } catch (e) {
    console.error('Allocate error', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get faculty timetables for admin view
router.get('/faculty-timetables', async (req, res) => {
  try {
    console.log('Fetching faculty timetables...');
    
    // Get latest timetable
    const tt = await Timetable.findOne().sort({ createdAt: -1 }).lean();
    if (!tt) {
      console.log('No timetable found');
      return res.json({ timetableId: null, routines: [] });
    }
    console.log('Found timetable:', tt._id);

    // Get all faculties first to ensure we have complete data
    const allFaculties = await Faculty.find().lean();
    console.log('Total faculties found:', allFaculties.length);

    // Initialize faculty schedules
    const facultySchedules = new Map();
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periodsPerDay = 9; // Fixed number of periods

    // Create empty schedule structure
    const createEmptySchedule = () => {
      const schedule = {};
      workingDays.forEach(day => {
        schedule[day] = Array(periodsPerDay).fill().map(() => ({
          course: '',
          section: '',
          room: '',
          kind: '',
          periodIndex: null,
          dayIndex: null,
          isEmpty: true
        }));
      });
      return schedule;
    };

    // Helper to ensure schedule initialization
    const ensureFacultySchedule = (facultyId) => {
      if (!facultySchedules.has(facultyId)) {
        facultySchedules.set(facultyId, {
          facultyId,
          schedule: createEmptySchedule()
        });
      }
      return facultySchedules.get(facultyId);
    };

    // Process each section's schedule
    if (tt.sections && Array.isArray(tt.sections)) {
      console.log('Processing', tt.sections.length, 'sections');
      
      for (const section of tt.sections) {
        if (!section.schedule || !Array.isArray(section.schedule)) {
          console.log('Skipping section - no schedule:', section.sectionName);
          continue;
        }

        for (const slot of section.schedule) {
          const facultyId = slot.facultyId;
          if (!facultyId) {
            console.log('Skipping slot - no faculty:', slot);
            continue;
          }

          // Get or normalize day name
          let dayName = null;
          if (slot.day) {
            dayName = slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase();
          } else if (typeof slot.dayIndex === 'number' && slot.dayIndex >= 0 && slot.dayIndex < workingDays.length) {
            dayName = workingDays[slot.dayIndex];
          }

          if (!dayName || !workingDays.includes(dayName)) {
            console.log('Skipping slot - invalid day:', slot);
            continue;
          }

          // Calculate period index
          const periodIdx = typeof slot.periodIndex === 'number' 
            ? Math.max(0, Math.min(periodsPerDay - 1, slot.periodIndex <= periodsPerDay ? slot.periodIndex - 1 : slot.periodIndex))
            : null;

          if (periodIdx === null) {
            console.log('Skipping slot - invalid period:', slot);
            continue;
          }

          const facultySchedule = ensureFacultySchedule(String(facultyId));
          
          // Add slot to faculty schedule
          try {
            const hasContent = !!(slot.courseId || section.sectionName || slot.roomId);
            facultySchedule.schedule[dayName][periodIdx] = {
              course: slot.courseId || '',
              section: section.sectionName || '',
              room: slot.roomId || '',
              kind: hasContent ? (slot.kind || 'lecture') : '',
              periodIndex: periodIdx + 1,
              dayIndex: slot.dayIndex || workingDays.indexOf(dayName),
              isEmpty: !hasContent
            };
          } catch (err) {
            console.error('Error processing slot:', {
              facultyId,
              dayName,
              periodIdx,
              error: err.message
            });
            continue;
          }
        }
      }
    }

    // Get faculty details
    console.log('Processing faculty details...');
    const facultyIds = Array.from(facultySchedules.keys());
    console.log('Found faculty IDs:', facultyIds);
    
    // Create faculty lookup map from all faculties
    const facultyMap = new Map();
    allFaculties.forEach(f => {
      facultyMap.set(String(f._id), f);
      if (f.teacherId) facultyMap.set(f.teacherId, f);
      if (f.email) facultyMap.set(f.email, f);
    });

    // Map to routines array
    console.log('Building routines array...');
    const routines = [];
    
    for (const [facultyId, schedule] of facultySchedules) {
      // Try to find faculty in our map
      const faculty = facultyMap.get(String(facultyId));
      
      // Create faculty data object
      const facultyData = faculty || { 
        _id: facultyId,
        name: facultyId,
        teacherId: facultyId,
        email: null
      };
      
      routines.push({
        facultyId: {
          _id: String(facultyData._id),
          name: facultyData.name || facultyId,
          email: facultyData.email || '',
          teacherId: facultyData.teacherId || facultyId,
          subjects: facultyData.subjects || []
        },
        timetableId: String(tt._id),
        schedule: schedule.schedule
      });
    }

    // Sort by faculty name
    routines.sort((a, b) => 
      (a.facultyId.name || a.facultyId.teacherId || '')
        .localeCompare(b.facultyId.name || b.facultyId.teacherId || '')
    );

    console.log(`Successfully built ${routines.length} faculty routines`);
    
    return res.json({ 
      timetableId: String(tt._id), 
      routines: routines
    });
  } catch (e) {
    console.error('Fetch faculty timetables error:', e);
    return res.status(500).json({ 
      message: 'Failed to fetch faculty timetables',
      error: e.message 
    });
  }
});

// Admin: list all faculty unavailability requests
router.get('/faculty-unavailability', async (req, res) => {
  try {
    const raw = await FacultyUnavailability.find().populate('facultyId', 'name email').sort({ createdAt: -1 }).lean();
    // Flatten populated faculty info so frontend receives strings instead of objects
    const list = raw.map((r) => ({
      ...r,
      facultyName: r.facultyId?.name || null,
      facultyEmail: r.facultyId?.email || null,
      facultyId: r.facultyId?._id || r.facultyId,
    }));
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update status (approve/reject)
router.patch('/faculty-unavailability/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const doc = await FacultyUnavailability.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    doc.status = status;
    doc.approvedBy = req.user?.sub;
    await doc.save();
    // notify the faculty
    await Notification.create({ userId: String(doc.facultyId), role: 'faculty', title: 'Unavailability status updated', message: `Your unavailability on ${new Date(doc.date).toDateString()} was ${status}` });
    return res.json({ unavailability: doc });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


