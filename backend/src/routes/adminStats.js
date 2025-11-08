const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const Student = require('../models/Student');

const router = express.Router();
router.use(requireAdmin);

router.get('/stats/students', async (_req, res) => {
  const byYear = await Student.aggregate([{ $group: { _id: '$year', count: { $sum: 1 } } }, { $project: { _id: 0, year: '$_id', count: 1 } }, { $sort: { year: 1 } }]);
  const bySection = await Student.aggregate([{ $group: { _id: { year: '$year', section: '$section' }, count: { $sum: 1 } } }, { $project: { _id: 0, year: '$_id.year', section: '$_id.section', count: 1 } }, { $sort: { year: 1, section: 1 } }]);
  res.json({ byYear, bySection });
});

module.exports = router;


