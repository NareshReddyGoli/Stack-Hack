import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './NotificationBar.css';

const socket = io('/', { path: '/socket.io' });

export default function NotificationBar({ userRole, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Initial fetch of notifications
    fetchNotifications();

    // Socket event listeners
    socket.on('newNotification', handleNewNotification);
    socket.on('newEvent', handleNewEvent);
    if (userRole === 'admin') {
      socket.on('newAllocation', handleNewAllocation);
    }

    // Join user-specific room
    if (userId) {
      socket.emit('join', `user:${userId}`);
    }
    // Join role-specific room
    if (userRole) {
      socket.emit('join', `role:${userRole}`);
    }

    return () => {
      socket.off('newNotification');
      socket.off('newEvent');
      socket.off('newAllocation');
    };
  }, [userId, userRole]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include'
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (e) {
      console.error('Fetch notifications error:', e);
    }
  };

  const handleNewNotification = (data) => {
    setNotifications(prev => [data.notification, ...prev]);
    setUnreadCount(count => count + 1);
  };

  const handleNewEvent = (data) => {
    setNotifications(prev => [data.notification, ...prev]);
    setUnreadCount(count => count + 1);
  };

  const handleNewAllocation = (data) => {
    setNotifications(prev => [data.notification, ...prev]);
    setUnreadCount(count => count + 1);
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      });
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (e) {
      console.error('Mark as read error:', e);
    }
  };

  return (
    <div className="notification-bar">
      <button
        className="notification-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="clear-all"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}