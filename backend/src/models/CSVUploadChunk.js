const mongoose = require('mongoose');

const CSVUploadChunkSchema = new mongoose.Schema({
  uploadId: String,
  chunkIndex: Number,
  rows: [mongoose.Schema.Types.Mixed],
  validCount: { type: Number, default: 0 },
  invalidCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CSVUploadChunk', CSVUploadChunkSchema);


