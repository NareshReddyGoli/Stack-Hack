const mongoose = require('mongoose');

const availableRoomSchema = new mongoose.Schema(
  {
    timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable', index: true },
    // one document per timetable; store simple array of slots with available rooms
    slots: [
      {
        day: String,
        dayIndex: Number,
        periodIndex: Number,
        rooms: [String],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AvailableRoom', availableRoomSchema);


