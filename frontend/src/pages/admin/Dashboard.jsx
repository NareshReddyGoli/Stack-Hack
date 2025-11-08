import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ byYear: [], bySection: [] })
  useEffect(() => { (async () => {
    const res = await fetch('/api/admin/stats/students', { credentials:'include' })
    if (res.ok) setStats(await res.json())
  })() }, [])
  return (
    <section>
      <h2>Dashboard</h2>
      <div className="grid-2">
        <div className="card">
          <h3>Students by Year</h3>
          <table width="100%"><thead><tr><th>Year</th><th>Count</th></tr></thead>
            <tbody>{stats.byYear.map(r => <tr key={r.year}><td>{r.year}</td><td>{r.count}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="card">
          <h3>Students by Section</h3>
          <table width="100%"><thead><tr><th>Year</th><th>Section</th><th>Count</th></tr></thead>
            <tbody>{stats.bySection.map((r, i) => <tr key={i}><td>{r.year}</td><td>{r.section}</td><td>{r.count}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


