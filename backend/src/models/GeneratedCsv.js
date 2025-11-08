const mongoose = require('mongoose');

const generatedCsvSchema = new mongoose.Schema(
  {
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
    kind: { type: String, enum: ['section', 'faculty', 'master'] },
    name: String, // e.g., Section A, Faculty F1
    filename: String,
    csvText: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeneratedCsv', generatedCsvSchema);


