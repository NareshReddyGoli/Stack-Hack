export default function CSVParserPreview({ headers = [], rows = [], invalidMap = {}, onEdit }) {
  return (
    <div className="csv-preview">
      <table className="csv-table" width="100%">
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {headers.map(h => (
                <td key={h} className={invalidMap[idx]?.includes(h) ? 'cell-invalid' : ''}>
                  {String(r[h] ?? '')}
                </td>
              ))}
              <td><button className="btn" onClick={()=> onEdit?.(idx, r)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


