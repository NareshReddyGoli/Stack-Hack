import { useEffect, useState } from 'react'

export default function AvailableFaculty() {
  const [data, setData] = useState({ slots: [], timetableId: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFaculty, setModalFaculty] = useState(null)
  const [modalSlot, setModalSlot] = useState(null)
  const [sections, setSections] = useState([])
  const [sectionName, setSectionName] = useState('')
  const [room, setRoom] = useState('')
  const [allocations, setAllocations] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/available-faculty', { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to fetch available faculty')
        const data = await res.json()
        setData(data)
        
        // Load faculty allocations
        if (data?.timetableId) {
          try {
            const allocRes = await fetch(`/api/admin/room-allocations?timetableId=${data.timetableId}`, { credentials: 'include' })
            if (allocRes.ok) {
              const allocData = await allocRes.json()
              setAllocations(allocData.allocations || [])
            }
          } catch (_) {}
        }
        
        // Preload sections for the timetable if present
        if (data?.timetableId) {
          try {
            const rt = await fetch(`/api/admin/timetables/${data.timetableId}`, { credentials: 'include' })
            if (rt.ok) {
              const td = await rt.json()
              setSections((td.sections || []).map(s => s.sectionName))
            }
          } catch (_) {}
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Loading available faculty...</div>
  if (error) return <div className="error">{error}</div>
  if (!data.slots?.length) return (
    <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No available faculty data found</p>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Generate a new timetable to see available lecturers</p>
    </div>
  )

  // Group slots by day
  const byDay = data.slots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
    return acc
  }, {})

  // Check if faculty is allocated for a specific slot
  function isFacultyAllocated(facultyId, dayIndex, periodIndex) {
    return allocations.some(alloc => 
      alloc.type === 'class' &&
      alloc.dayIndex === dayIndex &&
      alloc.periodIndex === periodIndex &&
      alloc.details.facultyId === facultyId
    )
  }

  // Get faculty allocation details for a specific slot
  function getFacultyAllocation(facultyId, dayIndex, periodIndex) {
    return allocations.find(alloc => 
      alloc.type === 'class' &&
      alloc.dayIndex === dayIndex &&
      alloc.periodIndex === periodIndex &&
      alloc.details.facultyId === facultyId
    )
  }

  // Deallocate faculty
  async function deallocateFaculty(allocationId) {
    if (!allocationId) return
    if (!confirm('Are you sure you want to deallocate this faculty?')) return
    
    try {
      const res = await fetch(`/api/admin/allocate-room/${allocationId}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      })
      if (!res.ok) throw new Error('Deallocation failed')
      
      // Refresh data
      const refreshed = await (await fetch('/api/admin/available-faculty', { credentials: 'include' })).json()
      setData(refreshed)
      
      // Refresh allocations
      if (refreshed?.timetableId) {
        const allocRes = await fetch(`/api/admin/room-allocations?timetableId=${refreshed.timetableId}`, { credentials: 'include' })
        if (allocRes.ok) {
          const allocData = await allocRes.json()
          setAllocations(allocData.allocations || [])
        }
      }
    } catch (e) {
      alert(e.message || 'Failed to deallocate')
    }
  }

  function openAllocate(slot, faculty) {
    setModalSlot(slot)
    setModalFaculty(faculty)
    setSectionName(sections[0] || '')
    setRoom('')
    setModalOpen(true)
  }

  async function submitAllocate() {
    if (!modalSlot || !modalFaculty) return
    try {
      const payload = { timetableId: data.timetableId, sectionName, dayIndex: modalSlot.dayIndex, periodIndex: modalSlot.periodIndex, facultyId: modalFaculty.id, roomId: room }
      const res = await fetch('/api/admin/allocate-faculty', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Allocate failed')
      // Refresh available faculty list and close modal
      const refreshed = await (await fetch('/api/admin/available-faculty', { credentials: 'include' })).json()
      setData(refreshed)
      setModalOpen(false)
    } catch (e) {
      alert(e.message || 'Failed to allocate')
    }
  }

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>Available Faculty</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Overview of available lecturers by day and period</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(byDay).map(([day, slots]) => (
          <div key={day} className="card" style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 0.75rem', color: '#1e293b' }}>{day}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {slots.sort((a, b) => a.periodIndex - b.periodIndex).map((slot) => (
                <div key={`${slot.day}-${slot.periodIndex}`} style={{ padding: '0.5rem', borderRadius: '8px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>Period {slot.periodIndex}</div>
                    <div style={{ color: '#334155', fontSize: '.9rem' }}>({(slot.faculty || []).length} available)</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                    {(slot.faculty || []).length ? (slot.faculty || []).map((f) => {
                      const facultyId = f.id || f._id || f.teacherId
                      const isAllocated = isFacultyAllocated(facultyId, slot.dayIndex, slot.periodIndex)
                      const allocation = isAllocated ? getFacultyAllocation(facultyId, slot.dayIndex, slot.periodIndex) : null
                      
                      return (
                        <div key={f.id} style={{ position: 'relative' }}>
                          <button 
                            className="chip" 
                            title={(f.subjects || []).join(', ')} 
                            onClick={() => isAllocated ? null : openAllocate(slot, f)} 
                            style={{ 
                              padding: '.35rem .6rem', 
                              borderRadius: '999px', 
                              border: '1px solid #e2e8f0', 
                              background: isAllocated ? '#10b981' : 'white', 
                              color: isAllocated ? 'white' : 'inherit',
                              cursor: isAllocated ? 'default' : 'pointer',
                              position: 'relative'
                            }}
                          >
                            {f.name || f.teacherId || f.id} {f.teacherId ? `(${f.teacherId})` : ''}
                            {isAllocated && (
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deallocateFaculty(allocation._id)
                                }}
                                style={{
                                  marginLeft: '8px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  color: '#ef4444'
                                }}
                                title="Deallocate"
                              >
                                ✕
                              </span>
                            )}
                          </button>
                          {isAllocated && allocation && (
                            <div style={{ 
                              position: 'absolute', 
                              top: 'calc(100% + 6px)', 
                              left: 0, 
                              minWidth: '220px', 
                              padding: '.75rem', 
                              background: 'white', 
                              border: '1px solid #e2e8f0', 
                              borderRadius: '8px', 
                              boxShadow: '0 6px 18px rgba(2,6,23,0.08)', 
                              zIndex: 10 
                            }} className="tooltip">
                              <div style={{ fontWeight: 600, marginBottom: '.25rem', color: '#10b981' }}>✓ Allocated</div>
                              <div style={{ fontSize: '.85rem', color: '#334155', marginBottom: '.25rem' }}>
                                <strong>Section:</strong> {allocation.details.section}
                              </div>
                              <div style={{ fontSize: '.85rem', color: '#334155', marginBottom: '.25rem' }}>
                                <strong>Subject:</strong> {allocation.details.subject}
                              </div>
                              {allocation.details.roomId && (
                                <div style={{ fontSize: '.85rem', color: '#334155', marginBottom: '.5rem' }}>
                                  <strong>Room:</strong> {allocation.details.roomId}
                                </div>
                              )}
                              <div>
                                <button 
                                  className="btn" 
                                  onClick={() => deallocateFaculty(allocation._id)}
                                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                                >
                                  Deallocate
                                </button>
                              </div>
                            </div>
                          )}
                          {!isAllocated && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: '200px', padding: '.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', display: 'none' }} className="tooltip">
                              <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>{f.name || f.teacherId || f.id}</div>
                              <div style={{ fontSize: '.9rem', color: '#334155', marginBottom: '.5rem' }}>Subjects: {(f.subjects || []).join(', ') || '—'}</div>
                              <div><button className="btn" onClick={() => openAllocate(slot, f)}>Allocate</button></div>
                            </div>
                          )}
                        </div>
                      )
                    }) : <div style={{ color: '#64748b' }}><em>No faculty available</em></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Simple allocate modal */}
      {modalOpen && modalFaculty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '8px', width: '420px', boxShadow: '0 12px 40px rgba(2,6,23,0.16)' }}>
            <h3 style={{ marginTop: 0 }}>Allocate {modalFaculty.name || modalFaculty.teacherId || modalFaculty.id}</h3>
            <div style={{ display: 'grid', gap: '.5rem' }}>
              <label>Section</label>
              <select value={sectionName} onChange={e=>setSectionName(e.target.value)}>
                <option value="">-- select section --</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <label>Room (optional)</label>
              <input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Enter room number" />
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
