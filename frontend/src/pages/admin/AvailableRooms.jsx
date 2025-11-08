import { useEffect, useState } from 'react'

export default function AvailableRooms() {
  const [data, setData] = useState({ slots: [], timetableId: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allocations, setAllocations] = useState({ allocations: [] })
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [allocType, setAllocType] = useState('class')
  const [classSection, setClassSection] = useState('')
  const [classFaculty, setClassFaculty] = useState('')
  const [classSubject, setClassSubject] = useState('')
  const [durationH, setDurationH] = useState(0)
  const [durationM, setDurationM] = useState(0)
  const [eventDesc, setEventDesc] = useState('')
  const [examType, setExamType] = useState('t1')
  const [examSections, setExamSections] = useState([''])
  const [sections, setSections] = useState([])
  const [faculties, setFaculties] = useState([])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/available-rooms', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch available rooms')
      const data = await res.json()
      setData(data)
      if (data?.timetableId) {
        // load timetable sections and faculties
        const rt = await fetch(`/api/admin/timetables/${data.timetableId}`, { credentials: 'include' })
        if (rt.ok) {
          const td = await rt.json()
          setSections((td.sections || []).map(s => s.sectionName))
        }
        const rf = await fetch('/api/admin/faculties', { credentials: 'include' })
        if (rf.ok) setFaculties(await rf.json())
        
        // load allocations
        const ra = await fetch(`/api/admin/room-allocations?timetableId=${data.timetableId}`, { credentials: 'include' })
        if (ra.ok) setAllocations(await ra.json())
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function openAllocate(slot, room) {
    setSelectedSlot(slot)
    setSelectedRoom(room)
    setAllocType('class')
    setClassSection(sections[0] || '')
    setClassFaculty('')
    setClassSubject('')
    setDurationH(0); setDurationM(0)
    setEventDesc('')
    setExamType('t1'); setExamSections([''])
    setModalOpen(true)
  }

  function addExamSection() { setExamSections(prev => [...prev, '']) }
  function updateExamSection(idx, val) { setExamSections(prev => prev.map((v,i) => i===idx?val:v)) }
  function removeExamSection(idx) { setExamSections(prev => prev.filter((_,i)=>i!==idx)) }

  async function submitAllocate() {
    if (!selectedSlot || !selectedRoom) return
    const duration = Number(durationH || 0) * 60 + Number(durationM || 0)
    if (!duration) return alert('Duration is required')

    let details = {}
    if (allocType === 'class') {
      if (!classSection || !classFaculty) return alert('Section and faculty required')
      
      // Check faculty availability
      const check = await fetch(`/api/admin/check-faculty-availability?facultyId=${classFaculty}&dayIndex=${selectedSlot.dayIndex}&periodIndex=${selectedSlot.periodIndex}&duration=${duration}`, { credentials: 'include' })
      if (check.ok) {
        const availability = await check.json()
        if (!availability.available) {
          return alert(availability.reason || 'Faculty is not available for this slot')
        }
      }
      
      details = { 
        section: classSection, 
        facultyId: classFaculty, 
        facultyName: (faculties.find(f=>f._id===classFaculty)||{}).name || '', 
        subject: classSubject || '', 
        durationMinutes: duration 
      }
    } else if (allocType === 'event') {
      if (!eventDesc) return alert('Event description required')
      details = { description: eventDesc, durationMinutes: duration }
    } else if (allocType === 'exam') {
      const secs = examSections.filter(Boolean)
      if (!secs.length) return alert('At least one section required')
      details = { examType, sections: secs, durationMinutes: duration }
    }

    // Check for slot conflicts
    const slotAllocations = allocations.allocations.filter(a => 
      Number(a.periodIndex) === Number(selectedSlot.periodIndex) && 
      Number(a.dayIndex) === Number(selectedSlot.dayIndex)
    )
    
    // Basic slot duration validation (assuming 1 hour slots)
    const slotDurationMins = 60
    if (duration > slotDurationMins) {
      return alert('Allocation duration cannot exceed slot duration')
    }
    
    const payload = { 
      timetableId: data.timetableId, 
      dayIndex: selectedSlot.dayIndex, 
      periodIndex: selectedSlot.periodIndex, 
      day: selectedSlot.day, 
      roomId: selectedRoom, 
      type: allocType, 
      details 
    }
    
    const res = await fetch('/api/admin/allocate-room', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include', 
      body: JSON.stringify(payload) 
    })
    
    if (!res.ok) {
      const d = await res.json().catch(()=>({}))
      return alert(d.message || 'Allocate failed')
    }
    
    await loadData() // Refresh all data
    setModalOpen(false)
  }

  async function deleteAllocation(id) {
    if (!confirm('Delete this allocation?')) return
    const r = await fetch(`/api/admin/allocate-room/${id}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    })
    if (!r.ok) return alert('Delete failed')
    await loadData() // Refresh all data
  }

  if (loading) return <div>Loading available rooms...</div>
  if (error) return <div className="error">{error}</div>
  if (!data.slots.length) return <div>No available room data found</div>

  // Group slots by day
  const byDay = data.slots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
    return acc
  }, {})

  // Check if a room is allocated for a specific slot
  const isRoomAllocated = (slot, roomId) => {
    return allocations?.allocations?.some(a => 
      Number(a.periodIndex) === Number(slot.periodIndex) && 
      Number(a.dayIndex) === Number(slot.dayIndex) &&
      a.roomId === roomId
    )
  }

  // Get allocation details for a room
  const getRoomAllocation = (slot, roomId) => {
    return allocations?.allocations?.find(a => 
      Number(a.periodIndex) === Number(slot.periodIndex) && 
      Number(a.dayIndex) === Number(slot.dayIndex) &&
      a.roomId === roomId
    )
  }

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>Available Rooms</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Click a room to allocate for class/event/exam (fixed time only)</p>
      </div>

      <div className="grid" style={{ gap: '1.5rem' }}>
        {Object.entries(byDay).map(([day, slots]) => (
          <div key={day} className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1e293b' }}>{day}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {slots.sort((a, b) => a.periodIndex - b.periodIndex).map((slot) => (
                <div 
                  key={`${slot.day}-${slot.periodIndex}`}
                  style={{
                    padding: '1rem',
                    background: 'rgba(102, 126, 234, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(102, 126, 234, 0.06)'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                    Period {slot.periodIndex}
                  </div>
                  <div style={{ color: '#64748b' }}>
                    {/* Current allocations */}
                    {allocations?.allocations?.filter(a => 
                      Number(a.periodIndex) === Number(slot.periodIndex) && 
                      Number(a.dayIndex) === Number(slot.dayIndex)
                    ).length > 0 && (
                      <div style={{ 
                        marginBottom: '0.75rem', 
                        background: 'rgba(99,102,241,0.03)', 
                        margin: '-.5rem -1rem .75rem', 
                        padding: '.5rem 1rem', 
                        borderBottom: '1px solid rgba(99,102,241,0.06)' 
                      }}>
                        <div style={{ fontSize: '.75rem', color: '#64748b', marginBottom: '.25rem' }}>
                          Current allocations:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                          {allocations.allocations
                            .filter(a => 
                              Number(a.periodIndex) === Number(slot.periodIndex) && 
                              Number(a.dayIndex) === Number(slot.dayIndex)
                            )
                            .map(a => (
                              <div key={a._id} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                gap: '.5rem',
                                background: 'white',
                                padding: '.25rem .5rem',
                                borderRadius: '4px',
                                fontSize: '.9rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                  <span style={{ color: '#475569' }}>{a.roomId}</span>
                                  <span style={{ color: '#64748b' }}>•</span>
                                  <span style={{ color: '#334155' }}>
                                    {a.type === 'class' && `${a.details.section} - ${a.details.facultyName || a.details.facultyId} (${a.details.subject || 'no subject'})`}
                                    {a.type === 'event' && a.details.description}
                                    {a.type === 'exam' && `${a.details.examType.toUpperCase()} - ${(a.details.sections || []).join(', ')}`}
                                  </span>
                                  <span style={{ color: '#64748b', marginLeft: '.25rem', fontSize: '.8rem' }}>
                                    ({Math.floor(a.details.durationMinutes/60)}h{' '}
                                    {a.details.durationMinutes%60 > 0 ? `${a.details.durationMinutes%60}m` : ''})
                                  </span>
                                </div>
                                <button 
                                  className="btn btn-ghost" 
                                  onClick={() => deleteAllocation(a._id)}
                                  style={{ padding: '0 .25rem' }}
                                >
                                  ✕
                                </button>
                              </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {slot.rooms?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {slot.rooms.map(room => {
                          const isAllocated = isRoomAllocated(slot, room)
                          const allocation = getRoomAllocation(slot, room)
                          
                          return (
                            <div key={room} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <button 
                                className="chip" 
                                onClick={() => isAllocated ? null : openAllocate(slot, room)}
                                style={{ 
                                  padding: '0.35rem .75rem', 
                                  borderRadius: '16px', 
                                  border: '1px solid rgba(102,126,234,0.18)', 
                                  background: isAllocated ? '#10b981' : 'white',
                                  color: isAllocated ? 'white' : '#1e293b',
                                  cursor: isAllocated ? 'default' : 'pointer',
                                  fontWeight: isAllocated ? '600' : 'normal'
                                }}
                                title={isAllocated ? `Allocated: ${allocation?.details?.section || allocation?.details?.description || allocation?.type}` : 'Click to allocate'}
                              >
                                {room}
                              </button>
                              {isAllocated && (
                                <button 
                                  className="btn btn-ghost" 
                                  onClick={() => deleteAllocation(allocation._id)}
                                  style={{ 
                                    padding: '0.15rem 0.25rem', 
                                    borderRadius: '50%',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  title="Deallocate room"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <em>No rooms available</em>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Allocation modal */}
      {modalOpen && selectedSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '8px', width: '560px', boxShadow: '0 12px 40px rgba(2,6,23,0.16)' }}>
            <h3 style={{ marginTop: 0 }}>Allocate room {selectedRoom} — Period {selectedSlot.periodIndex} ({selectedSlot.day})</h3>
            <div style={{ display: 'grid', gap: '.5rem' }}>
              <label>Type</label>
              <select value={allocType} onChange={e=>setAllocType(e.target.value)}>
                <option value="class">Class</option>
                <option value="event">Event</option>
                <option value="exam">Exam</option>
              </select>

              {allocType === 'class' && (
                <>
                  <label>Section</label>
                  <select value={classSection} onChange={e=>setClassSection(e.target.value)}>
                    <option value="">-- select section --</option>
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <label>Faculty</label>
                  <select value={classFaculty} onChange={e=>setClassFaculty(e.target.value)}>
                    <option value="">-- select faculty --</option>
                    {faculties.map(f => <option key={f._id} value={f._id}>{f.name} {f.teacherId?`(${f.teacherId})`:''}</option>)}
                  </select>
                  <label>Subject</label>
                  <input value={classSubject} onChange={e=>setClassSubject(e.target.value)} />
                </>
              )}

              {allocType === 'event' && (
                <>
                  <label>Event description</label>
                  <textarea value={eventDesc} onChange={e=>setEventDesc(e.target.value)} />
                </>
              )}

              {allocType === 'exam' && (
                <>
                  <label>Exam type</label>
                  <select value={examType} onChange={e=>setExamType(e.target.value)}>
                    <option value="t1">T1</option>
                    <option value="t4">T4</option>
                    <option value="t5">T5</option>
                  </select>
                  <label>Sections (add multiple)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                    {examSections.map((es, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '.5rem' }}>
                        <input value={es} onChange={e=>updateExamSection(idx, e.target.value)} placeholder="Section name" />
                        <button className="btn" onClick={()=>removeExamSection(idx)}>Remove</button>
                      </div>
                    ))}
                    <button className="btn" onClick={addExamSection}>Add section</button>
                  </div>
                </>
              )}

              <label>Duration</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input type="number" value={durationH} onChange={e=>setDurationH(e.target.value)} style={{ width: '60px' }} />
                <span>hours</span>
                <input type="number" value={durationM} onChange={e=>setDurationM(e.target.value)} style={{ width: '60px' }} />
                <span>minutes</span>
              </div>
            </div>
            <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'flex-end', gap: '.5rem' }}>
              <button className="btn" onClick={()=>setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAllocate}>Allocate</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}