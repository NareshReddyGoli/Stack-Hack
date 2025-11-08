const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true },
  title: String,
  department: String,
  semester: Number,
  credits: Number,
  lecturesPerWeek: Number,
  isLab: { type: Boolean, default: false },
  preferredRooms: { type: [String], default: [] },
  assignedFacultyIds: { type: [String], default: [] },
});

module.exports = mongoose.model('Course', courseSchema);


