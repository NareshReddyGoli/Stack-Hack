import { useEffect, useState } from 'react'

export default function FacultyProfile(){
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [departments, setDepartments] = useState('')
  const [subjects, setSubjects] = useState('')
  const [message, setMessage] = useState('')

  useEffect(()=>{
    (async ()=>{
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' })
        if (!r.ok) throw new Error('Not authenticated')
        const d = await r.json()
        setRole(d?.role)
        setUser(d?.user)
        if (d?.user) {
          setName(d.user.name || '')
          setEmail(d.user.email || '')
          setDepartments((d.user.departments || []).join(','))
          setSubjects((d.user.subjects || []).join(','))
        }
      } catch (e) {
        // redirect handled by layout; just show nothing
      } finally { setLoading(false) }
    })()
  }, [])

  async function save() {
    setMessage('')
    try {
      if (role === 'faculty') {
        const res = await fetch('/api/faculty/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name, email, departments: departments.split(',').map(s=>s.trim()).filter(Boolean), subjects: subjects.split(',').map(s=>s.trim()).filter(Boolean) }) })
        if (!res.ok) throw new Error('Save failed')
        setMessage('Profile updated')
      } else if (role === 'student') {
        // For students we currently don't provide an update endpoint here; show message only
        setMessage('Student profile is read-only here')
      }
    } catch (e) {
      setMessage(e.message || 'Failed to save')
    }
  }

  if (loading) return (<section><h2>Profile</h2><p>Loading...</p></section>)

  if (!user) return (<section><h2>Profile</h2><p>Not found</p></section>)

  // Render student profile read-only for registration number
  if (role === 'student') {
    return (
      <section>
        <h2>Profile</h2>
        <div className="card">
          <div className="grid-2">
            <div className="field"><label>Name</label><input value={name} disabled /></div>
            <div className="field"><label>Registration No</label><input value={user.registration_no || ''} disabled /></div>
            <div className="field"><label>Email</label><input value={email} disabled /></div>
            <div className="field"><label>Year</label><input value={user.year || ''} disabled /></div>
            <div className="field"><label>Section</label><input value={user.section || ''} disabled /></div>
          </div>
        </div>
      </section>
    )
  }

  // Faculty profile (editable subjects)
  return (
    <section>
      <h2>Profile</h2>
      <div className="card">
        <div className="grid-2">
          <div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="field"><label>Departments</label><input value={departments} onChange={e=>setDepartments(e.target.value)} /></div>
          <div className="field"><label>Subjects</label><input placeholder="comma separated" value={subjects} onChange={e=>setSubjects(e.target.value)} /></div>
        </div>
        <div className="actions" style={{marginTop:'.5rem'}}>
          <button className="btn btn-primary" onClick={save}>Save</button>
          <span style={{marginLeft:'.75rem'}}>{message}</span>
        </div>
      </div>
    </section>
  )
}


