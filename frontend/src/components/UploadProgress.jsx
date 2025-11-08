export default function UploadProgress({ total = 0, done = 0, valid = 0, invalid = 0, committing = false }) {
  const percent = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="upload-progress">
      <div className="bar"><div className="bar-fill" style={{ width: percent+'%' }} /></div>
      <div className="nums">Chunks {done}/{total} • Valid {valid} • Invalid {invalid} {committing ? '• Committing…' : ''}</div>
    </div>
  )
}


