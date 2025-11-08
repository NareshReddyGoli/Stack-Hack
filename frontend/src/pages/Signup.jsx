import { useState } from 'react'
import { validateRegistrationNo, validatePasswordStrong } from '../utils/validation'
import '../styles/Auth.css'
import { GraduationCapIcon, UserIcon, EnvelopeIcon, CalendarIcon, BuildingIcon, ClipboardIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons'

export default function Signup() {
  const [form, setForm] = useState({ 
    name: '', 
    registration_no: '', 
    email: '', 
    year: '1', 
    branch: '', 
    section: '', 
    password: '', 
    confirm_password: '' 
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function setField(k, v) { 
    setForm(prev => ({ ...prev, [k]: v }))
    // Clear error for this field when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }))
    }
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!validateRegistrationNo(form.registration_no)) e.registration_no = 'Enter a valid registration number'
    if (!form.email.trim()) e.email = 'Email is required'
    const y = Number(form.year)
    if (!y || y < 1 || y > 4) e.year = 'Year must be 1-4'
    if (!form.section.trim()) e.section = 'Section is required'
    const pw = validatePasswordStrong(form.password)
    if (pw) e.password = pw
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const res = await fetch('/api/auth/student-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          registration_no: form.registration_no.trim(),
          email: form.email.trim(),
          year: Number(form.year),
          branch: form.branch.trim(),
          section: form.section.trim(),
          password: form.password,
          confirm_password: form.confirm_password
        }),
        credentials: 'include',
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Signup failed')
      }
      
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Left Side - Gradient Banner */}
      <div className="auth-banner">
        <div className="banner-content">
          <div className="banner-icon"><GraduationCapIcon size={28} /></div>
          <h1 className="banner-title">Join CampusHub Today</h1>
          <p className="banner-subtitle">Create your account in minutes</p>
          <div className="banner-features">
            <div className="banner-feature">
              <span className="feature-icon"><CalendarIcon size={14} /></span>
              <span>Quick and easy registration</span>
            </div>
            <div className="banner-feature">
              <span className="feature-icon"><LockIcon size={14} /></span>
              <span>Secure and encrypted</span>
            </div>
            <div className="banner-feature">
              <span className="feature-icon"><BuildingIcon size={14} /></span>
              <span>Access from anywhere</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="auth-form-container">
        <div className="auth-form-card">
          <div className="auth-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Fill in your details to get started</p>
          </div>

          {error && (
            <div role="alert" className="auth-alert error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div role="status" className="auth-alert success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Name */}
            <div className="input-group">
              <label htmlFor="name" className="input-label">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon"><UserIcon size={16} /></span>
                <input 
                  id="name"
                  type="text"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              {errors.name && <div className="error-text">{errors.name}</div>}
            </div>

            {/* Registration Number */}
            <div className="input-group">
              <label htmlFor="registration_no" className="input-label">Registration Number</label>
              <div className="input-wrapper">
                <span className="input-icon"><GraduationCapIcon size={16} /></span>
                <input 
                  id="registration_no"
                  type="text"
                  className={`form-input ${errors.registration_no ? 'input-error' : ''}`}
                  placeholder="Enter your registration number"
                  value={form.registration_no}
                  onChange={e => setField('registration_no', e.target.value.toUpperCase())}
                  required
                />
              </div>
              {errors.registration_no && <div className="error-text">{errors.registration_no}</div>}
            </div>

            {/* Email */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><EnvelopeIcon size={16} /></span>
                <input 
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            {/* Year, Branch, Section - Grid */}
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="year" className="input-label">Year</label>
                <div className="input-wrapper">
                  <span className="input-icon"><CalendarIcon size={16} /></span>
                  <select 
                    id="year"
                    className={`form-input ${errors.year ? 'input-error' : ''}`}
                    value={form.year}
                    onChange={e => setField('year', e.target.value)}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                {errors.year && <div className="error-text">{errors.year}</div>}
              </div>

              <div className="input-group">
                <label htmlFor="branch" className="input-label">Branch</label>
                <div className="input-wrapper">
                  <span className="input-icon"><BuildingIcon size={16} /></span>
                  <input 
                    id="branch"
                    type="text"
                    className="form-input"
                    placeholder="e.g., CSE"
                    value={form.branch}
                    onChange={e => setField('branch', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="section" className="input-label">Section</label>
                <div className="input-wrapper">
                  <span className="input-icon"><ClipboardIcon size={16} /></span>
                  <input 
                    id="section"
                    type="text"
                    className={`form-input ${errors.section ? 'input-error' : ''}`}
                    placeholder="e.g., A"
                    value={form.section}
                    onChange={e => setField('section', e.target.value.toUpperCase())}
                    required
                  />
                </div>
                {errors.section && <div className="error-text">{errors.section}</div>}
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><LockIcon size={16} /></span>
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
              {errors.password && <div className="error-text">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label htmlFor="confirm_password" className="input-label">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><LockIcon size={16} /></span>
                <input 
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={e => setField('confirm_password', e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
              {errors.confirm_password && <div className="error-text">{errors.confirm_password}</div>}
            </div>

            <button 
              disabled={loading} 
              className="btn-login" 
              type="submit"
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path d="M7.5 15L12.5 10L7.5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            <div className="signup-prompt">
              <span>Already have an account?</span> <a href="/login" className="signup-link">Sign in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
