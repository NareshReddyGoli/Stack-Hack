import { useEffect, useState } from 'react'

export default function TimetableList() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')

  async function load() {
    const p = new URLSearchParams()
    if (status) p.set('status', status)
    if (department) p.set('department', department)
    if (year) p.set('year', year)
    const res = await fetch('/api/admin/timetables?'+p.toString(), { credentials: 'include' })
    if (res.ok) setList(await res.json())
  }
  useEffect(()=>{ load() }, [status, department, year])

  async function publish(id) {
    await fetch(`/api/admin/timetables/${id}/publish`, { method:'POST', credentials:'include' })
    load()
  }

  async function deleteTimetable(id) {
    if (!confirm('Are you sure you want to delete this timetable? This will remove all related data and cannot be undone.')) {
      return
    }
    try {
      const res = await fetch(`/api/admin/timetables/${id}`, { 
        method: 'DELETE', 
        credentials: 'include'
      })
      if (res.ok) {
        load() // Refresh the list after successful deletion
      } else {
        alert('Failed to delete timetable')
      }
    } catch (e) {
      console.error('Delete failed:', e)
      alert('Failed to delete timetable')
    }
  }

  return (
    <section>
      <div className="page-header">
        <div className="title">
          <h2>Timetable List</h2>
          <p>Browse, publish, or delete generated timetables</p>
        </div>
        <div className="toolbar">
          <a className="btn" href="/admin/generate">Generate</a>
        </div>
      </div>

      <div className="card filters-card">
        <div className="filters-row">
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="field">
            <label>Department</label>
            <input placeholder="e.g. CSE" value={department} onChange={e=>setDepartment(e.target.value)} />
          </div>
          <div className="field">
            <label>Year</label>
            <input placeholder="1/2/3/4" value={year} onChange={e=>setYear(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:'1rem'}}>
        <table className="data-table">
          <thead>
            <tr><th>Department</th><th>Year</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(tt => (
              <tr key={tt._id}>
                <td>{tt.department === 'python-scheduler' ? 'CSE' : tt.department}</td>
                <td>{tt.year}</td>
                <td>{tt.status}</td>
                <td>
                  <div className="btn-group">
                    <a className="btn" href={`/admin/preview?id=${tt._id}`}>View</a>
                    <a className="btn" href={`/admin/editor?id=${tt._id}`}>Edit</a>
                    {tt.status !== 'published' && <button className="btn btn-success" onClick={()=>publish(tt._id)}>Publish</button>}
                    <button className="btn btn-danger" onClick={() => deleteTimetable(tt._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}


