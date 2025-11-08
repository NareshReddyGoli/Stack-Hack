const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  department: String,
  year: Number,
  sectionName: String,
  totalStudents: Number,
});

sectionSchema.index({ department: 1, year: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);


