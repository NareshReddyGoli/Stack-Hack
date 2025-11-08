const mongoose = require('mongoose');
const Timetable = require('./backend/src/models/Timetable');

async function testTimetableQuery() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetable_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check for published timetables
    const publishedTimetables = await Timetable.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    console.log(`Found ${publishedTimetables.length} published timetables`);
    
    publishedTimetables.forEach((tt, index) => {
      console.log(`\nTimetable ${index + 1}:`);
      console.log(`  ID: ${tt._id}`);
      console.log(`  Status: ${tt.status}`);
      console.log(`  Created: ${tt.createdAt}`);
      console.log(`  Department: ${tt.department}`);
      console.log(`  Year: ${tt.year}`);
      console.log(`  Sections: ${tt.sections?.map(s => s.sectionName).join(', ') || 'none'}`);
      console.log(`  Schedule entries: ${tt.sections?.reduce((total, section) => total + (section.schedule?.length || 0), 0) || 0}`);
    });
    
    // Check for draft timetables
    const draftTimetables = await Timetable.find({ status: 'draft' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    console.log(`\nFound ${draftTimetables.length} draft timetables`);
    
    draftTimetables.forEach((tt, index) => {
      console.log(`\nDraft Timetable ${index + 1}:`);
      console.log(`  ID: ${tt._id}`);
      console.log(`  Status: ${tt.status}`);
      console.log(`  Created: ${tt.createdAt}`);
      console.log(`  Sections: ${tt.sections?.map(s => s.sectionName).join(', ') || 'none'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testTimetableQuery();