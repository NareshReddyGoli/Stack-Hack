import { useEffect, useState } from 'react'

export default function FacultyNotifications(){
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async ()=>{
    try {
      const res = await fetch('/api/notifications', { credentials:'include' });
      if (res.ok) setList(await res.json())
    } finally {
      setLoading(false)
    }
  })() }, [])

  return (
    <section>
      <div className="page-header">
        <div className="title">
          <h2>Notifications</h2>
          <p>Latest updates relevant to your schedule</p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding:'1rem', color:'#64748b' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding:'1rem', color:'#64748b' }}>No notifications.</div>
      ) : (
        <div className="card">
          <ul style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:'.6rem' }}>
            {list.map(n => (
              <li key={n._id} style={{ padding:'.75rem 1rem', border:'1px solid #e2e8f0', borderRadius:'10px', background:'#fff' }}>
                <div style={{ fontWeight:800, color:'#1e293b' }}>{n.title || 'Notice'}</div>
                <div style={{ color:'#475569', marginTop:'.25rem' }}>{n.message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}


