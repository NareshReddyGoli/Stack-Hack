import Papa from 'papaparse'
import { useMemo, useState } from 'react'
import CSVParserPreview from '../../components/CSVParserPreview'
import RowEditModal from '../../components/RowEditModal'
import UploadProgress from '../../components/UploadProgress'
import '../../styles/csv-upload.css'

const CHUNK_SIZE = 500
const ENTITIES = ['faculty','courses','classrooms','sections','timing_templates','students']

export default function CSVUploadPage() {
  const [entity, setEntity] = useState('faculty')
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [invalidMap, setInvalidMap] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState({})
  const [editIdx, setEditIdx] = useState(-1)
  const [uploadId, setUploadId] = useState('')
  const [progress, setProgress] = useState({ total: 0, done: 0, valid: 0, invalid: 0, committing: false })
  const [message, setMessage] = useState('')

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setRows([]); setHeaders([]); setInvalidMap({})
    Papa.parse(f, { header: true, skipEmptyLines: true, complete: (res) => {
      const data = res.data || []
      const hdrs = res.meta?.fields || Object.keys(data[0] || {})
      setHeaders(hdrs)
      setRows(data)
    } })
  }

  function onEdit(idx, r) {
    setEditIdx(idx); setEditRow(r); setEditOpen(true)
  }

  function onSaveRow(row, close) {
    setRows(prev => prev.map((r,i) => i===editIdx ? row : r))
    if (close) setEditOpen(false)
  }

  async function startUpload() {
    setMessage('')
    const init = await fetch('/api/admin/upload/init', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ entityType: entity, filename: file?.name, totalRows: rows.length }) })
    if (!init.ok) { setMessage('Failed to init upload'); return }
    const { uploadId } = await init.json(); setUploadId(uploadId)
    const totalChunks = Math.ceil(rows.length / CHUNK_SIZE)
    setProgress({ total: totalChunks, done: 0, valid: 0, invalid: 0, committing: false })
    for (let i=0;i<totalChunks;i++) {
      const chunk = rows.slice(i*CHUNK_SIZE, (i+1)*CHUNK_SIZE)
      const res = await fetch('/api/admin/upload/chunk', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ uploadId, chunkIndex: i, entityType: entity, rows: chunk }) })
      if (!res.ok) { setMessage('Chunk failed'); break }
      const data = await res.json()
      setProgress(p => ({ ...p, done: i+1, valid: p.valid + (data.validCount||0), invalid: p.invalid + (data.invalidCount||0) }))
    }
  }

  async function commit() {
    if (!uploadId) return
    setProgress(p => ({ ...p, committing: true }))
    const res = await fetch('/api/admin/upload/commit', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ uploadId, apply: true }) })
    if (res.ok) { const d=await res.json(); setMessage('Committed: '+JSON.stringify(d.summary)); }
    else setMessage('Commit failed')
    setProgress(p => ({ ...p, committing: false }))
  }

  const previewRows = useMemo(() => rows.slice(0, 50), [rows])

  return (
    <section>
      <h2>CSV Upload</h2>
      <div className="card">
        <div className="grid-2">
          <div className="field"><label>Entity</label>
            <select value={entity} onChange={e=>setEntity(e.target.value)}>{ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}</select>
          </div>
          <div className="field"><label>CSV File</label>
            <input type="file" accept=".csv" onChange={onFileChange} />
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card" style={{marginTop:'.75rem'}}>
          <h3>Preview</h3>
          <CSVParserPreview headers={headers} rows={previewRows} invalidMap={invalidMap} onEdit={onEdit} />
          <div className="actions" style={{marginTop:'.75rem'}}>
            <button className="btn btn-primary" onClick={startUpload}>Upload (chunked)</button>
            <button className="btn" onClick={commit} disabled={!uploadId}>Commit</button>
            <a className="btn" href={`/api/admin/upload/${uploadId}/errors`} target="_blank" rel="noreferrer">Download errors CSV</a>
            <a className="btn" href={`/api/admin/samples?entityType=${entity}`} target="_blank" rel="noreferrer">Download sample</a>
          </div>
          <UploadProgress total={progress.total} done={progress.done} valid={progress.valid} invalid={progress.invalid} committing={progress.committing} />
          {message && <p>{message}</p>}
        </div>
      )}

      <RowEditModal open={editOpen} headers={headers} row={editRow} onClose={()=>setEditOpen(false)} onSave={(r, close)=> onSaveRow(r, close)} />
    </section>
  )
}


