import { useEffect, useState } from 'react'

export default function FacultyManagement() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [departments, setDepartments] = useState('CSE')
  const [role, setRole] = useState('faculty')
  const [subjects, setSubjects] = useState('')
  const [password, setPassword] = useState('')
  const [list, setList] = useState([])

  async function load() {
    const res = await fetch('/api/admin/faculties', { credentials:'include' })
    if (res.ok) setList(await res.json())
  }
  useEffect(()=>{ load() }, [])

  async function create() {
    const res = await fetch('/api/admin/create-faculty', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ name, email, teacherId, departments: departments.split(',').map(s=>s.trim()).filter(Boolean), role, password, subjects: subjects.split(',').map(s=>s.trim()).filter(Boolean) })
    })
    if (res.ok) { setName(''); setEmail(''); setTeacherId(''); setPassword('') }
  }

  return (
    <section>
      <div className="page-header">
        <div className="title">
          <h2>Faculty Management</h2>
          <p>Create and manage faculty accounts and access</p>
        </div>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={create}>Create Faculty</button>
        </div>
      </div>

      <div className="card">
        <div className="grid-2">
          <div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="field"><label>Teacher ID</label><input value={teacherId} onChange={e=>setTeacherId(e.target.value)} /></div>
          <div className="field"><label>Departments</label><input value={departments} onChange={e=>setDepartments(e.target.value)} /></div>
          <div className="field"><label>Subjects</label><input placeholder="comma separated" value={subjects} onChange={e=>setSubjects(e.target.value)} /></div>
          <div className="field"><label>Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)}>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        </div>
        <div className="actions"><button className="btn" onClick={create}>Create</button></div>
      </div>

      <div className="card" style={{marginTop:'.75rem'}}>
        <h3>Existing Faculty</h3>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Teacher ID</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {list.map(f => (
              <tr key={f._id}>
                <td>{f.name}</td><td>{f.email}</td><td>{f.teacherId||'-'}</td><td>{f.role}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn" onClick={async ()=>{ const pw=prompt('New password for '+f.name); if(!pw) return; await fetch(`/api/admin/reset-faculty-password/${f._id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ password: pw }) }); }}>Reset Password</button>
                    <button className="btn btn-danger" onClick={async ()=>{ if(!confirm('Delete this faculty?')) return; const r = await fetch(`/api/admin/faculty/${f._id}`, { method: 'DELETE', credentials: 'include' }); if(r.ok){ load() } }}>Delete</button>
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


