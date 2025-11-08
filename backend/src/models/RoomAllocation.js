const mongoose = require('mongoose');

const roomAllocationSchema = new mongoose.Schema(
  {
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', index: true },
    day: String,
    dayIndex: Number,
    periodIndex: Number,
    roomId: String,
    type: { type: String, enum: ['class', 'event', 'exam'], required: true },
    // details vary by type
    details: {},
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomAllocation', roomAllocationSchema);
