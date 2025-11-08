const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    day: String,
    periodIndex: Number,
    courseCode: String,
    section: String,
    room: String,
    kind: String,
  },
  { _id: false }
);

const facultyRoutineSchema = new mongoose.Schema(
  {
    facultyId: String,
    facultyEmail: String,
    sourceDataset: String,
    entries: { type: [entrySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyRoutine', facultyRoutineSchema);
