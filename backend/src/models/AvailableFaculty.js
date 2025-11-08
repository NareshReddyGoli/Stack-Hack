const mongoose = require('mongoose');

const availableFacultySchema = new mongoose.Schema(
  {
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', index: true },
    // one document per timetable; store simple array of slots with available faculty ids
    slots: [
      {
        day: String,
        dayIndex: Number,
        periodIndex: Number,
        faculty: [String],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AvailableFaculty', availableFacultySchema);
