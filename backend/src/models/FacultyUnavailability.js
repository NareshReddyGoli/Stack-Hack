const mongoose = require('mongoose');

const facultyUnavailabilitySchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
    date: { type: Date, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyUnavailability', facultyUnavailabilitySchema);
