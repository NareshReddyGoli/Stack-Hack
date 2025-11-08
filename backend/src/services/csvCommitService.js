const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const Section = require('../models/Section');
const Student = require('../models/Student');
const TimingTemplate = require('../models/TimingTemplate');

async function commit(entityType, rows) {
  switch ((entityType || '').toLowerCase()) {
    case 'faculty':
      return upsertMany(Faculty, rows, ['email']);
    case 'courses':
    case 'course':
      return upsertMany(Course, rows, ['code']);
    case 'classrooms':
    case 'classroom':
      return upsertMany(Classroom, rows, ['name']);
    case 'sections':
    case 'section':
      return upsertMany(Section, rows, ['department','year','sectionName']);
    case 'students':
    case 'student':
      return upsertMany(Student, rows, ['registration_no']);
    case 'timing_templates':
    case 'timingtemplate':
    case 'timingtemplates':
      return upsertMany(TimingTemplate, rows, ['name','year']);
    default:
      throw new Error('Unknown entityType');
  }
}

async function upsertMany(Model, rows, keys) {
  let success = 0, failed = 0; const errors = [];
  for (const r of rows) {
    try {
      const filter = buildFilter(keys, r);
      await Model.updateOne(filter, { $set: r }, { upsert: true });
      success++;
    } catch (e) {
      failed++; errors.push(String(e?.message || e));
    }
  }
  return { success, failed, errors };
}

function buildFilter(keys, row) {
  const filter = {};
  for (const k of keys) filter[k] = row[k];
  return filter;
}

module.exports = { commit };


