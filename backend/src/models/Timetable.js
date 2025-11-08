const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    day: String,
    periodIndex: Number,
    courseId: String,
    facultyId: String,
    roomId: String,
    kind: String,
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    sectionName: String,
    schedule: { type: [slotSchema], default: [] },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    generatedAt: Date,
    generatedBy: String,
    sourceDataset: String,
    timingTemplateIds: {},
    generatedForYears: { type: [Number], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    year: { type: Number },
    department: { type: String },
    sections: { type: [sectionSchema], default: [] },
    objectiveValue: Number,
    warnings: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);


