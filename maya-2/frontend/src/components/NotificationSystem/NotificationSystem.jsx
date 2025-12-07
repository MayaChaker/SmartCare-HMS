import React, { useState, useEffect } from "react";
import "./NotificationSystem.css";

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: "appointment",
        title: "Appointment Reminder",
        message: "You have an appointment with Dr. Smith tomorrow at 10:00 AM",
        time: "2 hours ago",
        read: false,
        icon: "📅",
      },
      {
        id: 2,
        type: "medical",
        title: "Lab Results Available",
        message:
          "Your blood test results are now available in your medical records",
        time: "1 day ago",
        read: false,
        icon: "🧪",
      },
      {
        id: 3,
        type: "system",
        title: "Profile Updated",
        message: "Your profile information has been successfully updated",
        time: "3 days ago",
        read: true,
        icon: "✅",
      },
      {
        id: 4,
        type: "appointment",
        title: "Appointment Confirmed",
        message:
          "Your appointment with Dr. Johnson has been confirmed for next week",
        time: "1 week ago",
        read: true,
        icon: "✅",
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case "appointment":
        return "notification-appointment";
      case "medical":
        return "notification-medical";
      case "system":
        return "notification-system";
      default:
        return "notification-default";
    }
  };

  return (
    <div className="notification-system">
      {/* Notification Bell */}
      <div
        className="notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">📭</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getNotificationTypeClass(
                    notification.type
                  )} ${!notification.read ? "unread" : ""}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">{notification.icon}</div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <div className="unread-indicator"></div>
                    )}
                    <button
                      className="delete-notification-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="view-all-btn">View All Notifications</button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showNotifications && (
        <div
          className="notification-overlay"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </div>
  );
};

export default NotificationSystem;
