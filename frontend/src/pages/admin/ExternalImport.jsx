import { useEffect, useState } from 'react'

export default function ExternalImport() {
  const [datasets, setDatasets] = useState([])
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => { (async () => {
    const res = await fetch('/api/admin/external/datasets', { credentials:'include' })
    if (res.ok) setDatasets((await res.json()).datasets || [])
  })() }, [])

  async function runImport() {
    setStatus('')
    if (!selected) return
    const res = await fetch('/api/admin/external/import', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ dataset: selected }) })
    if (res.ok) setStatus('Imported successfully')
    else setStatus('Import failed')
  }

  return (
    <section>
      <h2>External Import</h2>
      <div className="card">
        <div className="field"><label>Dataset</label>
          <select value={selected} onChange={e=>setSelected(e.target.value)}>
            <option value="">Select a dataset</option>
            {datasets.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="actions"><button className="btn btn-primary" onClick={runImport} disabled={!selected}>Import</button></div>
        {status && <p>{status}</p>}
      </div>
    </section>
  )
}


