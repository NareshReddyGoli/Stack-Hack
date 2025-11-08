import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import TimetableGrid from '../../components/TimetableGrid'

// Standard working day order used by the timetable components
const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function FacultyTimetables() {
  const [faculties, setFaculties] = useState([])
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFaculties()

    // Set up socket.io for real-time updates
    const socket = io(window.location.origin, { 
      path: '/socket.io', 
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    // Connection status handlers
    socket.on('connect', () => {
      console.log('Admin Faculty Timetables Socket.IO connected successfully')
    })

    socket.on('connect_error', (error) => {
      console.error('Admin Faculty Timetables Socket.IO connection error:', error)
    })

    socket.on('disconnect', (reason) => {
      console.log('Admin Faculty Timetables Socket.IO disconnected:', reason)
    })

    // Listen for schedule updates to refresh faculty timetables
    socket.on('scheduleUpdate', (data) => {
      console.log('Admin Faculty Timetables received scheduleUpdate:', data)
      // Refresh current faculty schedule if one is selected
      if (selectedFaculty) {
        fetchFacultySchedule(selectedFaculty)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [selectedFaculty])

  async function fetchFaculties() {
    try {
      const res = await fetch('/api/admin/faculties', { credentials: 'include' })
      if (res.status === 404) {
        setError('API endpoint not found. Please ensure backend routes are configured.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load faculty')
      
      // Filter out duplicates and ensure required fields
      const uniqueFaculties = data.reduce((acc, f) => {
        const id = f._id || f.teacherId;
        if (id && !acc.find(existing => 
          String(existing._id) === String(f._id) || 
          String(existing.teacherId) === String(f.teacherId)
        )) {
          const faculty = {
            ...f,
            _id: String(f._id || f.teacherId),
            name: f.name || f.teacherId || 'Unknown',
            teacherId: String(f.teacherId || f._id)
          };
          console.log('Adding faculty to list:', faculty);
          acc.push(faculty);
        }
        return acc;
      }, []);

      console.log('Setting faculties list:', uniqueFaculties);
      setFaculties(uniqueFaculties);
      if (uniqueFaculties.length > 0) {
        const firstFaculty = uniqueFaculties[0];
        const facultyId = firstFaculty.teacherId || firstFaculty._id;
        console.log('Setting initial selected faculty:', facultyId);
        setSelectedFaculty(String(facultyId));
      }
    } catch (e) {
      console.error('Fetch faculties error:', e);
      setError(e.message || 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultySchedule(selectedFaculty)
    }
  }, [selectedFaculty])

  async function fetchFacultySchedule(facultyId) {
    try {
      setError('')
      setSchedule([])

      const res = await fetch('/api/admin/faculty-timetables', { credentials: 'include' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.message || 'Failed to load schedule')
      }
      
      const data = await res.json()
      console.log('Faculty timetables response:', data); // Debug log
      console.log('Looking for faculty with ID:', facultyId);
      
      // Find the routine for the selected faculty
      const facultyRoutine = data.routines?.find(r => {
        const routineFaculty = r.facultyId || {};
        const routineIds = [
          String(routineFaculty._id || ''),
          String(routineFaculty.teacherId || ''),
          String(routineFaculty.email || ''),
          String(r.facultyId || '')
        ].filter(Boolean);
        console.log('Checking routine IDs:', routineIds, 'against faculty ID:', facultyId);
        const searchId = String(facultyId || '');
        return routineIds.some(id => id === searchId);
      })

      if (!facultyRoutine) {
        console.log('No routine found for faculty:', facultyId) // Debug log
        return
      }
      
      // Convert the routine format to grid format
      const entries = []
      Object.entries(facultyRoutine.schedule || {}).forEach(([day, periods]) => {
        if (!Array.isArray(periods)) {
          console.warn('Invalid periods format for day:', day)
          return
        }

          periods.forEach((period, idx) => {
            if (period && !period.isEmpty) {
              entries.push({
                day,
                periodIndex: period.periodIndex || (idx + 1),
                dayIndex: period.dayIndex,
                courseId: period.course || '',
                section: period.section || '',
                roomId: period.room || '',
                kind: period.kind || '',
                isEmpty: period.isEmpty
              });
            } else {
              // Add an empty entry
              entries.push({
                day,
                periodIndex: idx + 1,
                dayIndex: workingDays.indexOf(day),
                courseId: '',
                section: '',
                roomId: '',
                kind: '',
                isEmpty: true
              });
            }
          })
      })
      
      console.log('Converted schedule entries:', entries) // Debug log
      setSchedule(entries)
    } catch (e) {
      console.error('Fetch faculty schedule error:', e)
      setError(e.message || 'Failed to load schedule')
      setSchedule([])
    }
  }

  if (loading) {
    return (
      <section>
        <h2>Faculty Timetables</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <p>Loading faculty list...</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>Faculty Timetables</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>View teaching schedules for all faculty members</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
          Select Faculty
        </label>
        <select 
          value={selectedFaculty} 
          onChange={(e) => setSelectedFaculty(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '2px solid rgba(102, 126, 234, 0.2)',
            fontSize: '1rem',
            background: 'white',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'}
        >
          {faculties.map(faculty => {
            const facultyId = String(faculty.teacherId || faculty._id);
            return (
              <option key={facultyId} value={facultyId}>
                {faculty.name || faculty.email || faculty.teacherId || 'Unknown'} ({facultyId})
              </option>
            );
          })}
        </select>
      </div>

      {error && (
        <div className="alert error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {selectedFaculty && schedule.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No schedule assigned yet</p>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>This faculty member has no teaching assignments</p>
        </div>
      )}

      {schedule.length > 0 && (
        <TimetableGrid schedule={schedule} showFaculty={false} showSection={true} />
      )}
    </section>
  )
}
