const mongoose = require('mongoose');

const windowSchema = new mongoose.Schema(
  {
    name: String,
    startTime: String,
    endTime: String,
    count: Number,
    fixed: { type: Boolean, default: false },
  },
  { _id: false }
);

const timingTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    applyToAllYears: { type: Boolean, default: true },
    year: { type: Number, min: 1, max: 4 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    periodLengthMin: { type: Number },
    periodsPerDay: { type: Number },
    workingDays: { type: [String], default: [] },
    breakWindows: { type: [windowSchema], default: [] },
    lunchWindow: windowSchema,
    maxConsecutivePeriods: { type: Number, default: 4 },
    minGapBetweenSameFaculty: { type: Number, default: 0 },
    labContiguousMin: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimingTemplate', timingTemplateSchema);


