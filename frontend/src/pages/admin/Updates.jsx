import { useState, useEffect } from 'react';
import './Updates.css';

export default function Updates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [type, setType] = useState('all'); // all, class, event, exam

  useEffect(() => {
    fetchUpdates();
  }, [filter]);

  const [error, setError] = useState(null);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);
      const days = filter === 'today' ? 1 : 
                  filter === 'week' ? 7 :
                  filter === 'month' ? 30 : 7; // default to week
      
      console.log('Fetching updates for days:', days);
      
      const res = await fetch(`/api/admin/updates?days=${days}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch updates');
      }
      
      console.log('Received updates:', data);
      setUpdates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch updates error:', e);
      setError(e.message || 'Failed to fetch updates');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteUpdate = async (updateId) => {
    try {
      const res = await fetch(`/api/admin/updates/${updateId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete update');
      }
      
      // Remove the deleted update from the local state
      setUpdates(prevUpdates => prevUpdates.filter(update => update._id !== updateId));
      
      console.log('Update deleted successfully');
    } catch (e) {
      console.error('Delete update error:', e);
      alert('Failed to delete update: ' + e.message);
    }
  };

  const formatUpdate = (update) => {
    const details = update.details || {};
    switch (update.type) {
      case 'class':
        return `${details.section} - Period ${update.periodIndex} - ${details.facultyName || details.facultyId} - Room ${details.roomId} - ${details.subject}`;
      case 'event':
        return `Room ${details.roomId} - Event: "${details.eventName}" - Duration: ${details.duration} hour(s)`;
      case 'exam':
        return `${details.examType} exam - Room ${details.roomId} - Sections: ${(details.sections || []).join(', ')}`;
      default:
        return `Update type: ${update.type}`;
    }
  };

  const filteredUpdates = updates.filter(update => 
    type === 'all' || update.type === type
  );

  return (
    <div className="updates-container">
      <div className="updates-header">
        <h2>Recent Updates</h2>
        <div className="filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="class">Classes</option>
            <option value="event">Events</option>
            <option value="exam">Exams</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading updates...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="updates-list">
          {filteredUpdates.length === 0 ? (
            <div className="no-updates">No updates found</div>
          ) : (
            filteredUpdates.map(update => (
              <div key={update._id} className={`update-item ${update.type}`}>
                <div className="update-content">
                  <div className="update-text">{formatUpdate(update)}</div>
                  <div className="update-meta">
                    <span className="update-time">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                    <span className="update-type">
                      {update.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <button 
                  className="delete-update-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this update?')) {
                      deleteUpdate(update._id);
                    }
                  }}
                  title="Delete this update"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}