export default function RowEditModal({ open, headers = [], row = {}, onClose, onSave }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>Edit Row</h3>
        <div className="grid-2">
          {headers.map(h => (
            <div className="field" key={h}>
              <label>{h}</label>
              <input value={row[h] ?? ''} onChange={e=> onSave({ ...row, [h]: e.target.value }, false)} />
            </div>
          ))}
        </div>
        <div className="actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=> onSave(row, true)}>Save</button>
        </div>
      </div>
    </div>
  )
}


