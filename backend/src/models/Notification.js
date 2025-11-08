const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: String,
    role: { type: String, enum: ['student', 'faculty', 'admin'] },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
