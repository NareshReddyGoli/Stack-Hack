const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    registration_no: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    section: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

module.exports = mongoose.model('Student', studentSchema);


