import { useEffect, useState } from 'react'

export default function TimetableEditor() {
  const [timetable, setTimetable] = useState(null)
  const [ttId, setTtId] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id')
    if (id) { setTtId(id); load(id) }
  }, [])

  async function load(id) {
    const res = await fetch('/api/admin/timetables/'+id, { credentials: 'include' })
    if (res.ok) setTimetable(await res.json())
  }

  async function toggleLock(sectionName, day, periodIndex, locked) {
    if (!ttId) return
    await fetch(`/api/admin/timetables/${ttId}/lock-slot`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ sectionName, day, periodIndex, locked }) })
    load(ttId)
  }

  async function moveSlot(sectionName, from, to) {
    if (!ttId) return
    if (from.day === to.day && from.periodIndex === to.periodIndex) return
    await fetch(`/api/admin/timetables/${ttId}/move-slot`, {
      method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ sectionName, from, to })
    })
    load(ttId)
  }

  if (!timetable) return <section><h2>Timetable Editor</h2><p>Select a timetable from the list.</p></section>

  return (
    <section>
      <h2>Timetable Editor</h2>
      <p>{timetable.department} Year {timetable.year}</p>
      {timetable.sections.map(sec => (
        <div key={sec.sectionName} className="card" style={{marginBottom:'.75rem'}}>
          <h3>Section {sec.sectionName}</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'.5rem'}}>
            {sec.schedule.map(slot => (
              <div key={slot.day+slot.periodIndex} className="slot" draggable={!slot.locked}
                   onDragStart={(e)=> e.dataTransfer.setData('text/plain', JSON.stringify({ day: slot.day, periodIndex: slot.periodIndex }))}
                   onDragOver={(e)=> e.preventDefault()}
                   onDrop={(e)=> { e.preventDefault(); try { const from = JSON.parse(e.dataTransfer.getData('text/plain')); if (slot.locked) return; moveSlot(sec.sectionName, from, { day: slot.day, periodIndex: slot.periodIndex }); } catch(_){} }}
                   style={{border:'1px solid var(--color-border)', padding:'.5rem', borderRadius:'.5rem', opacity: slot.locked ? .6 : 1}}>
                <div>{slot.day} P{slot.periodIndex+1}</div>
                <div>{slot.courseId} / {slot.facultyId}</div>
                <div>Room {slot.roomId}</div>
                <button className="btn" onClick={()=>toggleLock(sec.sectionName, slot.day, slot.periodIndex, !slot.locked)}>{slot.locked ? 'Unlock' : 'Lock'}</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}


