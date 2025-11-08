import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

export default function RecentUpdates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpdates()
    
    // Connect to socket for real-time updates
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000')
    socket.on('newAllocation', (update) => {
      setUpdates(prev => [formatUpdate(update), ...prev])
    })
    
    return () => socket.disconnect()
  }, [])
  
  const loadUpdates = async () => {
    try {
      const res = await fetch('/api/admin/updates', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUpdates(data.map(formatUpdate))
      }
    } catch (e) {
      console.error('Load updates error:', e)
    } finally {
      setLoading(false)
    }
  }
  
  const formatUpdate = (update) => {
    const { type, details, periodIndex, day, roomId } = update
    
    if (type === 'class') {
      return {
        id: update._id || Date.now(),
        text: `${details.section} - Period ${periodIndex} - ${details.facultyName} (${details.facultyId}) - Room ${roomId} - ${details.subject || 'No subject'}`,
        type: 'class',
        date: update.createdAt || new Date(),
        duration: details.durationMinutes
      }
    }
    
    if (type === 'event') {
      return {
        id: update._id || Date.now(),
        text: `Room ${roomId} booked for event "${details.description}" for ${Math.floor(details.durationMinutes/60)}h ${details.durationMinutes%60}m`,
        type: 'event',
        date: update.createdAt || new Date(),
        duration: details.durationMinutes
      }
    }
    
    if (type === 'exam') {
      return {
        id: update._id || Date.now(),
        text: `${details.examType.toUpperCase()} exam scheduled for ${(details.sections || []).join(', ')} in Room ${roomId}`,
        type: 'exam',
        date: update.createdAt || new Date(),
        duration: details.durationMinutes
      }
    }
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }
  
  if (loading) return <div>Loading updates...</div>
  
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#1e293b' }}>Recent Updates</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {updates.length === 0 ? (
          <div style={{ color: '#64748b', padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '8px' }}>
            No updates yet
          </div>
        ) : (
          updates.map(update => (
            <div 
              key={update.id}
              style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: `4px solid ${
                  update.type === 'class' ? '#3b82f6' : 
                  update.type === 'event' ? '#10b981' :
                  '#8b5cf6'
                }`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <div style={{ color: '#1e293b', marginBottom: '.25rem' }}>
                    {update.text}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '.875rem' }}>
                    Duration: {Math.floor(update.duration/60)}h {update.duration%60}m
                  </div>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '.75rem', whiteSpace: 'nowrap' }}>
                  {formatDate(update.date)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}