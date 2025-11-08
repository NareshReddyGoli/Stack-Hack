import { useState } from 'react'
import { validateEmail, validatePasswordBasic, validateRegistrationNo, validateTeacherId } from '../utils/validation'
import '../styles/Auth.css'
import { BookIcon, LightningIcon, TargetIcon, ChartIcon, GraduationCapIcon, ChalkboardIcon, ShieldIcon, EnvelopeIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons'

export default function Login() {
  const [mode, setMode] = useState('student') // 'student' | 'faculty' | 'admin'
  const [registrationNo, setRegistrationNo] = useState('')
  const [facultyIdentifier, setFacultyIdentifier] = useState('') // email or teacherId
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!validatePasswordBasic(password)) {
      setError('Enter your password')
      return
    }

    let body
    if (mode === 'student') {
      if (!validateRegistrationNo(registrationNo)) { setError('Enter a valid registration number'); return }
      body = { registration_no: registrationNo, password }
    } else if (mode === 'faculty') {
      if (validateEmail(facultyIdentifier)) body = { email: facultyIdentifier, password }
      else if (validateTeacherId(facultyIdentifier)) body = { teacher_id: facultyIdentifier, password }
      else { setError('Enter a valid faculty email or teacher ID'); return }
    } else {
      if (!validateEmail(email)) { setError('Enter a valid admin email'); return }
      body = { email, password }
    }

    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Login failed')
      const role = data?.role
      if (role === 'admin') window.location.href = '/admin'
      else if (role === 'faculty') window.location.href = '/faculty'
      else window.location.href = '/student'
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
          <div className="banner-icon"><BookIcon size={28} /></div>
          <h1 className="banner-title">Welcome Back to CampusHub</h1>
          <p className="banner-subtitle">AI-Powered Scheduling System</p>
          <div className="banner-features">
            <div className="banner-feature">
              <span className="feature-icon"><LightningIcon size={14} /></span>
              <span>Generate timetables in seconds</span>
            </div>
            <div className="banner-feature">
              <span className="feature-icon"><TargetIcon size={14} /></span>
              <span>Zero conflicts guaranteed</span>
            </div>
            <div className="banner-feature">
              <span className="feature-icon"><ChartIcon size={14} /></span>
              <span>Real-time optimization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-form-container">
        <div className="auth-form-card">
          <div className="auth-header">
            <h2 className="auth-title">Sign In</h2>
            <p className="auth-subtitle">Choose your role and login to continue</p>
          </div>

          {/* Role Tabs */}
          <div className="role-tabs" role="tablist" aria-label="Login type">
            <button 
              role="tab" 
              aria-selected={mode==='student'} 
              className={`role-tab ${mode==='student'?'active':''}`} 
              onClick={() => setMode('student')}
            >
              <span className="tab-icon"><GraduationCapIcon size={14} /></span>
              <span>Student</span>
            </button>
            <button 
              role="tab" 
              aria-selected={mode==='faculty'} 
              className={`role-tab ${mode==='faculty'?'active':''}`} 
              onClick={() => setMode('faculty')}
            >
              <span className="tab-icon"><ChalkboardIcon size={14} /></span>
              <span>Faculty</span>
            </button>
            <button 
              role="tab" 
              aria-selected={mode==='admin'} 
              className={`role-tab ${mode==='admin'?'active':''}`} 
              onClick={() => setMode('admin')}
            >
              <span className="tab-icon"><ShieldIcon size={14} /></span>
              <span>Admin</span>
            </button>
          </div>

          {error && (
            <div role="alert" className="auth-alert error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form" aria-label="Login form">
            {mode === 'student' && (
              <div className="input-group">
                <label htmlFor="registrationNo" className="input-label">Registration Number</label>
                <div className="input-wrapper">
                  <span className="input-icon"><GraduationCapIcon size={16} /></span>
                  <input 
                    id="registrationNo" 
                    type="text" 
                    className="form-input"
                    placeholder="Enter your registration number"
                    value={registrationNo} 
                    onChange={e => setRegistrationNo(e.target.value)} 
                    autoComplete="username" 
                    required 
                  />
                </div>
              </div>
            )}
            {mode === 'faculty' && (
              <div className="input-group">
                <label htmlFor="facultyIdentifier" className="input-label">Email or Teacher ID</label>
                <div className="input-wrapper">
                  <span className="input-icon"><EnvelopeIcon size={16} /></span>
                  <input 
                    id="facultyIdentifier" 
                    type="text" 
                    className="form-input"
                    placeholder="Enter your email or teacher ID"
                    value={facultyIdentifier} 
                    onChange={e => setFacultyIdentifier(e.target.value)} 
                    autoComplete="username" 
                    required 
                  />
                </div>
              </div>
            )}
            {mode === 'admin' && (
              <div className="input-group">
                <label htmlFor="email" className="input-label">Admin Email</label>
                <div className="input-wrapper">
                  <span className="input-icon"><EnvelopeIcon size={16} /></span>
                  <input 
                    id="email" 
                    type="email" 
                    className="form-input"
                    placeholder="Enter your admin email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    autoComplete="username" 
                    required 
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><LockIcon size={16} /></span>
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  autoComplete="current-password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
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
            </div>

            <div className="form-footer">
              <a className="forgot-link" href="/forgot-password">Forgot password?</a>
            </div>

            <button 
              disabled={loading} 
              className="btn-login" 
              type="submit" 
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path d="M7.5 15L12.5 10L7.5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            <div className="signup-prompt">
              <span>Don't have an account?</span> <a href="/signup" className="signup-link">Sign up</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


