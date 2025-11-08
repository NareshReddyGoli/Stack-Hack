import { useState, useEffect } from 'react'

export default function FacultyUnavailable(){
  const [unavailabilities, setUnavailabilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    date: '',
    day: '',
    startPeriod: '',
    endPeriod: '',
    reason: ''
  })

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const periods = Array.from({ length: 9 }, (_, i) => i + 1)

  useEffect(() => {
    fetchUnavailabilities()
  }, [])

  async function fetchUnavailabilities() {
    try {
      const res = await fetch('/api/faculty/unavailability', { credentials: 'include' })
      if (res.status === 404) {
        // Backend route not available yet - silently ignore
        return
      }
      const data = await res.json()
      // normalize response: backend may return an array or an object { unavailability: [] }
      const list = Array.isArray(data) ? data : (data?.unavailability || [])
      if (res.ok) {
        setUnavailabilities(list)
      }
    } catch (e) {
      console.error('Failed to fetch unavailabilities:', e)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.date || !formData.day || !formData.startPeriod || !formData.endPeriod || !formData.reason) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/faculty/unavailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.message || 'Failed to mark unavailability')
      
      setSuccess('Unavailability marked successfully!')
      setFormData({
        date: '',
        day: '',
        startPeriod: '',
        endPeriod: '',
        reason: ''
      })
      fetchUnavailabilities()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteUnavailability(id) {
    if (!confirm('Are you sure you want to delete this unavailability?')) return
    
    try {
      const res = await fetch(`/api/faculty/unavailability/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        setSuccess('Unavailability deleted successfully')
        fetchUnavailabilities()
      }
    } catch (e) {
      setError('Failed to delete unavailability')
    }
  }

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>Mark Unavailability</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Notify administration about your unavailable periods</p>
      </div>

      {error && (
        <div className="alert error" style={{ marginBottom: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert success" style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a' }}>
          {success}
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Add Unavailability</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                Day
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem',
                  background: 'white'
                }}
                required
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                  Start Period
                </label>
                <select
                  value={formData.startPeriod}
                  onChange={(e) => setFormData({ ...formData, startPeriod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                  required
                >
                  <option value="">Select Period</option>
                  {periods.map(p => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                  End Period
                </label>
                <select
                  value={formData.endPeriod}
                  onChange={(e) => setFormData({ ...formData, endPeriod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                  required
                >
                  <option value="">Select Period</option>
                  {periods.map(p => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
                Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please describe the reason for your unavailability..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Submitting...' : 'Mark Unavailable'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Your Unavailabilities</h3>
        
        {unavailabilities.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
            No unavailabilities marked yet
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {unavailabilities.map((item, idx) => (
              <div 
                key={item._id || idx} 
                style={{
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  background: 'rgba(102, 126, 234, 0.02)',
                  display: 'grid',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong style={{ color: '#667eea', fontSize: '1.1rem' }}>
                      {item.day} - {new Date(item.date).toLocaleDateString()}
                    </strong>
                    <p style={{ margin: '0.25rem 0', color: '#64748b' }}>
                      Period {item.startPeriod} to {item.endPeriod}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteUnavailability(item._id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
                <p style={{ margin: 0, color: '#1e293b', padding: '0.75rem', background: 'white', borderRadius: '6px', borderLeft: '3px solid #667eea' }}>
                  <strong>Reason:</strong> {item.reason}
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                  Status: <span style={{ color: item.status === 'approved' ? '#16a34a' : item.status === 'rejected' ? '#dc2626' : '#f59e0b', fontWeight: 600 }}>
                    {item.status || 'pending'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


