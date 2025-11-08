const mongoose = require('mongoose');

const schedulerJobSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], default: 'queued' },
    logs: { type: [String], default: [] },
    startedAt: Date,
    finishedAt: Date,
    options: {},
    resultSummary: {},
    createdBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchedulerJob', schedulerJobSchema);


