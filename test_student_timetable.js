// Test script to verify student timetable functionality
// This would normally require authentication, but we can test the database query logic

const mongoose = require('mongoose');
const Timetable = require('./backend/src/models/Timetable');
const Student = require('./backend/src/models/Student');

async function testStudentTimetable() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timetable_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find a student to test with
    const student = await Student.findOne().lean();
    if (!student) {
      console.log('No students found in database');
      return;
    }
    
    console.log(`Testing with student: ${student.registration_no}, Section: ${student.section}`);
    
    // Test the timetable query logic
    const tt = await Timetable.findOne({ 
      status: 'published', 
      'sections.sectionName': student.section 
    }).sort({ createdAt: -1 }).lean();
    
    if (!tt) {
      console.log(`No published timetable found for section: ${student.section}`);
      
      // Check if there are any timetables at all
      const anyTimetables = await Timetable.countDocuments();
      console.log(`Total timetables in database: ${anyTimetables}`);
      
      const anyPublished = await Timetable.countDocuments({ status: 'published' });
      console.log(`Published timetables: ${anyPublished}`);
      
      const anyDraft = await Timetable.countDocuments({ status: 'draft' });
      console.log(`Draft timetables: ${anyDraft}`);
      
      // Show available sections in published timetables
      const publishedTimetables = await Timetable.find({ status: 'published' }).lean();
      console.log('\nAvailable sections in published timetables:');
      publishedTimetables.forEach(tt => {
        const sections = tt.sections?.map(s => s.sectionName) || [];
        console.log(`  Timetable ${tt._id}: ${sections.join(', ')}`);
      });
      
      return;
    }
    
    console.log(`Found timetable: ${tt._id}`);
    console.log(`Timetable status: ${tt.status}`);
    console.log(`Timetable sections: ${tt.sections?.map(s => s.sectionName).join(', ')}`);
    
    const sec = (tt.sections || []).find((s) => s.sectionName === student.section);
    if (!sec) {
      console.log(`Section ${student.section} not found in timetable`);
      return;
    }
    
    console.log(`Found section ${student.section} with ${sec.schedule?.length || 0} schedule entries`);
    
    if (sec.schedule && sec.schedule.length > 0) {
      console.log('\nSample schedule entries:');
      sec.schedule.slice(0, 3).forEach(entry => {
        console.log(`  Day: ${entry.day}, Period: ${entry.periodIndex}, Course: ${entry.courseId}, Room: ${entry.roomId}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStudentTimetable();