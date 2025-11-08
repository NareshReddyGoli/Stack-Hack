import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import TimetableGrid from '../../components/TimetableGrid'

export default function FacultySchedule(){
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/faculty/my-routine', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load')
      // Transform the data to match grid format
      const transformed = (data.entries || []).map(entry => ({
        day: entry.day,
        periodIndex: entry.periodIndex,
        courseId: entry.courseCode || entry.courseId,
        section: entry.section,
        roomId: entry.room || entry.roomId,
        kind: entry.kind
      }))
      setSchedule(transformed)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchSchedule()

    // Set up socket.io for real-time updates
    const socket = io(window.location.origin, { 
      path: '/socket.io', 
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    // Connection status handlers
    socket.on('connect', () => {
      console.log('Faculty Socket.IO connected successfully')
    })

    socket.on('connect_error', (error) => {
      console.error('Faculty Socket.IO connection error:', error)
    })

    socket.on('disconnect', (reason) => {
      console.log('Faculty Socket.IO disconnected:', reason)
    })

    // Listen for new timetable notifications
    socket.on('newNotification', (data) => {
      console.log('Faculty received newNotification:', data)
      if (data.notification?.title === 'New Timetable Available') {
        // Refresh schedule when new timetable is available
        fetchSchedule()
      }
    })

    // Listen for schedule updates
    socket.on('scheduleUpdate', (data) => {
      console.log('Faculty received scheduleUpdate:', data)
      // Refresh schedule when schedule is updated
      fetchSchedule()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>My Teaching Schedule</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Your weekly class assignments</p>
      </div>
      
      {error && (
        <div className="alert error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Loading your schedule...</p>
        </div>
      ) : schedule.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No schedule assigned yet</p>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Your teaching schedule will appear here once assignments are made</p>
        </div>
      ) : (
        <TimetableGrid schedule={schedule} showFaculty={false} showSection={true} />
      )}
    </section>
  )
}


