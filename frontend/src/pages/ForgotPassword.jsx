import { useState } from 'react'
import { validateEmail } from '../utils/validation'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (!validateEmail(email)) { setError('Enter a valid email'); return }
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
    })
    if (res.ok) setMessage('If your email exists, a reset link will be sent.')
    else setError('Unable to process request at this time')
  }

  return (
    <main className="container-narrow">
      <h2>Forgot Password</h2>
      {error && <div role="alert" className="alert error">{error}</div>}
      {message && <div role="status" className="alert success">{message}</div>}
      <form onSubmit={onSubmit} className="form" aria-label="Forgot password form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit">Request reset</button>
      </form>
    </main>
  )
}


