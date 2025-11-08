import { useState } from 'react'
import { validateRegistrationNo, validatePasswordStrong } from '../utils/validation'
import '../styles/Auth.css'

export default function SignupForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', registration_no: '', email: '', year: '1', branch: '', section: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  function validate() {
    const e = {}
    if (!form.name) e.name = 'Name is required'
    if (!validateRegistrationNo(form.registration_no)) e.registration_no = 'Enter a valid registration number'
    if (!form.email) e.email = 'Email is required'
    const y = Number(form.year)
    if (!y || y < 1 || y > 4) e.year = 'Year must be 1-4'
    if (!form.section) e.section = 'Section is required'
    const pw = validatePasswordStrong(form.password)
    if (pw) e.password = pw
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({ name: form.name.trim(), registration_no: form.registration_no.trim(), email: form.email.trim(), year: Number(form.year), branch: form.branch.trim(), section: form.section.trim(), password: form.password, confirm_password: form.confirm_password })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate aria-label="Student signup form">
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" value={form.name} onChange={e => setField('name', e.target.value)} autoComplete="name" required aria-invalid={!!errors.name} aria-describedby="name-err" />
        {errors.name && <div id="name-err" className="error-text">{errors.name}</div>}
      </div>

      <div className="field">
        <label htmlFor="registration_no">Registration number</label>
        <input id="registration_no" value={form.registration_no} onChange={e => setField('registration_no', e.target.value.toUpperCase())} required aria-invalid={!!errors.registration_no} aria-describedby="reg-err" />
        {errors.registration_no && <div id="reg-err" className="error-text">{errors.registration_no}</div>}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} required aria-invalid={!!errors.email} aria-describedby="email-err" />
        {errors.email && <div id="email-err" className="error-text">{errors.email}</div>}
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="year">Year</label>
          <select id="year" value={form.year} onChange={e => setField('year', e.target.value)} aria-invalid={!!errors.year} aria-describedby="year-err">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
          {errors.year && <div id="year-err" className="error-text">{errors.year}</div>}
        </div>
        <div className="field">
          <label htmlFor="branch">Branch</label>
          <input id="branch" value={form.branch} onChange={e => setField('branch', e.target.value.toUpperCase())} placeholder="e.g. CSE" />
        </div>
        <div className="field">
          <label htmlFor="section">Section</label>
          <input id="section" value={form.section} onChange={e => setField('section', e.target.value.toUpperCase())} required aria-invalid={!!errors.section} aria-describedby="section-err" />
          {errors.section && <div id="section-err" className="error-text">{errors.section}</div>}
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} autoComplete="new-password" onChange={e => setField('password', e.target.value)} required aria-invalid={!!errors.password} aria-describedby="password-err" />
          {errors.password && <div id="password-err" className="error-text">{errors.password}</div>}
        </div>
        <div className="field">
          <label htmlFor="confirm_password">Confirm password</label>
          <input id="confirm_password" type="password" value={form.confirm_password} autoComplete="new-password" onChange={e => setField('confirm_password', e.target.value)} required aria-invalid={!!errors.confirm_password} aria-describedby="confirm-err" />
          {errors.confirm_password && <div id="confirm-err" className="error-text">{errors.confirm_password}</div>}
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
        {loading ? 'Submitting...' : 'Create account'}
      </button>
    </form>
  )
}


