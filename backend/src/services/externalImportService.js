const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const Timetable = require('../models/Timetable');
const FacultyRoutine = require('../models/FacultyRoutine');

const BASE_DIR = path.resolve(process.cwd(), 'timetable generatorv2', 'out');

function listDatasets() {
  if (!fs.existsSync(BASE_DIR)) return [];
  return fs.readdirSync(BASE_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

async function importDataset(dataset) {
  const dir = path.join(BASE_DIR, dataset);
  if (!fs.existsSync(dir)) throw new Error('Dataset not found');

  // Import master timetable structure (if applicable). We'll also import per-section files.
  const sectionsDir = path.join(dir, 'sections');
  const facultyDir = path.join(dir, 'faculty');

  // Import section timetables
  if (fs.existsSync(sectionsDir)) {
    const files = fs.readdirSync(sectionsDir).filter(f => f.endsWith('.csv'));
    for (const f of files) {
      const filePath = path.join(sectionsDir, f);
      const { department, year, sectionName, schedule } = await parseSectionCsv(filePath);
      await Timetable.updateOne(
        { department, year, 'sections.sectionName': sectionName },
        {
          $set: {
            department,
            year,
            status: 'draft',
          },
          $setOnInsert: { generatedAt: new Date(), generatedBy: 'external-import', generatedForYears: [year], sections: [] },
        },
        { upsert: true }
      );
      const tt = await Timetable.findOne({ department, year });
      const idx = tt.sections.findIndex(s => s.sectionName === sectionName);
      if (idx >= 0) tt.sections[idx].schedule = schedule; else tt.sections.push({ sectionName, schedule });
      await tt.save();
    }
  }

  // Import faculty routines
  if (fs.existsSync(facultyDir)) {
    const files = fs.readdirSync(facultyDir).filter(f => f.endsWith('.csv'));
    for (const f of files) {
      const filePath = path.join(facultyDir, f);
      const { facultyEmail, entries } = await parseFacultyCsv(filePath);
      await FacultyRoutine.updateOne(
        { facultyEmail, sourceDataset: dataset },
        { $set: { entries } },
        { upsert: true }
      );
    }
  }

  return { ok: true };
}

function parseSectionCsv(filePath) {
  return new Promise((resolve, reject) => {
    const out = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', row => out.push(row))
      .on('end', () => {
        // Expect headers include: department,year,section,day,periodIndex,courseId,facultyId,roomId
        const first = out[0] || {};
        const department = first.department || 'CSE';
        const year = Number(first.year) || 1;
        const sectionName = first.section || first.sectionName || 'A';
        const schedule = out.map(r => ({ day: r.day, periodIndex: Number(r.periodIndex)||0, courseId: r.courseId, facultyId: r.facultyId, roomId: r.roomId, locked: false }));
        resolve({ department, year, sectionName, schedule });
      })
      .on('error', reject);
  });
}

function parseFacultyCsv(filePath) {
  return new Promise((resolve, reject) => {
    const out = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', row => out.push(row))
      .on('end', () => {
        // Expect headers: email,day,periodIndex,courseCode,section,room
        const first = out[0] || {};
        const facultyEmail = (first.email || '').toLowerCase();
        const entries = out.map(r => ({ day: r.day, periodIndex: Number(r.periodIndex)||0, courseCode: r.courseCode, section: r.section, room: r.room }));
        resolve({ facultyEmail, entries });
      })
      .on('error', reject);
  });
}

module.exports = { listDatasets, importDataset };


