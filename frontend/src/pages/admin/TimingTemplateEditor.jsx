import { useEffect, useState } from 'react'

export default function TimingTemplateEditor() {
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name:'', applyToAllYears:true, year:1, startTime:'09:00', endTime:'17:00', periodLengthMin:60, workingDays:['Mon','Tue','Wed','Thu','Fri'], breakWindows:[], lunchWindow:{ name:'Lunch', startTime:'12:30', endTime:'13:30', count:1, fixed:true }, maxConsecutivePeriods:4 })

  function setField(k, v) { setForm(p=>({ ...p, [k]: v })) }

  async function load() {
    const res = await fetch('/api/admin/timing-templates', { credentials:'include' })
    if (res.ok) setList(await res.json())
  }
  useEffect(()=>{ load() }, [])

  async function create() {
    const res = await fetch('/api/admin/timing-templates', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) })
    if (res.ok) { setForm({ ...form, name:'' }); load() }
  }

  return (
    <section>
      <h2>Timing Templates</h2>
      <div className="grid-2">
        <div className="card">
          <h3>Create / Edit</h3>
          <div className="field"><label>Name</label><input value={form.name} onChange={e=>setField('name', e.target.value)} /></div>
          <div className="field"><label>Apply to all years</label><input type="checkbox" checked={form.applyToAllYears} onChange={e=>setField('applyToAllYears', e.target.checked)} /></div>
          {!form.applyToAllYears && (
            <div className="field"><label>Year</label><select value={form.year} onChange={e=>setField('year', Number(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></div>
          )}
          <div className="grid-2">
            <div className="field"><label>Start</label><input type="time" value={form.startTime} onChange={e=>setField('startTime', e.target.value)} /></div>
            <div className="field"><label>End</label><input type="time" value={form.endTime} onChange={e=>setField('endTime', e.target.value)} /></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Period length (min)</label><input type="number" value={form.periodLengthMin} onChange={e=>setField('periodLengthMin', Number(e.target.value))} /></div>
            <div className="field"><label>Max consecutive</label><input type="number" value={form.maxConsecutivePeriods} onChange={e=>setField('maxConsecutivePeriods', Number(e.target.value))} /></div>
          </div>
          <div className="actions"><button className="btn btn-primary" onClick={create}>Save Template</button></div>
        </div>
        <div className="card">
          <h3>Existing</h3>
          <ul>
            {list.map(t => <li key={t._id}>{t.name} {t.applyToAllYears ? '(All Years)' : `(Year ${t.year})`}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}


