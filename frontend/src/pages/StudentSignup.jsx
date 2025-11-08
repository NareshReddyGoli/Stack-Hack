import { useState } from 'react'
import SignupForm from '../components/SignupForm'

export default function StudentSignup() {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(form) {
    setError(''); setSuccess('')
    try {
      const res = await fetch('/api/auth/student-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Signup failed')
      }
      setSuccess('Signup successful! Redirecting to login...')
      setTimeout(() => { window.location.href = '/login' }, 1200)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <main className="container-narrow">
      <h2>Student Signup</h2>
      {error && <div role="alert" className="alert error">{error}</div>}
      {success && <div role="status" className="alert success">{success}</div>}
      <SignupForm onSubmit={handleSubmit} />
    </main>
  )
}


