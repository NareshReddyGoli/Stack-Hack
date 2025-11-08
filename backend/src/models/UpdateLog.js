const mongoose = require('mongoose');

const updateLogSchema = new mongoose.Schema(
  {
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['class', 'event', 'exam'] },
    periodIndex: Number,
    dayIndex: Number,
    day: String,
    details: {
      section: String,
      facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
      facultyName: String,
      subject: String,
      roomId: String,
      eventName: String,
      examType: String,
      sections: [String],
      durationMinutes: Number
    },
    action: { type: String, enum: ['allocated', 'deallocated'] },
    createdBy: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('UpdateLog', updateLogSchema);