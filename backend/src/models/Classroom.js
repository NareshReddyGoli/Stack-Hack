const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, unique: true, index: true },
  capacity: Number,
  type: { type: String, enum: ['lab','theory'], default: 'theory' },
  location: String,
});

module.exports = mongoose.model('Classroom', classroomSchema);


