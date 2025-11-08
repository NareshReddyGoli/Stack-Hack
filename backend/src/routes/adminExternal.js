const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { listDatasets, importDataset } = require('../services/externalImportService');
const FacultyRoutine = require('../models/FacultyRoutine');

const router = express.Router();
router.use(requireAdmin);

router.get('/external/datasets', (_req, res) => {
  res.json({ datasets: listDatasets() });
});

router.post('/external/import', async (req, res) => {
  try {
    const { dataset } = req.body || {};
    if (!dataset) return res.status(400).json({ message: 'dataset required' });
    const result = await importDataset(dataset);
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ message: String(e?.message || e) });
  }
});

router.get('/faculty-routine', async (req, res) => {
  const { email, dataset } = req.query || {};
  const q = {};
  if (email) q.facultyEmail = String(email).toLowerCase();
  if (dataset) q.sourceDataset = dataset;
  const list = await FacultyRoutine.find(q).lean();
  res.json(list);
});

module.exports = router;


