import { useEffect, useMemo, useState } from 'react'
import TimetableGrid from '../../components/TimetableGrid'

export default function TimetablePreview() {
  const [tt, setTt] = useState(null)
  const [tab, setTab] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ (async ()=>{
    const id = new URLSearchParams(location.search).get('id')
    if (!id) return
    try {
      const res = await fetch('/api/admin/timetables/'+id, { credentials:'include' })
      if (res.ok) {
        const data = await res.json()
        setTt(data)
        setTab(data?.sections?.[0]?.sectionName || '')
      }
    } finally {
      setLoading(false)
    }
  })() }, [])

  const sections = useMemo(()=> tt?.sections || [], [tt])

  if (loading) return (
    <section>
      <h2>Timetable Preview</h2>
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        <p>Loading timetable...</p>
      </div>
    </section>
  )

  if (!tt) return (
    <section>
      <h2>Timetable Preview</h2>
      <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <p style={{ color: '#64748b' }}>Timetable not found</p>
      </div>
    </section>
  )

  return (
    <section>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '2rem' }}>Timetable Preview</h2>
        <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>View and compare section schedules</p>
      </div>
      
      <div className="tabs" role="tablist" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button 
            key={s.sectionName} 
            role="tab" 
            aria-selected={tab===s.sectionName} 
            className={`tab ${tab===s.sectionName?'active':''}`}
            onClick={()=>setTab(s.sectionName)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: tab===s.sectionName ? '2px solid #667eea' : '2px solid transparent',
              background: tab===s.sectionName ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
              color: tab===s.sectionName ? 'white' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: tab===s.sectionName ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            {s.sectionName}
          </button>
        ))}
      </div>
      
      {sections.filter(s=>s.sectionName===tab).map(s => (
        <TimetableGrid key={s.sectionName} schedule={s.schedule} showFaculty={true} />
      ))}
    </section>
  )
}
