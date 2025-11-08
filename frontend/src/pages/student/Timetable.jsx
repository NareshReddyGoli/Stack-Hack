import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import TimetableGrid from '../../components/TimetableGrid'

export default function StudentTimetable(){
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/student/my-timetable', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load timetable')
      setSchedule(data.entries || [])
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchTimetable()

    // Set up socket.io for real-time updates
    const socket = io(window.location.origin, { 
      path: '/socket.io', 
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    // Connection status handlers
    socket.on('connect', () => {
      console.log('Socket.IO connected successfully')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason)
    })

    // Listen for new timetable notifications
    socket.on('newNotification', (data) => {
      console.log('Received newNotification:', data)
      if (data.notification?.title === 'New Timetable Available') {
        // Refresh timetable when new timetable is available
        fetchTimetable()
      }
    })

    // Listen for schedule updates
    socket.on('scheduleUpdate', (data) => {
      console.log('Received scheduleUpdate:', data)
      // Refresh timetable when schedule is updated
      fetchTimetable()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>My Timetable</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Your weekly class schedule</p>
      </div>
      
      {error && (
        <div className="alert error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Loading your timetable...</p>
        </div>
      ) : schedule.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No timetable available yet</p>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Your timetable will appear here once it's published</p>
        </div>
      ) : (
        <TimetableGrid schedule={schedule} showFaculty={true} />
      )}
    </section>
  )
}




