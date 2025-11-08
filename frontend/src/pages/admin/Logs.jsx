import { useEffect, useState } from 'react'

export default function Logs() {
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState(null)

  async function load() {
    if (!jobId) return
    const res = await fetch(`/api/admin/generate/${jobId}/status`, { credentials:'include' })
    if (res.ok) setStatus(await res.json())
  }
  useEffect(()=>{ load() }, [jobId])

  return (
    <section>
      <h2>Logs</h2>
      <div className="field"><label>Job ID</label><input value={jobId} onChange={e=>setJobId(e.target.value)} /></div>
      <div className="card" style={{marginTop:'.75rem'}}>
        <pre style={{whiteSpace:'pre-wrap'}}>{status?.logs?.join('\n') || 'No logs'}</pre>
      </div>
    </section>
  )
}


