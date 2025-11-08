import { useEffect, useState } from 'react'

export default function Analytics() {
  const [facultyLoad, setFacultyLoad] = useState([])

  useEffect(() => { (async () => {
    const res = await fetch('/api/admin/analytics/faculty-load', { credentials:'include' })
    if (res.ok) setFacultyLoad((await res.json()).series || [])
  })() }, [])

  return (
    <section>
      <h2>Analytics</h2>
      <div className="card">
        <h3>Faculty Load</h3>
        {facultyLoad.length === 0 ? <p>No data</p> : (
          <ul>{facultyLoad.map((s,i)=><li key={i}>{s.name}: {s.value}</li>)}</ul>
        )}
      </div>
    </section>
  )
}


