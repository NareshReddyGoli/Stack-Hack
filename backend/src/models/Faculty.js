const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true },
    teacherId: { type: String, unique: true, sparse: true, index: true },
    // Subjects taught by the faculty. Stored as an array to allow multiple subjects.
    subjects: { type: [String], default: [] },
    passwordHash: { type: String, required: true },
    departments: { type: [String], default: [] },
    role: { type: String, enum: ['faculty', 'admin'], default: 'faculty', index: true },
    initialPasswordSet: { type: Boolean, default: false },
    createdByAdmin: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

module.exports = mongoose.model('Faculty', facultySchema);


