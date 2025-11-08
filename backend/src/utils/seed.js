const bcrypt = require('bcrypt');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');

async function seedInitialAdmin() {
  const email = process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_INIT_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_INIT_PW;
  const teacherId = process.env.ADMIN_INITIAL_TEACHER_ID || 'ADMIN';
  if (!email || !password) return; // skip if not configured

  const existing = await Faculty.findOne({ email });
  if (existing) return;

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  await Faculty.create({
    name: 'Admin',
    email,
    teacherId,
    passwordHash,
    role: 'admin',
    initialPasswordSet: false,
    createdByAdmin: true,
  });
}

async function seedTestStudent() {
  // Seed only if registration_no and password provided
  const reg = process.env.TEST_STUDENT_REG || process.env.SEED_STUDENT_REG;
  const pw = process.env.TEST_STUDENT_PASSWORD || process.env.SEED_STUDENT_PASSWORD;
  if (!reg || !pw) return;
  const existing = await Student.findOne({ registration_no: reg });
  if (existing) return;
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(pw, saltRounds);
  await Student.create({
    name: process.env.TEST_STUDENT_NAME || 'Test Student',
    registration_no: reg,
    email: (process.env.TEST_STUDENT_EMAIL || '').toLowerCase() || undefined,
    year: Number(process.env.TEST_STUDENT_YEAR || 1),
    section: process.env.TEST_STUDENT_SECTION || 'A',
    branch: process.env.TEST_STUDENT_BRANCH || 'CSE',
    passwordHash,
  });
}

module.exports = { seedInitialAdmin, seedTestStudent };


