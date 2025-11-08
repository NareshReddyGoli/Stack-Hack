export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRegistrationNo(value) {
  // Allow alphanumeric with dashes/underscores, 6-20 chars. Adjust to campus format if needed.
  return /^[A-Z0-9-_]{6,20}$/i.test(value || '')
}

export function validatePasswordStrong(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter'
  if (!/[0-9]/.test(pw)) return 'Include at least one number'
  return ''
}

export function validatePasswordBasic(pw) {
  return typeof pw === 'string' && pw.length >= 1
}

export function detectLoginType(identifier) {
  // If it matches a plausible registration number, treat as student; else email
  if (validateRegistrationNo(identifier) && !validateEmail(identifier)) return 'student'
  return 'email'
}

export function validateTeacherId(value) {
  // Alphanumeric teacher ID, 3-20 chars
  return /^[A-Z0-9-_]{3,20}$/i.test(value || '')
}


