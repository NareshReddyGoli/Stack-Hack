import { useState, useEffect } from 'react'

export default function FacultyUnavailability() {
  const [unavailabilities, setUnavailabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedReason, setExpandedReason] = useState({})

  useEffect(() => {
    fetchUnavailabilities()
  }, [])

  async function fetchUnavailabilities() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/faculty-unavailability', { credentials: 'include' })
      if (res.status === 404) {
        setError('API endpoint not found. Please ensure backend routes are configured.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load unavailabilities')
      // normalize response: backend may return array or { unavailability: [] }
      const list = Array.isArray(data) ? data : (data?.unavailability || [])
      setUnavailabilities(list)
    } catch (e) {
      setError(e.message || 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/api/admin/faculty-unavailability/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      })
      
      if (!res.ok) throw new Error('Failed to update status')
      
      setSuccess(`Request ${status} successfully`)
      fetchUnavailabilities()
    } catch (e) {
      setError(e.message)
    }
  }

  function toggleReason(id) {
    setExpandedReason((p) => ({ ...p, [id]: !p[id] }))
  }

  if (loading) {
    return (
      <section>
        <h2>Faculty Unavailability Requests</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Loading requests...</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>Faculty Unavailability Requests</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Review and manage faculty unavailability notifications</p>
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

      {unavailabilities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No unavailability requests</p>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Faculty unavailability notifications will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {unavailabilities.map((item) => (
            <div 
              key={item._id} 
              className="card"
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `2px solid ${
                  item.status === 'approved' ? '#10b981' : 
                  item.status === 'rejected' ? '#ef4444' : 
                  'rgba(102, 126, 234, 0.2)'
                }`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.3rem' }}>
                    {item.facultyName || item.facultyEmail || item.facultyId}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                    {item.facultyEmail}
                  </p>
                </div>
                <span 
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 
                      item.status === 'approved' ? '#d1fae5' : 
                      item.status === 'rejected' ? '#fee2e2' : 
                      '#fef3c7',
                    color: 
                      item.status === 'approved' ? '#065f46' : 
                      item.status === 'rejected' ? '#991b1b' : 
                      '#92400e'
                  }}
                >
                  {item.status || 'pending'}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Date</p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 600, color: '#1e293b' }}>
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Day</p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 600, color: '#1e293b' }}>
                    {item.day}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Time Period</p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 600, color: '#1e293b' }}>
                    Period {item.startPeriod} - {item.endPeriod}
                  </p>
                </div>
              </div>

              <div style={{ 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px', 
                borderLeft: '4px solid #667eea',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    <strong>Reason:</strong>
                  </p>
                  <p style={{ margin: 0, color: '#1e293b', lineHeight: 1.6, 
                    whiteSpace: expandedReason[item._id] ? 'normal' : 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.reason}
                  </p>
                </div>
                <div style={{ flex: '0 0 auto' }}>
                  <button
                    onClick={() => toggleReason(item._id)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      color: '#1f2937',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {expandedReason[item._id] ? 'Hide reason' : 'Show reason'}
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                Submitted: {new Date(item.createdAt || Date.now()).toLocaleString()}
              </p>

              {(!item.status || item.status === 'pending') && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => updateStatus(item._id, 'approved')}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => updateStatus(item._id, 'rejected')}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {item.status && item.status !== 'pending' && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: item.status === 'approved' ? '#d1fae5' : '#fee2e2',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: item.status === 'approved' ? '#065f46' : '#991b1b'
                }}>
                  {item.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
