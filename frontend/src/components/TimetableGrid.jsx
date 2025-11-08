import './TimetableGrid.css'

export default function TimetableGrid({ schedule, showFaculty = true, showSection = false }) {
  // Build day x period grid
  const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const days = Array.from(new Set(schedule.map(s => s.day))).sort((a,b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
  
  // Always show all 9 periods for consistency
  const totalPeriods = 9
  const offset = -1 // Data is 1-based, normalize to 0-based for display

  const byKey = new Map()
  for (const slot of schedule) {
    const p = Number(slot.periodIndex)
    const idx = Number.isFinite(p) ? p + offset : -1
    if (idx >= 0) byKey.set(`${slot.day}|${idx}`, slot)
  }

  const BREAK_INDEX = 2 // After P2
  const LUNCH_INDEX = 6 // After P6
  const headers = Array.from({ length: totalPeriods }, (_, i) => {
    if (i === BREAK_INDEX) return 'BREAK'
    if (i === LUNCH_INDEX) return 'LUNCH'
    return `P${i + 1}`
  })

  function formatCell(slot) {
    // Treat missing or explicitly empty slots as empty for display purposes
    if (!slot || slot.isEmpty) return ''
    const parts = []
    
    // Course code (subject)
    if (slot.courseId || slot.courseCode) {
      parts.push(slot.courseId || slot.courseCode)
    }
    
    // Faculty (teacher name or ID)
    if (showFaculty && (slot.facultyName || slot.facultyId)) {
      parts.push(`(${slot.facultyName || slot.facultyId})`)
    }
    
    // Section - for faculty timetables, show section prominently
    if (showSection && slot.section) {
      if (!parts.length) { // If no course code, start with section
        parts.push(slot.section)
      } else {
        parts.push(`[${slot.section}]`)
      }
    }
    
    // Type (lecture/lab) - only show if there's an explicit kind or other content
    if (slot.kind || parts.length > 0) {
      const slotType = slot.kind || (slot.courseId?.toLowerCase().includes('lab') ? 'lab' : 'lecture')
      parts.push(`(${slotType})`)
    }
    
    // Room
    if (slot.roomId || slot.room) {
      parts.push(`@${slot.roomId || slot.room}`)
    }
    
    return parts.join(' ')
  }

  return (
    <div className="timetable-container">
      <table className="timetable-modern">
        <thead>
          <tr>
            <th className="day-header">Day</th>
            {headers.map((h, i) => (
              <th key={i} className={h === 'BREAK' || h === 'LUNCH' ? 'special-header' : ''}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td className="day-cell">{day}</td>
              {(() => {
                const cells = []
                let idx = 0
                while (idx < headers.length) {
                  if (idx === BREAK_INDEX) {
                    cells.push(<td key={day + idx} className="break-cell">BREAK</td>)
                    idx++
                    continue
                  }
                  if (idx === LUNCH_INDEX) {
                    cells.push(<td key={day + idx} className="lunch-cell">LUNCH</td>)
                    idx++
                    continue
                  }
                  
                  const slot = byKey.get(`${day}|${idx}`)
                  const text = formatCell(slot)
                  
                  // Check for lab spanning multiple periods
                  let span = 1
                  const isLab = /lab/i.test(slot?.kind || text)
                  if (isLab && text) {
                    let j = idx + 1
                    while (j < headers.length && j !== BREAK_INDEX && j !== LUNCH_INDEX) {
                      const next = byKey.get(`${day}|${j}`)
                      const nextText = formatCell(next)
                      if (/lab/i.test(next?.kind || nextText) && nextText === text) {
                        span++
                        j++
                      } else {
                        break
                      }
                    }
                  }
                  
                  cells.push(
                    <td 
                      key={day + idx} 
                      colSpan={span}
                      className={
                        !text ? 'empty-cell' :
                        slot?.conflict ? 'conflict-cell' :
                        isLab ? 'lab-cell' : 'lecture-cell'
                      }
                    >
                      <div className="cell-content">
                        {text || 'Free Period'}
                      </div>
                    </td>
                  )
                  idx += span
                }
                return cells
              })()}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
