const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const FacultyRoutine = require('../models/FacultyRoutine');

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv.parse({ columns: true, trim: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function importFacultyTimetables(outputDir, timetableId) {
  try {
    const facultyDir = path.join(outputDir, 'faculty');
    const files = fs.readdirSync(facultyDir);
    
    // Process each faculty CSV file
    for (const file of files) {
      if (!file.startsWith('faculty_') || !file.endsWith('.csv')) continue;
      
      const facultyId = file.replace('faculty_', '').replace('.csv', '');
      const filePath = path.join(facultyDir, file);
      const rows = await parseCSV(filePath);
      
      // Transform CSV data into entries
      const entries = rows.flatMap((row) => {
        const day = row['Day'];
        delete row['Day']; // Remove day column
        
        return Object.entries(row).map(([period, cell]) => {
          if (!cell || cell === 'BREAK' || cell === '') return null;
          
          // Parse cell content: "COURSE_CODE (Sec SECTION) [kind] @ROOM"
          const match = cell.match(/^(.+?) \(Sec (.+?)\) \[(.+?)\](?:@(.+))?$/);
          if (!match) return null;
          
          const [_, courseCode, section, kind, room] = match;
          const periodIndex = parseInt(period.replace('P', ''));
          
          return {
            day,
            periodIndex,
            courseCode,
            section,
            room: room || null,
            kind
          };
        }).filter(Boolean); // Remove null entries
      });
      
      // Save to MongoDB
      await FacultyRoutine.findOneAndUpdate(
        { facultyId, timetableId },
        { 
          facultyId,
          timetableId,
          entries,
          sourceDataset: path.basename(outputDir)
        },
        { upsert: true, new: true }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Import faculty timetables error:', error);
    throw error;
  }
}

module.exports = {
  importFacultyTimetables
};