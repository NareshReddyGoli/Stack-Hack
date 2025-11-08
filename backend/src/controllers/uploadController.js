const { v4: uuidv4 } = require('uuid');
const CSVUploadLog = require('../models/CSVUploadLog');
const CSVUploadChunk = require('../models/CSVUploadChunk');
const { validateRow } = require('../services/csvValidationService');
const { commit } = require('../services/csvCommitService');

exports.initUpload = async (req, res) => {
  const { entityType, filename, totalRows } = req.body || {};
  if (!entityType) return res.status(400).json({ message: 'entityType required' });
  const uploadId = uuidv4();
  await CSVUploadLog.create({ uploadId, entityType, filename, totalRows, status: 'in_progress', uploader: req.user?.sub });
  return res.json({ uploadId });
}

exports.uploadChunk = async (req, res) => {
  const { uploadId, chunkIndex, entityType } = req.body || {};
  const rows = req.body.rows || [];
  if (!uploadId) return res.status(400).json({ message: 'uploadId required' });
  const validatedRows = [];
  let validCount = 0, invalidCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const result = validateRow(entityType, r);
    validatedRows.push({ original: r, normalized: result.normalizedRow, valid: result.valid, errors: result.errors });
    if (result.valid) validCount++; else invalidCount++;
  }
  await CSVUploadChunk.create({ uploadId, chunkIndex, rows: validatedRows, validCount, invalidCount });
  const agg = await CSVUploadChunk.aggregate([
    { $match: { uploadId } },
    { $group: { _id: null, v: { $sum: '$validCount' }, iv: { $sum: '$invalidCount' } } }
  ]);
  const totals = agg[0] || { v: 0, iv: 0 };
  await CSVUploadLog.updateOne({ uploadId }, { $set: { successfulRows: totals.v, failedRows: totals.iv } });
  return res.json({ uploadId, chunkIndex, validCount, invalidCount });
}

exports.status = async (req, res) => {
  const { uploadId } = req.params;
  const log = await CSVUploadLog.findOne({ uploadId }).lean();
  if (!log) return res.status(404).json({ message: 'Not found' });
  const chunks = await CSVUploadChunk.find({ uploadId }).lean();
  const errorsSample = [];
  for (const ch of chunks) {
    ch.rows?.forEach((r, idx) => { if (!r.valid && errorsSample.length < 20) errorsSample.push({ rowIndex: idx, errors: r.errors, rowData: r.original }) });
  }
  return res.json({ ...log, errorsSample });
}

exports.commit = async (req, res) => {
  const { uploadId } = req.body || {};
  const log = await CSVUploadLog.findOne({ uploadId });
  if (!log) return res.status(404).json({ message: 'Not found' });
  const chunks = await CSVUploadChunk.find({ uploadId }).sort({ chunkIndex: 1 }).lean();
  const rows = [];
  for (const ch of chunks) {
    for (const r of ch.rows || []) if (r.valid) rows.push(r.normalized);
  }
  try {
    const result = await commit(log.entityType, rows);
    await CSVUploadLog.updateOne({ uploadId }, { $set: { status: 'committed', successfulRows: result.success, failedRows: result.failed } });
    await CSVUploadChunk.deleteMany({ uploadId });
    return res.json({ summary: result, uploadId });
  } catch (e) {
    await CSVUploadLog.updateOne({ uploadId }, { $set: { status: 'failed' } });
    return res.status(400).json({ message: 'Commit failed', error: String(e?.message || e) });
  }
}

exports.single = async (req, res) => {
  const { entityType, rows = [], filename } = req.body || {};
  const uploadId = uuidv4();
  await CSVUploadLog.create({ uploadId, entityType, filename, totalRows: rows.length, status: 'in_progress', uploader: req.user?.sub });
  const validRows = [];
  const errors = [];
  rows.forEach((r, idx) => { const v = validateRow(entityType, r); if (v.valid) validRows.push(v.normalizedRow); else errors.push({ rowIndex: idx, errors: v.errors, rowData: r }); });
  if (errors.length) return res.status(400).json({ uploadId, errors });
  const result = await commit(entityType, validRows);
  await CSVUploadLog.updateOne({ uploadId }, { $set: { status: 'committed', successfulRows: result.success, failedRows: result.failed } });
  return res.json({ uploadId, summary: result });
}

exports.sample = async (req, res) => {
  const entityType = String(req.query.entityType || '').toLowerCase();
  const map = {
    faculty: 'name,email,departments,maxHoursPerWeek,preferred_slots,unavailability,locationBlock\n',
    courses: 'code,title,department,semester,credits,lecturesPerWeek,isLab,preferredRooms,assignedFacultyIds\n',
    classrooms: 'name,capacity,type,location\n',
    sections: 'department,year,sectionName,totalStudents\n',
    timing_templates: 'name,applyToAllYears,year,startTime,endTime,periodLengthMin,periodsPerDay,workingDays,breakWindows,lunchWindow,maxConsecutivePeriods,minGapBetweenSameFaculty,labContiguousMin\n',
    students: 'name,registration_no,year,section,password\n',
  };
  const content = map[entityType] || '';
  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
}

exports.errorsCsv = async (req, res) => {
  const { uploadId } = req.params;
  const chunks = await CSVUploadChunk.find({ uploadId }).sort({ chunkIndex: 1 }).lean();
  const lines = ['rowIndex,errors,rowData'];
  chunks.forEach((ch) => {
    ch.rows?.forEach((r, idx) => {
      if (!r.valid) {
        const err = (r.errors || []).join('|').replace(/\n/g,' ');
        const data = JSON.stringify(r.original).replace(/"/g, '"');
        lines.push(`${idx},"${err}","${data}"`);
      }
    });
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${uploadId}-errors.csv"`);
  res.send(lines.join('\n'));
}


