const mongoose = require('mongoose');

const CSVUploadLogSchema = new mongoose.Schema({
  uploadId: { type: String, unique: true },
  entityType: String,
  filename: String,
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  totalRows: Number,
  successfulRows: { type: Number, default: 0 },
  failedRows: { type: Number, default: 0 },
  status: { type: String, enum: ['pending','in_progress','validated','committed','failed'], default: 'pending' },
  errorsSample: [{ rowIndex: Number, errors: [String], rowData: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CSVUploadLog', CSVUploadLogSchema);


