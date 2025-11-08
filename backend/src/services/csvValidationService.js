function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '')
}

function validateFaculty(row) {
  const errors = []
  const normalized = {
    name: row.name?.trim(),
    email: row.email?.trim()?.toLowerCase(),
    departments: (row.departments || '')
      .split(/[;|,]/).map(s=>s.trim()).filter(Boolean),
    maxHoursPerWeek: Number(row.maxHoursPerWeek) || 0,
    preferredSlots: [],
    unavailability: [],
    locationBlock: row.locationBlock?.trim() || ''
  }
  if (!normalized.name) errors.push('name required')
  if (!normalized.email || !isEmail(normalized.email)) errors.push('valid email required')
  if (!normalized.departments.length) errors.push('departments required')
  const valid = errors.length === 0
  return { valid, errors, normalizedRow: normalized }
}

function validateCourse(row) {
  const errors = []
  const normalized = {
    code: String(row.code || '').trim(),
    title: String(row.title || '').trim(),
    department: String(row.department || '').trim(),
    semester: Number(row.semester) || 0,
    credits: Number(row.credits) || 0,
    lecturesPerWeek: Number(row.lecturesPerWeek) || 0,
    isLab: String(row.isLab || '').toLowerCase() === 'true' || row.isLab === true,
    preferredRooms: (row.preferredRooms || '').split(/[;|,]/).map(s=>s.trim()).filter(Boolean),
    assignedFacultyIds: (row.assignedFacultyIds || '').split(/[;|,]/).map(s=>s.trim()).filter(Boolean),
  }
  if (!normalized.code) errors.push('code required')
  if (normalized.semester < 1 || normalized.semester > 8) errors.push('semester 1..8')
  if (normalized.lecturesPerWeek <= 0) errors.push('lecturesPerWeek > 0')
  return { valid: errors.length === 0, errors, normalizedRow: normalized }
}

function validateClassroom(row) {
  const errors = []
  const normalized = {
    name: String(row.name || '').trim(),
    capacity: Number(row.capacity) || 0,
    type: ['lab','theory'].includes(String(row.type || '').toLowerCase()) ? String(row.type).toLowerCase() : 'theory',
    location: String(row.location || '').trim(),
  }
  if (!normalized.name) errors.push('name required')
  if (normalized.capacity <= 0) errors.push('capacity must be positive')
  return { valid: errors.length === 0, errors, normalizedRow: normalized }
}

function validateSection(row) {
  const errors = []
  const normalized = {
    department: String(row.department || '').trim(),
    year: Number(row.year) || 0,
    sectionName: String(row.sectionName || row.section || '').trim(),
    totalStudents: Number(row.totalStudents) || 0,
  }
  if (!normalized.department) errors.push('department required')
  if (normalized.year < 1 || normalized.year > 4) errors.push('year 1..4')
  if (!normalized.sectionName) errors.push('sectionName required')
  if (normalized.totalStudents <= 0) errors.push('totalStudents > 0')
  return { valid: errors.length === 0, errors, normalizedRow: normalized }
}

function validateTimingTemplate(row) {
  const errors = []
  const normalized = {
    name: String(row.name || '').trim(),
    applyToAllYears: String(row.applyToAllYears || 'true').toLowerCase() === 'true',
    year: row.year ? Number(row.year) : undefined,
    startTime: String(row.startTime || '').trim(),
    endTime: String(row.endTime || '').trim(),
    periodLengthMin: row.periodLengthMin ? Number(row.periodLengthMin) : undefined,
    periodsPerDay: row.periodsPerDay ? Number(row.periodsPerDay) : undefined,
    workingDays: (row.workingDays || 'Mon;Tue;Wed;Thu;Fri').split(/[;|,]/).map(s=>s.trim()).filter(Boolean),
    breakWindows: [],
    lunchWindow: undefined,
    maxConsecutivePeriods: Number(row.maxConsecutivePeriods) || 4,
    minGapBetweenSameFaculty: Number(row.minGapBetweenSameFaculty) || 0,
    labContiguousMin: Number(row.labContiguousMin) || 0,
  }
  if (!normalized.name) errors.push('name required')
  if (!/^\d{2}:\d{2}$/.test(normalized.startTime)) errors.push('startTime HH:MM')
  if (!/^\d{2}:\d{2}$/.test(normalized.endTime)) errors.push('endTime HH:MM')
  return { valid: errors.length === 0, errors, normalizedRow: normalized }
}

function validateStudent(row) {
  const errors = []
  const normalized = {
    name: String(row.name || '').trim(),
    registration_no: String(row.registration_no || row.registrationNo || '').trim(),
    year: Number(row.year) || 0,
    section: String(row.section || '').trim(),
    password: String(row.password || '').trim(),
  }
  if (!normalized.name) errors.push('name required')
  if (!normalized.registration_no) errors.push('registration_no required')
  if (normalized.year < 1 || normalized.year > 4) errors.push('year 1..4')
  if (!normalized.section) errors.push('section required')
  if (!normalized.password || normalized.password.length < 8) errors.push('password min 8')
  return { valid: errors.length === 0, errors, normalizedRow: normalized }
}

function validateRow(entityType, row) {
  switch ((entityType || '').toLowerCase()) {
    case 'faculty': return validateFaculty(row)
    case 'courses':
    case 'course': return validateCourse(row)
    case 'classrooms':
    case 'classroom': return validateClassroom(row)
    case 'sections':
    case 'section': return validateSection(row)
    case 'timing_templates':
    case 'timingtemplate':
    case 'timingtemplates': return validateTimingTemplate(row)
    case 'students':
    case 'student': return validateStudent(row)
    default: return { valid: false, errors: ['Unknown entityType'], normalizedRow: row }
  }
}

module.exports = { validateRow }


