import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

const YEARS = [1,2,3,4]
const DAYS = ['Mon','Tue','Wed','Thu','Fri']

export default function GenerateTimetable() {
  const [departments, setDepartments] = useState(['CSE'])
  const [years, setYears] = useState([1])
  const [sections, setSections] = useState(['A'])
  const [mode, setMode] = useState('dry-run')
  const [seed, setSeed] = useState('')
  const [templateMap, setTemplateMap] = useState({ global: '' })
  const [templates, setTemplates] = useState([])
  const [jobId, setJobId] = useState('')
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)

  // Constraint panel (inline template)
  const [applyAll, setApplyAll] = useState(true)
  const [constraint, setConstraint] = useState({
    name: 'Inline Template',
    applyToAllYears: true,
    year: 1,
    startTime: '09:00', endTime: '17:00',
    periodLengthMin: 60, periodsPerDay: undefined,
    workingDays: ['Mon','Tue','Wed','Thu','Fri'],
    breakWindows: [],
    lunchWindow: { name:'Lunch', startTime:'12:30', endTime:'13:30', count:1, fixed:true },
    maxConsecutivePeriods: 4, minGapBetweenSameFaculty: 0, labContiguousMin: 0,
  })
  const [lockSlots, setLockSlots] = useState([])

  useEffect(() => { (async () => {
    const res = await fetch('/api/admin/timing-templates', { credentials: 'include' })
    if (res.ok) setTemplates(await res.json())
  })() }, [])

  const allYears = useMemo(() => years.length === YEARS.length, [years])

  function toggleYear(y) {
    setYears(prev => prev.includes(y) ? prev.filter(i=>i!==y) : [...prev, y])
  }

  async function startGenerate() {
    setLogs([])
    setRunning(true)
    const body = { departments, years, sections, timingTemplateIds: templateMap, mode, seed: seed? Number(seed) : undefined, options: { lockSlots } }
    const res = await fetch('/api/admin/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
    if (!res.ok) { setRunning(false); return }
    const { jobId } = await res.json();
    setJobId(jobId)
    const socket = io('/', { path: '/socket.io', query: { jobId } })
    socket.on('generation:progress', (d) => setLogs(l => [...l, d.message]))
    socket.on('generation:completed', (d) => { setLogs(l => [...l, 'Completed']); setRunning(false); socket.close(); })
    socket.on('generation:error', (d) => { setLogs(l => [...l, 'Error: ' + d.message]); setRunning(false); socket.close(); })
  }

  async function cancel() {
    if (!jobId) return
    await fetch(`/api/admin/generate/${jobId}/cancel`, { method: 'POST', credentials: 'include' })
  }

  return (
    <section>
      <div className="page-header">
        <div className="title">
          <h2>Generate Timetable</h2>
          <p>Choose scope and templates, then start the generation job</p>
        </div>
        <div className="toolbar">
          <button className="btn" disabled={!jobId} onClick={cancel}>Cancel Job</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Selection</h3>
          <div className="field"><label>Departments</label><input placeholder="e.g. CSE, ECE" value={departments.join(',')} onChange={e=>setDepartments(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} /></div>
          <div className="field"><label>Years</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5,auto)', gap:'.5rem'}}>
              <label><input type="checkbox" checked={allYears} onChange={e=> setYears(e.target.checked ? YEARS : [])} /> All</label>
              {YEARS.map(y => (
                <label key={y}><input type="checkbox" checked={years.includes(y)} onChange={()=>toggleYear(y)} /> Year {y}</label>
              ))}
            </div>
          </div>
          <div className="field"><label>Sections</label><input placeholder="e.g. A, B" value={sections.join(',')} onChange={e=>setSections(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} /></div>
        </div>
        <div className="card">
          <h3>Templates & Mode</h3>
          <div className="field"><label>Timing Template</label>
            <select value={templateMap.global} onChange={e=>setTemplateMap({ global: e.target.value })}>
              <option value="">(none)</option>
              {templates.map(t=> <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <details>
            <summary>Inline Constraints Editor</summary>
            <div className="field"><label title="Apply the same template to all years">Apply to all years</label>
              <input type="checkbox" checked={applyAll} onChange={e=>{ setApplyAll(e.target.checked); setConstraint(c=>({ ...c, applyToAllYears: e.target.checked })) }} />
            </div>
            {!applyAll && (
              <div className="field"><label>Year</label>
                <select value={constraint.year} onChange={e=> setConstraint(c=>({ ...c, year: Number(e.target.value) }))}>{YEARS.map(y=> <option key={y} value={y}>{y}</option>)}</select>
              </div>
            )}
            <div className="grid-2">
              <div className="field"><label>Start Time</label><input type="time" value={constraint.startTime} onChange={e=> setConstraint(c=>({ ...c, startTime: e.target.value }))} /></div>
              <div className="field"><label>End Time</label><input type="time" value={constraint.endTime} onChange={e=> setConstraint(c=>({ ...c, endTime: e.target.value }))} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label title="Either set period length or periods per day">Period length (min)</label><input type="number" value={constraint.periodLengthMin||''} onChange={e=> setConstraint(c=>({ ...c, periodLengthMin: Number(e.target.value)||undefined, periodsPerDay: undefined }))} /></div>
              <div className="field"><label>Periods per day</label><input type="number" value={constraint.periodsPerDay||''} onChange={e=> setConstraint(c=>({ ...c, periodsPerDay: Number(e.target.value)||undefined, periodLengthMin: undefined }))} /></div>
            </div>
            <div className="field"><label>Working days</label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(5,auto)', gap:'.5rem'}}>
                {DAYS.map(d => (
                  <label key={d}><input type="checkbox" checked={constraint.workingDays.includes(d)} onChange={e=> setConstraint(c=>({ ...c, workingDays: e.target.checked ? [...c.workingDays, d] : c.workingDays.filter(x=>x!==d) }))} /> {d}</label>
                ))}
              </div>
            </div>
            <div className="field"><label>Break windows</label>
              <button className="btn" onClick={()=> setConstraint(c=> ({ ...c, breakWindows: [...c.breakWindows, { name:'Break', startTime:'', endTime:'', count:1, fixed:false }] }))}>Add</button>
              <div style={{display:'grid', gap:'.5rem', marginTop:'.5rem'}}>
                {constraint.breakWindows.map((w, idx) => (
                  <div key={idx} style={{display:'grid', gridTemplateColumns:'1fr repeat(2, 1fr) 1fr auto auto', gap:'.25rem', alignItems:'center'}}>
                    <input placeholder="Name" value={w.name} onChange={e=> setConstraint(c=> { const bw=[...c.breakWindows]; bw[idx]={...bw[idx], name:e.target.value}; return {...c, breakWindows:bw} })} />
                    <input type="time" value={w.startTime} onChange={e=> setConstraint(c=> { const bw=[...c.breakWindows]; bw[idx]={...bw[idx], startTime:e.target.value}; return {...c, breakWindows:bw} })} />
                    <input type="time" value={w.endTime} onChange={e=> setConstraint(c=> { const bw=[...c.breakWindows]; bw[idx]={...bw[idx], endTime:e.target.value}; return {...c, breakWindows:bw} })} />
                    <input type="number" min="1" value={w.count||1} onChange={e=> setConstraint(c=> { const bw=[...c.breakWindows]; bw[idx]={...bw[idx], count:Number(e.target.value)||1}; return {...c, breakWindows:bw} })} />
                    <label style={{display:'inline-flex', alignItems:'center', gap:'.25rem'}}><input type="checkbox" checked={!!w.fixed} onChange={e=> setConstraint(c=> { const bw=[...c.breakWindows]; bw[idx]={...bw[idx], fixed:e.target.checked}; return {...c, breakWindows:bw} })} /> Fixed</label>
                    <button className="btn" onClick={()=> setConstraint(c=> ({ ...c, breakWindows: c.breakWindows.filter((_,i)=> i!==idx) }))}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Max consecutive per faculty</label><input type="number" value={constraint.maxConsecutivePeriods} onChange={e=> setConstraint(c=> ({ ...c, maxConsecutivePeriods: Number(e.target.value)||0 }))} /></div>
              <div className="field"><label>Min gap between same faculty (periods)</label><input type="number" value={constraint.minGapBetweenSameFaculty} onChange={e=> setConstraint(c=> ({ ...c, minGapBetweenSameFaculty: Number(e.target.value)||0 }))} /></div>
            </div>
            <div className="field"><label>Lab contiguous block (min periods)</label><input type="number" value={constraint.labContiguousMin} onChange={e=> setConstraint(c=> ({ ...c, labContiguousMin: Number(e.target.value)||0 }))} /></div>
            <div className="actions">
              <button className="btn" onClick={async ()=>{
                const res = await fetch('/api/admin/timing-templates', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(constraint) })
                if (res.ok) { const t = await res.json(); setTemplates(prev => [t, ...prev]); setTemplateMap({ global: t._id }) }
              }}>Save as template</button>
            </div>
          </details>
          <details style={{marginTop:'.5rem'}}>
            <summary>Pre-lock slots (optional)</summary>
            <div style={{display:'grid', gap:'.35rem', marginTop:'.5rem'}}>
              <button className="btn" onClick={()=> setLockSlots(s => [...s, { year: years[0]||1, day:'Mon', periodIndex:0, section:'A' }])}>Add lock</button>
              {lockSlots.map((ls, idx) => (
                <div key={idx} style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr) auto', gap:'.25rem'}}>
                  <input placeholder="Year" type="number" value={ls.year} onChange={e=> setLockSlots(arr=> { const a=[...arr]; a[idx]={...a[idx], year:Number(e.target.value)||1}; return a })} />
                  <input placeholder="Day" value={ls.day} onChange={e=> setLockSlots(arr=> { const a=[...arr]; a[idx]={...a[idx], day:e.target.value}; return a })} />
                  <input placeholder="Period Index" type="number" value={ls.periodIndex} onChange={e=> setLockSlots(arr=> { const a=[...arr]; a[idx]={...a[idx], periodIndex:Number(e.target.value)||0}; return a })} />
                  <input placeholder="Section" value={ls.section} onChange={e=> setLockSlots(arr=> { const a=[...arr]; a[idx]={...a[idx], section:e.target.value}; return a })} />
                  <button className="btn" onClick={()=> setLockSlots(arr=> arr.filter((_,i)=> i!==idx))}>Remove</button>
                </div>
              ))}
            </div>
          </details>
          <div className="field"><label>Run mode</label>
            <select value={mode} onChange={e=>setMode(e.target.value)}>
              <option value="dry-run">Dry-run</option>
              <option value="deterministic">Deterministic</option>
              <option value="randomized">Randomized</option>
            </select>
          </div>
          <div className="field"><label>Seed (optional)</label>
            <input type="number" value={seed} onChange={e=>setSeed(e.target.value)} />
          </div>
          <div className="actions">
            <button className="btn btn-primary" disabled={running} onClick={startGenerate}>Generate</button>
            <button className="btn" disabled={!running} onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:'1rem'}}>
        <h3>Progress</h3>
        <div style={{maxHeight:'240px', overflow:'auto', background:'#0b122005', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'.75rem'}}>
          <ul>
            {logs.map((l, i) => <li key={i} style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize:'.95rem'}}>{l}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}


