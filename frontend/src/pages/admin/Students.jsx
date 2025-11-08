import { useEffect, useState } from 'react'

export default function Students() {
  const [year, setYear] = useState('')
  const [section, setSection] = useState('')
  const [list, setList] = useState([])

  async function load() {
    const p = new URLSearchParams()
    if (year) p.set('year', year)
    if (section) p.set('section', section)
    const res = await fetch('/api/admin/students?'+p.toString(), { credentials:'include' })
    if (res.ok) setList(await res.json())
  }
  useEffect(()=>{ load() }, [year, section])

  return (
    <section>
      <h2>Students (section wise)</h2>
      <div className="card">
        <div className="grid-2">
          <div className="field"><label>Year</label><input value={year} onChange={e=>setYear(e.target.value)} placeholder="e.g. 3" /></div>
          <div className="field"><label>Section</label><input value={section} onChange={e=>setSection(e.target.value)} placeholder="e.g. A1" /></div>
        </div>
      </div>
      <div className="card" style={{marginTop:'.75rem'}}>
        <table width="100%">
          <thead><tr><th>Name</th><th>Reg No</th><th>Email</th><th>Year</th><th>Branch</th><th>Section</th></tr></thead>
          <tbody>
            {list.map(s => (
              <tr key={s._id}><td>{s.name}</td><td>{s.registration_no}</td><td>{s.email||'-'}</td><td>{s.year}</td><td>{s.branch||'-'}</td><td>{s.section}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}


